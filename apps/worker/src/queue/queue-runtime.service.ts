import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EmbeddingSourceType,
  EmbeddingStatus,
  Prisma,
  type ResumeProcessingStatus,
} from '@prisma/client';
import { Job, Worker } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

interface ResumeProcessingJobPayload {
  resumeId: string;
  userId: string;
  storageKey: string;
}

interface AnalysisProcessingJobPayload {
  analysisId: string;
  userId: string;
}

interface InterviewProcessingJobPayload {
  interviewSessionId: string;
  userId: string;
}

interface EmbeddingProcessingJobPayload {
  userId: string;
  sourceType: EmbeddingSourceType;
  sourceRefId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

const queueNames = {
  resumeProcessing: 'resume-processing',
  analysisProcessing: 'analysis-processing',
  interviewProcessing: 'interview-processing',
  embeddingProcessing: 'embedding-processing',
} as const;

@Injectable()
export class QueueRuntimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueRuntimeService.name);
  private readonly workers: Worker[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');
    const concurrency = this.configService.get<number>('WORKER_CONCURRENCY', 5);

    this.workers.push(
      new Worker<ResumeProcessingJobPayload>(
        queueNames.resumeProcessing,
        async (job) => this.processResumeJob(job),
        {
          connection: { url: redisUrl },
          concurrency,
        },
      ),
    );

    this.workers.push(
      new Worker<AnalysisProcessingJobPayload>(
        queueNames.analysisProcessing,
        async (job) => this.processAnalysisJob(job),
        {
          connection: { url: redisUrl },
          concurrency,
        },
      ),
    );

    this.workers.push(
      new Worker<InterviewProcessingJobPayload>(
        queueNames.interviewProcessing,
        async (job) => this.processInterviewJob(job),
        {
          connection: { url: redisUrl },
          concurrency,
        },
      ),
    );

    this.workers.push(
      new Worker<EmbeddingProcessingJobPayload>(
        queueNames.embeddingProcessing,
        async (job) => this.processEmbeddingJob(job),
        {
          connection: { url: redisUrl },
          concurrency,
        },
      ),
    );

    for (const worker of this.workers) {
      worker.on('completed', (job) => {
        this.logger.log(`Job completed queue=${worker.name} id=${String(job?.id ?? 'unknown')}`);
      });

      worker.on('failed', (job, error) => {
        this.logger.error(
          `Job failed queue=${worker.name} id=${String(job?.id ?? 'unknown')}`,
          error.stack,
        );
      });
    }

    this.logger.log('Queue runtime initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }

  private async processResumeJob(job: Job<ResumeProcessingJobPayload>): Promise<void> {
    await this.updateResumeStatus(job.data.resumeId, 'PROCESSING');

    try {
      // Phase 5 baseline: queue runtime and lifecycle transitions.
      await this.updateResumeStatus(job.data.resumeId, 'COMPLETED');
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'Unknown processing error';

      await this.prisma.resume.update({
        where: { id: job.data.resumeId },
        data: {
          status: 'FAILED',
          failureReason: reason,
        },
      });

      throw error;
    }
  }

  private async processAnalysisJob(job: Job<AnalysisProcessingJobPayload>): Promise<void> {
    this.logger.log(
      `Analysis job received analysisId=${job.data.analysisId} userId=${job.data.userId} (processor scaffold)`,
    );
  }

  private async processInterviewJob(job: Job<InterviewProcessingJobPayload>): Promise<void> {
    this.logger.log(
      `Interview job received interviewSessionId=${job.data.interviewSessionId} userId=${job.data.userId} (processor scaffold)`,
    );
  }

  private async processEmbeddingJob(job: Job<EmbeddingProcessingJobPayload>): Promise<void> {
    const normalizedContent = job.data.content.trim();
    if (!normalizedContent) {
      this.logger.warn(
        `Embedding job skipped sourceType=${job.data.sourceType} sourceRefId=${job.data.sourceRefId} due to empty content`,
      );
      return;
    }

    const metadata = job.data.metadata ? (job.data.metadata as Prisma.InputJsonValue) : undefined;

    const document = await this.prisma.embeddingDocument.upsert({
      where: {
        userId_sourceType_sourceRefId: {
          userId: job.data.userId,
          sourceType: job.data.sourceType,
          sourceRefId: job.data.sourceRefId,
        },
      },
      update: {
        ...(metadata ? { metadata } : {}),
      },
      create: {
        userId: job.data.userId,
        sourceType: job.data.sourceType,
        sourceRefId: job.data.sourceRefId,
        contentHash: job.data.sourceRefId,
        ...(metadata ? { metadata } : {}),
      },
    });

    await this.prisma.embeddingChunk.deleteMany({
      where: {
        documentId: document.id,
      },
    });

    const chunks = this.splitContentToChunks(normalizedContent);

    if (chunks.length === 0) {
      this.logger.warn(`Embedding job produced zero chunks for document=${document.id}`);
      return;
    }

    await this.prisma.embeddingChunk.createMany({
      data: chunks.map((content, chunkIndex) => ({
        documentId: document.id,
        chunkIndex,
        content,
        tokenCount: null,
        embeddingStatus: EmbeddingStatus.PENDING,
        embeddingModel: null,
        embeddingDimensions: null,
        embeddingVector: [],
      })),
    });

    this.logger.log(
      `Embedding job prepared document=${document.id} chunks=${chunks.length} sourceType=${job.data.sourceType}`,
    );
  }

  private splitContentToChunks(content: string): string[] {
    const targetChars = this.configService.get<number>('EMBEDDING_CHUNK_TARGET_CHARS', 1200);
    const overlapChars = this.configService.get<number>('EMBEDDING_CHUNK_OVERLAP_CHARS', 120);
    const safeTarget = Math.max(300, targetChars);
    const safeOverlap = Math.max(0, Math.min(overlapChars, safeTarget - 100));

    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      const end = Math.min(content.length, start + safeTarget);
      const candidate = content.slice(start, end).trim();

      if (candidate.length > 0) {
        chunks.push(candidate);
      }

      if (end >= content.length) {
        break;
      }

      start = Math.max(end - safeOverlap, start + 1);
    }

    return chunks;
  }

  private async updateResumeStatus(
    resumeId: string,
    status: ResumeProcessingStatus,
  ): Promise<void> {
    await this.prisma.resume.update({
      where: { id: resumeId },
      data: { status },
    });
  }
}
