import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiRateLimitGuard } from '../common/guards/ai-rate-limit.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { AI_PROVIDER_REGISTRY } from './ai.constants';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiUsageService } from './ai-usage.service';
import { GeminiProvider } from './providers/gemini.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  imports: [ConfigModule, PrismaModule, QueueModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiUsageService,
    AiRateLimitGuard,
    GeminiProvider,
    OpenAiProvider,
    OllamaProvider,
    {
      provide: AI_PROVIDER_REGISTRY,
      inject: [GeminiProvider, OpenAiProvider, OllamaProvider],
      useFactory: (
        geminiProvider: GeminiProvider,
        openAiProvider: OpenAiProvider,
        ollamaProvider: OllamaProvider,
      ) => ({
        gemini: geminiProvider,
        openai: openAiProvider,
        ollama: ollamaProvider,
      }),
    },
  ],
  exports: [AiService],
})
export class AiModule {}
