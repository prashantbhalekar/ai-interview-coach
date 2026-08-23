import {
  BadGatewayException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ZodError, ZodSchema } from 'zod';
import { AI_PROVIDER_REGISTRY } from './ai.constants';
import { AiUsageService } from './ai-usage.service';
import { buildResumeAnalysisPrompt } from './prompts/resume-analysis.prompt';
import {
  type AiProvider,
  type AiProviderName,
  type GenerateStructuredOutputResult,
} from './providers/ai-provider.interface';
import {
  resumeAnalysisJsonSchema,
  resumeAnalysisSchema,
  type ResumeAnalysisResult,
} from './schemas/resume-analysis.schema';

interface AnalyzeResumeInput {
  userId: string;
  resumeText: string;
  jobDescription: string;
}

interface AnalyzeResumeOutput {
  provider: AiProviderName;
  model: string;
  result: ResumeAnalysisResult;
}

interface CacheEntry {
  value: AnalyzeResumeOutput;
  expiresAt: number;
}

@Injectable()
export class AiService {
  private readonly resumeAnalysisCache = new Map<string, CacheEntry>();

  constructor(
    private readonly configService: ConfigService,
    private readonly aiUsageService: AiUsageService,
    @Inject(AI_PROVIDER_REGISTRY)
    private readonly providerRegistry: Record<string, AiProvider>,
  ) {}

  async analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
    const cacheKey = this.getResumeAnalysisCacheKey(input);
    const cachedResponse = this.getCachedResumeAnalysis(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const provider = this.resolveProvider();
    const prompt = buildResumeAnalysisPrompt({
      resumeText: input.resumeText,
      jobDescription: input.jobDescription,
    });

    const startTime = Date.now();
    let providerResult: GenerateStructuredOutputResult | null = null;

    try {
      providerResult = await provider.generateStructuredOutput({
        operation: 'resume_analysis',
        schemaName: 'ResumeAnalysisResult',
        prompt,
        responseJsonSchema: resumeAnalysisJsonSchema,
      });

      const parsed = this.parseStructuredOutput(providerResult.text, resumeAnalysisSchema);

      await this.aiUsageService.recordSuccess({
        userId: input.userId,
        provider: providerResult.provider,
        model: providerResult.model,
        operation: 'resume_analysis',
        latencyMs: Date.now() - startTime,
        promptChars: prompt.length,
        responseChars: providerResult.text.length,
        ...(providerResult.usage ? { usage: providerResult.usage } : {}),
      });

      const response = {
        provider: providerResult.provider,
        model: providerResult.model,
        result: parsed,
      };

      this.cacheResumeAnalysis(cacheKey, response);

      return response;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown AI failure';
      const fallbackModel = this.getConfiguredModel(provider.name);

      await this.aiUsageService.recordFailure({
        userId: input.userId,
        provider: provider.name,
        model: providerResult?.model ?? fallbackModel,
        operation: 'resume_analysis',
        latencyMs: Date.now() - startTime,
        promptChars: prompt.length,
        errorMessage: message,
      });

      throw error;
    }
  }

  private resolveProvider(): AiProvider {
    const providerName = this.configService.get<string>('AI_PROVIDER', 'gemini');
    const provider = this.providerRegistry[providerName];

    if (!provider) {
      throw new ServiceUnavailableException(`Unsupported AI_PROVIDER ${providerName}`);
    }

    return provider;
  }

  private parseStructuredOutput<T>(rawText: string, schema: ZodSchema<T>): T {
    const candidate = this.extractJsonCandidate(rawText);

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(candidate);
    } catch {
      throw new BadGatewayException('AI response is not valid JSON');
    }

    try {
      return schema.parse(parsedJson);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new BadGatewayException(`AI response failed schema validation: ${error.message}`);
      }
      throw error;
    }
  }

  private extractJsonCandidate(rawText: string): string {
    const trimmed = rawText.trim();

    if (trimmed.startsWith('```')) {
      const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenced?.[1]) {
        return fenced[1].trim();
      }
    }

    return trimmed;
  }

  private getConfiguredModel(provider: AiProviderName): string {
    if (provider === 'gemini') {
      return this.configService.get<string>('GEMINI_MODEL', 'gemini-2.5-flash-lite');
    }

    if (provider === 'openai') {
      return this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    }

    return this.configService.get<string>('OLLAMA_MODEL', 'llama3.1:8b');
  }

  private getResumeAnalysisCacheKey(input: AnalyzeResumeInput): string {
    const normalized = {
      userId: input.userId,
      resumeText: input.resumeText.trim(),
      jobDescription: input.jobDescription.trim(),
    };

    return createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  }

  private getCachedResumeAnalysis(cacheKey: string): AnalyzeResumeOutput | null {
    const ttlMs = this.configService.get<number>('AI_RESUME_ANALYSIS_CACHE_TTL_MS', 120000);
    if (ttlMs <= 0) {
      return null;
    }

    const cached = this.resumeAnalysisCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      this.resumeAnalysisCache.delete(cacheKey);
      return null;
    }

    return cached.value;
  }

  private cacheResumeAnalysis(cacheKey: string, value: AnalyzeResumeOutput): void {
    const ttlMs = this.configService.get<number>('AI_RESUME_ANALYSIS_CACHE_TTL_MS', 120000);
    if (ttlMs <= 0) {
      return;
    }

    const maxEntries = this.configService.get<number>('AI_RESUME_ANALYSIS_CACHE_MAX_ENTRIES', 200);
    if (this.resumeAnalysisCache.size >= maxEntries) {
      const oldestKey = this.resumeAnalysisCache.keys().next().value;
      if (oldestKey) {
        this.resumeAnalysisCache.delete(oldestKey);
      }
    }

    this.resumeAnalysisCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
}
