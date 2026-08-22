import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

interface AnalysisProcessingJobPayload {
  analysisId: string;
  userId: string;
}

const ANALYSIS_QUEUE_NAME = 'analysis-processing';
const ANALYSIS_PROCESSING_JOB_NAME = 'analysis.process';

@Injectable()
export class AnalysisQueueService implements OnModuleDestroy {
  private queue: Queue<AnalysisProcessingJobPayload> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async enqueueAnalysisProcessing(payload: AnalysisProcessingJobPayload): Promise<string> {
    const queue = this.getQueue();
    const job = await queue.add(ANALYSIS_PROCESSING_JOB_NAME, payload, {
      jobId: `analysis-${payload.analysisId}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 500,
      removeOnFail: 500,
    });

    return String(job.id ?? `analysis-${payload.analysisId}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }

  private getQueue(): Queue<AnalysisProcessingJobPayload> {
    if (this.queue) {
      return this.queue;
    }

    this.queue = new Queue<AnalysisProcessingJobPayload>(ANALYSIS_QUEUE_NAME, {
      connection: {
        url: this.configService.getOrThrow<string>('REDIS_URL'),
      },
    });

    return this.queue;
  }
}
