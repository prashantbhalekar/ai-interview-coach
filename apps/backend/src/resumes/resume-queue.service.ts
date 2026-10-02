import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { RuntimeConfigService } from '../config/runtime-config.service';

interface ResumeProcessingJobPayload {
  resumeId: string;
  userId: string;
  storageKey: string;
}

const RESUME_QUEUE_NAME = 'resume-processing';
const RESUME_PROCESSING_JOB_NAME = 'resume.process';

@Injectable()
export class ResumeQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(ResumeQueueService.name);
  private queue: Queue<ResumeProcessingJobPayload> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly runtimeConfigService: RuntimeConfigService,
  ) {}

  async enqueueResumeProcessing(payload: ResumeProcessingJobPayload): Promise<string> {
    if (!this.runtimeConfigService.isQueueEnabled()) {
      const syncJobId = `sync-${payload.resumeId}`;
      this.logger.log(`Queue disabled; skipping resume queue and returning ${syncJobId}`);
      return syncJobId;
    }

    const queue = this.getQueue();

    const job = await queue.add(RESUME_PROCESSING_JOB_NAME, payload, {
      jobId: `resume-${payload.resumeId}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 500,
      removeOnFail: 500,
    });

    const jobId = String(job.id ?? `${payload.resumeId}-${Date.now()}`);

    // Queue runtime wiring is introduced in Phase 5.
    this.logger.log(`Queued resume processing job ${jobId}`);

    return jobId;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }

  private getQueue(): Queue<ResumeProcessingJobPayload> {
    if (this.queue) {
      return this.queue;
    }

    if (!this.runtimeConfigService.isRedisEnabled()) {
      throw new Error('Redis must be enabled when queue processing is enabled');
    }

    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');
    this.queue = new Queue<ResumeProcessingJobPayload>(RESUME_QUEUE_NAME, {
      connection: {
        url: redisUrl,
      },
    });

    return this.queue;
  }
}
