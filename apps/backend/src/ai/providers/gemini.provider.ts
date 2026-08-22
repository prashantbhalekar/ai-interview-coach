import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProvider,
  GenerateStructuredOutputInput,
  GenerateStructuredOutputResult,
} from './ai-provider.interface';
import { type GeminiProviderErrorDetails, GeminiProviderException } from './gemini-provider.error';

interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
    finishMessage?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  usageMetadata?: GeminiUsageMetadata;
}

interface GeminiErrorResponse {
  error?: {
    code?: string | number;
    status?: string;
    message?: string;
  };
}

@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;

  constructor(private readonly configService: ConfigService) {}

  async generateStructuredOutput(
    input: GenerateStructuredOutputInput,
  ): Promise<GenerateStructuredOutputResult> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';

    if (!apiKey) {
      throw new ServiceUnavailableException('GEMINI_API_KEY is not configured');
    }

    const model =
      input.model ?? this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash-lite');
    const timeoutMs =
      input.timeoutMs ?? this.configService.get<number>('GEMINI_REQUEST_TIMEOUT_MS', 30_000);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            temperature: input.temperature ?? 0.2,
            responseMimeType: 'application/json',
            ...(input.responseJsonSchema ? { responseJsonSchema: input.responseJsonSchema } : {}),
          },
        }),
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (this.isAbortError(error)) {
        throw new GeminiProviderException({
          httpStatus: 504,
          providerCode: 'timeout',
          providerStatus: 'TIMEOUT',
          safeMessage: `Gemini request timed out after ${timeoutMs}ms`,
          retriable: true,
        });
      }

      throw new GeminiProviderException({
        httpStatus: 503,
        providerCode: 'service_unavailable',
        providerStatus: 'NETWORK_ERROR',
        safeMessage: 'Gemini service is currently unavailable',
        retriable: true,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw await this.toNormalizedError(response);
    }

    const payload = await this.parseGeminiSuccessResponse(response);
    const text = this.extractTextFromCandidates(payload);

    if (!text) {
      throw new GeminiProviderException({
        httpStatus: 502,
        providerCode: 'malformed_provider_response',
        providerStatus: 'MISSING_TEXT',
        safeMessage: 'Gemini returned no usable text output',
        retriable: false,
      });
    }

    const usage: {
      inputTokens?: number;
      outputTokens?: number;
    } = {};

    if (payload.usageMetadata?.promptTokenCount !== undefined) {
      usage.inputTokens = payload.usageMetadata.promptTokenCount;
    }

    if (payload.usageMetadata?.candidatesTokenCount !== undefined) {
      usage.outputTokens = payload.usageMetadata.candidatesTokenCount;
    }

    return {
      provider: this.name,
      model,
      text,
      ...(Object.keys(usage).length > 0 ? { usage } : {}),
    };
  }

  private async parseGeminiSuccessResponse(response: Response): Promise<GeminiResponse> {
    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      throw new GeminiProviderException({
        httpStatus: 502,
        providerCode: 'malformed_provider_response',
        providerStatus: 'INVALID_JSON',
        safeMessage: 'Gemini returned malformed JSON',
        retriable: false,
      });
    }

    if (!payload || typeof payload !== 'object') {
      throw new GeminiProviderException({
        httpStatus: 502,
        providerCode: 'malformed_provider_response',
        providerStatus: 'INVALID_STRUCTURE',
        safeMessage: 'Gemini returned an unexpected response structure',
        retriable: false,
      });
    }

    return payload as GeminiResponse;
  }

  private extractTextFromCandidates(payload: GeminiResponse): string | null {
    const candidates = payload.candidates;

    if (!Array.isArray(candidates) || candidates.length === 0) {
      if (payload.promptFeedback?.blockReason) {
        throw new GeminiProviderException({
          httpStatus: 502,
          providerCode: 'content_blocked',
          providerStatus: payload.promptFeedback.blockReason,
          safeMessage: `Gemini blocked the request: ${payload.promptFeedback.blockReason}`,
          retriable: false,
        });
      }

      throw new GeminiProviderException({
        httpStatus: 502,
        providerCode: 'malformed_provider_response',
        providerStatus: 'MISSING_CANDIDATES',
        safeMessage: 'Gemini returned no candidates',
        retriable: false,
      });
    }

    for (const candidate of candidates) {
      const parts = candidate.content?.parts;
      if (!Array.isArray(parts)) {
        continue;
      }

      for (const part of parts) {
        if (typeof part?.text === 'string' && part.text.trim().length > 0) {
          return part.text;
        }
      }
    }

    const finishStatus = candidates[0]?.finishReason ?? 'UNKNOWN';
    const finishMessage = candidates[0]?.finishMessage;

    throw new GeminiProviderException({
      httpStatus: 502,
      providerCode: 'malformed_provider_response',
      providerStatus: finishStatus,
      safeMessage: finishMessage ?? 'Gemini candidate text was missing',
      retriable: false,
    });
  }

  private async toNormalizedError(response: Response): Promise<GeminiProviderException> {
    const responseText = await response.text();
    const parsedError = this.tryParseGeminiError(responseText);

    const details = this.normalizeGeminiError(response.status, parsedError);
    return new GeminiProviderException(details);
  }

  private tryParseGeminiError(responseText: string): GeminiErrorResponse | null {
    if (!responseText) {
      return null;
    }

    try {
      const parsed = JSON.parse(responseText) as unknown;
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }
      return parsed as GeminiErrorResponse;
    } catch {
      return null;
    }
  }

  private normalizeGeminiError(
    httpStatus: number,
    parsedError: GeminiErrorResponse | null,
  ): GeminiProviderErrorDetails {
    const providerCode = this.normalizeProviderCode(parsedError?.error?.code, httpStatus);
    const providerStatus = parsedError?.error?.status ?? this.statusToProviderStatus(httpStatus);

    if (providerCode === 'authentication' || providerCode === 'permission_denied') {
      return {
        httpStatus,
        providerCode,
        providerStatus,
        safeMessage: 'Gemini authentication or permission failed',
        retriable: false,
      };
    }

    if (providerCode === 'invalid_request' || providerCode === 'failed_precondition') {
      return {
        httpStatus,
        providerCode,
        providerStatus,
        safeMessage: 'Gemini rejected the request payload',
        retriable: false,
      };
    }

    if (providerCode === 'rate_limit_exceeded' || providerCode === 'quota_exceeded') {
      return {
        httpStatus,
        providerCode,
        providerStatus,
        safeMessage: 'Gemini rate limit or quota exceeded; retry later',
        retriable: true,
      };
    }

    if (
      httpStatus >= 500 ||
      providerCode === 'api_error' ||
      providerCode === 'service_unavailable'
    ) {
      return {
        httpStatus,
        providerCode,
        providerStatus,
        safeMessage: 'Gemini service is temporarily unavailable',
        retriable: true,
      };
    }

    return {
      httpStatus,
      providerCode,
      providerStatus,
      safeMessage: 'Gemini request failed',
      retriable: false,
    };
  }

  private normalizeProviderCode(code: string | number | undefined, httpStatus: number): string {
    if (typeof code === 'string' && code.trim().length > 0) {
      return code;
    }

    return this.statusToProviderCode(httpStatus);
  }

  private statusToProviderCode(httpStatus: number): string {
    if (httpStatus === 400) {
      return 'invalid_request';
    }

    if (httpStatus === 401) {
      return 'authentication';
    }

    if (httpStatus === 403) {
      return 'permission_denied';
    }

    if (httpStatus === 404) {
      return 'not_found';
    }

    if (httpStatus === 429) {
      return 'rate_limit_exceeded';
    }

    if (httpStatus === 503) {
      return 'service_unavailable';
    }

    if (httpStatus === 504) {
      return 'deadline_exceeded';
    }

    if (httpStatus >= 500) {
      return 'api_error';
    }

    return 'request_failed';
  }

  private statusToProviderStatus(httpStatus: number): string {
    if (httpStatus === 400) {
      return 'BAD_REQUEST';
    }

    if (httpStatus === 401) {
      return 'UNAUTHORIZED';
    }

    if (httpStatus === 403) {
      return 'FORBIDDEN';
    }

    if (httpStatus === 404) {
      return 'NOT_FOUND';
    }

    if (httpStatus === 429) {
      return 'TOO_MANY_REQUESTS';
    }

    if (httpStatus === 503) {
      return 'SERVICE_UNAVAILABLE';
    }

    if (httpStatus === 504) {
      return 'DEADLINE_EXCEEDED';
    }

    if (httpStatus >= 500) {
      return 'SERVER_ERROR';
    }

    return 'REQUEST_FAILED';
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }
}
