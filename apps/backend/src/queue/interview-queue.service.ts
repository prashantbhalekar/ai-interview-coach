import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

interface InterviewProcessingJobPayload {
  interviewSessionId: string;
  userId: string;
}

const INTERVIEW_QUEUE_NAME = 'interview-processing';
const INTERVIEW_PROCESSING_JOB_NAME = 'interview.process';

@Injectable()
export class InterviewQueueService implements OnModuleDestroy {
  private queue: Queue<InterviewProcessingJobPayload> | null = null;

  constructor(private readonly configService: ConfigService) {}

  async enqueueInterviewProcessing(payload: InterviewProcessingJobPayload): Promise<string> {
    const queue = this.getQueue();
    const job = await queue.add(INTERVIEW_PROCESSING_JOB_NAME, payload, {
      jobId: `interview-${payload.interviewSessionId}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 500,
      removeOnFail: 500,
    });

    return String(job.id ?? `interview-${payload.interviewSessionId}`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }

  private getQueue(): Queue<InterviewProcessingJobPayload> {
    if (this.queue) {
      return this.queue;
    }

    this.queue = new Queue<InterviewProcessingJobPayload>(INTERVIEW_QUEUE_NAME, {
      connection: {
        url: this.configService.getOrThrow<string>('REDIS_URL'),
      },
    });

    return this.queue;
  }
}
