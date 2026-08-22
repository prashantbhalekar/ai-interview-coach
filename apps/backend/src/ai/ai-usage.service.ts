import { Injectable } from '@nestjs/common';
import { AiProvider as PrismaAiProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AiProviderName, AiUsageMeta } from './providers/ai-provider.interface';

interface AiUsageSuccessInput {
  userId: string;
  provider: AiProviderName;
  model: string;
  operation: string;
  latencyMs: number;
  promptChars: number;
  responseChars: number;
  usage?: AiUsageMeta;
}

interface AiUsageFailureInput {
  userId: string;
  provider: AiProviderName;
  model: string;
  operation: string;
  latencyMs: number;
  promptChars: number;
  errorMessage: string;
}

@Injectable()
export class AiUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async recordSuccess(input: AiUsageSuccessInput): Promise<void> {
    const usageData: {
      inputTokens?: number;
      outputTokens?: number;
    } = {};

    if (input.usage?.inputTokens !== undefined) {
      usageData.inputTokens = input.usage.inputTokens;
    }

    if (input.usage?.outputTokens !== undefined) {
      usageData.outputTokens = input.usage.outputTokens;
    }

    await this.prisma.aiUsage.create({
      data: {
        userId: input.userId,
        provider: this.toPrismaProvider(input.provider),
        model: input.model,
        operation: input.operation,
        status: 'SUCCESS',
        promptChars: input.promptChars,
        responseChars: input.responseChars,
        ...usageData,
        latencyMs: input.latencyMs,
      },
    });
  }

  async recordFailure(input: AiUsageFailureInput): Promise<void> {
    await this.prisma.aiUsage.create({
      data: {
        userId: input.userId,
        provider: this.toPrismaProvider(input.provider),
        model: input.model,
        operation: input.operation,
        status: 'ERROR',
        promptChars: input.promptChars,
        latencyMs: input.latencyMs,
        errorMessage: input.errorMessage,
      },
    });
  }

  private toPrismaProvider(provider: AiProviderName): PrismaAiProvider {
    if (provider === 'gemini') {
      return PrismaAiProvider.GEMINI;
    }

    if (provider === 'openai') {
      return PrismaAiProvider.OPENAI;
    }

    return PrismaAiProvider.OLLAMA;
  }
}
