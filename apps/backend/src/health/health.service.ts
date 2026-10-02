import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { RuntimeConfigService } from '../config/runtime-config.service';
import { PrismaService } from '../prisma/prisma.service';

type DependencyHealth = {
  status: 'up' | 'down' | 'disabled';
  latencyMs: number;
  error?: string;
};

type ReadinessPayload = {
  success: boolean;
  service: 'backend';
  status: 'ok' | 'degraded';
  timestamp: string;
  dependencies: {
    database: DependencyHealth;
    redis: DependencyHealth;
  };
};

@Injectable()
export class HealthService implements OnModuleDestroy {
  private redisProbeQueue: Queue | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly runtimeConfigService: RuntimeConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getLivenessPayload(): { success: true; service: 'backend'; status: 'ok'; timestamp: string } {
    return {
      success: true,
      service: 'backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadinessPayload(): Promise<ReadinessPayload> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const redisHealthy = redis.status === 'up' || redis.status === 'disabled';
    const success = database.status === 'up' && redisHealthy;

    return {
      success,
      service: 'backend',
      status: success ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        database,
        redis,
      },
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisProbeQueue) {
      await this.redisProbeQueue.close();
      this.redisProbeQueue = null;
    }
  }

  private async checkDatabase(): Promise<DependencyHealth> {
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (error: unknown) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: this.toErrorMessage(error),
      };
    }
  }

  private async checkRedis(): Promise<DependencyHealth> {
    if (!this.runtimeConfigService.isRedisEnabled()) {
      return {
        status: 'disabled',
        latencyMs: 0,
      };
    }

    const start = Date.now();

    try {
      const queue = this.getRedisProbeQueue();
      await queue.waitUntilReady();
      await queue.getJobCounts();

      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (error: unknown) {
      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: this.toErrorMessage(error),
      };
    }
  }

  private getRedisProbeQueue(): Queue {
    if (!this.redisProbeQueue) {
      const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');
      this.redisProbeQueue = new Queue('__health_probe__', {
        connection: { url: redisUrl },
      });
    }

    return this.redisProbeQueue;
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown error';
  }
}
