import {
  BadGatewayException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
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

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly aiUsageService: AiUsageService,
    @Inject(AI_PROVIDER_REGISTRY)
    private readonly providerRegistry: Record<string, AiProvider>,
  ) {}

  async analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
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

      return {
        provider: providerResult.provider,
        model: providerResult.model,
        result: parsed,
      };
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
}
