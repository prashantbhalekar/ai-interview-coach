import { Module } from '@nestjs/common';
import { AnalysisQueueService } from './analysis-queue.service';
import { InterviewQueueService } from './interview-queue.service';
import { ResumeQueueService } from '../resumes/resume-queue.service';

@Module({
  providers: [ResumeQueueService, AnalysisQueueService, InterviewQueueService],
  exports: [ResumeQueueService, AnalysisQueueService, InterviewQueueService],
})
export class QueueModule {}
