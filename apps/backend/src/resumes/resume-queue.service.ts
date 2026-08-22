import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ResumeQueueService {
  private readonly logger = new Logger(ResumeQueueService.name);

  async enqueueResumeProcessing(resumeId: string): Promise<string> {
    const jobId = `resume-${resumeId}-${Date.now()}`;

    // Queue runtime wiring is introduced in Phase 5.
    this.logger.log(`Queued resume processing job ${jobId}`);

    return jobId;
  }
}
