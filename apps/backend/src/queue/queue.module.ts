import { Module } from '@nestjs/common';
import { AnalysisQueueService } from './analysis-queue.service';
import { EmbeddingQueueService } from './embedding-queue.service';
import { InterviewQueueService } from './interview-queue.service';
import { ResumeQueueService } from '../resumes/resume-queue.service';

@Module({
  providers: [
    ResumeQueueService,
    AnalysisQueueService,
    InterviewQueueService,
    EmbeddingQueueService,
  ],
  exports: [ResumeQueueService, AnalysisQueueService, InterviewQueueService, EmbeddingQueueService],
})
export class QueueModule {}
