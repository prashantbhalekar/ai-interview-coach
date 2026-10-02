import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RuntimeConfigService {
  constructor(private readonly configService: ConfigService) {}

  isRedisEnabled(): boolean {
    return this.configService.get<boolean>('REDIS_ENABLED', false);
  }

  isQueueEnabled(): boolean {
    return this.configService.get<boolean>('QUEUE_ENABLED', false);
  }

  isCacheEnabled(): boolean {
    return this.configService.get<boolean>('CACHE_ENABLED', false);
  }

  isEmbeddingsEnabled(): boolean {
    return this.configService.get<boolean>('EMBEDDINGS_ENABLED', false);
  }

  isRateLimitEnabled(): boolean {
    return this.configService.get<boolean>('RATE_LIMIT_ENABLED', true);
  }

  getRateLimitStore(): 'memory' | 'redis' {
    return this.configService.get<'memory' | 'redis'>('RATE_LIMIT_STORE', 'memory');
  }
}
