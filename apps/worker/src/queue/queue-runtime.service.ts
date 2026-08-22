import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ResumeProcessingStatus } from '@prisma/client';
import { Job, Worker } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

interface ResumeProcessingJobPayload {
  resumeId: string;
  userId: string;
  storageKey: string;
}

interface GenericJobPayload {
  id: string;
  userId: string;
}

const RESUME_QUEUE_NAME = 'resume-processing';
const ANALYSIS_QUEUE_NAME = 'analysis-processing';
const INTERVIEW_QUEUE_NAME = 'interview-processing';

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
        RESUME_QUEUE_NAME,
        async (job) => this.processResumeJob(job),
        {
          connection: { url: redisUrl },
          concurrency,
        },
      ),
    );

    this.workers.push(
      new Worker<GenericJobPayload>(
        ANALYSIS_QUEUE_NAME,
        async (job) => this.processAnalysisJob(job),
        {
          connection: { url: redisUrl },
          concurrency,
        },
      ),
    );

    this.workers.push(
      new Worker<GenericJobPayload>(
        INTERVIEW_QUEUE_NAME,
        async (job) => this.processInterviewJob(job),
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

  private async processAnalysisJob(job: Job<GenericJobPayload>): Promise<void> {
    this.logger.log(
      `Analysis job received id=${job.data.id} userId=${job.data.userId} (processor scaffold)`,
    );
  }

  private async processInterviewJob(job: Job<GenericJobPayload>): Promise<void> {
    this.logger.log(
      `Interview job received id=${job.data.id} userId=${job.data.userId} (processor scaffold)`,
    );
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
