import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { EmbeddingSourceType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export interface EmbeddingProcessingJobPayload {
  userId: string;
  sourceType: EmbeddingSourceType;
  sourceRefId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

const EMBEDDING_QUEUE_NAME = 'embedding-processing';
const EMBEDDING_PROCESSING_JOB_NAME = 'embedding.process';

@Injectable()
export class EmbeddingQueueService implements OnModuleDestroy {
  private queue: Queue<EmbeddingProcessingJobPayload> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async enqueueEmbeddingProcessing(payload: EmbeddingProcessingJobPayload): Promise<string> {
    const queue = this.getQueue();
    const jobId = `${payload.sourceType.toLowerCase()}-${payload.userId}-${payload.sourceRefId}`;

    const job = await queue.add(EMBEDDING_PROCESSING_JOB_NAME, payload, {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 500,
      removeOnFail: 500,
    });

    return String(job.id ?? jobId);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }

  private getQueue(): Queue<EmbeddingProcessingJobPayload> {
    if (this.queue) {
      return this.queue;
    }

    this.queue = new Queue<EmbeddingProcessingJobPayload>(EMBEDDING_QUEUE_NAME, {
      connection: {
        url: this.configService.getOrThrow<string>('REDIS_URL'),
      },
    });

    return this.queue;
  }
}
