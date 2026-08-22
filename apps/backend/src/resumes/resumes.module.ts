import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { StorageModule } from '../storage/storage.module';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';

@Module({
  imports: [StorageModule, QueueModule],
  controllers: [ResumesController],
  providers: [ResumesService],
})
export class ResumesModule {}
