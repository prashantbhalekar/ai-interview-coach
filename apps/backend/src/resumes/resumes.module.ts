import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ResumeQueueService } from './resume-queue.service';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';

@Module({
  imports: [StorageModule],
  controllers: [ResumesController],
  providers: [ResumesService, ResumeQueueService],
})
export class ResumesModule {}
