import { BadGatewayException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProvider,
  GenerateStructuredOutputInput,
  GenerateStructuredOutputResult,
} from './ai-provider.interface';

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
  }>;
  usageMetadata?: GeminiUsageMetadata;
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

    const model = input.model ?? this.configService.get<string>('GEMINI_MODEL', 'gemini-1.5-flash');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new BadGatewayException(
        `Gemini request failed with ${response.status}: ${errorBody.slice(0, 300)}`,
      );
    }

    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new BadGatewayException('Gemini response did not contain text output');
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
}
