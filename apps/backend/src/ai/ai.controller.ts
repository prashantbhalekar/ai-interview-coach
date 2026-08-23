import { Body, Controller, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { createHash } from 'crypto';
import { EmbeddingSourceType } from '@prisma/client';
import { AiRateLimitGuard } from '../common/guards/ai-rate-limit.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EmbeddingQueueService } from '../queue/embedding-queue.service';
import { AiService } from './ai.service';
import { AnalyzeResumeDto } from './dto/analyze-resume.dto';
import type { ResumeAnalysisResult } from './schemas/resume-analysis.schema';

interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
  };
}

interface AnalyzeResumeResponseDto {
  provider: string;
  model: string;
  result: ResumeAnalysisResult;
}

@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly embeddingQueueService: EmbeddingQueueService,
  ) {}

  @Post('resume-analysis')
  @UseGuards(JwtAuthGuard, AiRateLimitGuard)
  async analyzeResume(
    @Req() request: AuthenticatedRequest,
    @Body() dto: AnalyzeResumeDto,
  ): Promise<AnalyzeResumeResponseDto> {
    const response = await this.aiService.analyzeResume({
      userId: request.user.sub,
      resumeText: dto.resumeText,
      jobDescription: dto.jobDescription,
    });

    await this.enqueueEmbeddingJobs(request.user.sub, dto);

    return response;
  }

  private async enqueueEmbeddingJobs(userId: string, dto: AnalyzeResumeDto): Promise<void> {
    const normalizedResumeText = dto.resumeText.trim();
    const normalizedJobDescription = dto.jobDescription.trim();

    const jobs = [
      {
        sourceType: EmbeddingSourceType.RESUME,
        content: normalizedResumeText,
      },
      {
        sourceType: EmbeddingSourceType.JOB_DESCRIPTION,
        content: normalizedJobDescription,
      },
    ] as const;

    for (const job of jobs) {
      if (!job.content) {
        continue;
      }

      const sourceRefId = createHash('sha256').update(job.content).digest('hex');

      try {
        await this.embeddingQueueService.enqueueEmbeddingProcessing({
          userId,
          sourceType: job.sourceType,
          sourceRefId,
          content: job.content,
          metadata: {
            operation: 'resume_analysis',
          },
        });
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : 'Unknown queue error';
        this.logger.warn(`Failed to enqueue embedding job for ${job.sourceType}: ${reason}`);
      }
    }
  }
}
