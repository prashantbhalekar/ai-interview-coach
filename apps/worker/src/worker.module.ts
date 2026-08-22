import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateWorkerEnv } from './config/env.schema';
import { PrismaModule } from './prisma/prisma.module';
import { QueueRuntimeService } from './queue/queue-runtime.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateWorkerEnv,
    }),
    PrismaModule,
  ],
  providers: [QueueRuntimeService],
})
export class WorkerModule {}
