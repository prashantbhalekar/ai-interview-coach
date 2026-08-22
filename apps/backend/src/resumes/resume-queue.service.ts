import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

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

  constructor(private readonly configService: ConfigService) {}

  async enqueueResumeProcessing(payload: ResumeProcessingJobPayload): Promise<string> {
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

    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');
    this.queue = new Queue<ResumeProcessingJobPayload>(RESUME_QUEUE_NAME, {
      connection: {
        url: redisUrl,
      },
    });

    return this.queue;
  }
}
