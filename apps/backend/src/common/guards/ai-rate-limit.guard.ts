import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface RateLimitBucket {
  count: number;
  windowStart: number;
}

interface RequestWithIdentity {
  ip?: string;
  user?: {
    sub?: string;
  };
  headers?: Record<string, string | string[] | undefined>;
}

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly requestsByIdentity = new Map<string, RateLimitBucket>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(private readonly configService: ConfigService) {
    this.windowMs = this.configService.get<number>('AI_RATE_LIMIT_WINDOW_MS', 60000);
    this.maxRequests = this.configService.get<number>('AI_RATE_LIMIT_MAX_REQUESTS', 10);
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.maxRequests <= 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithIdentity>();
    const identity = this.resolveIdentity(request);
    const now = Date.now();

    this.pruneExpiredBuckets(now);

    const bucket = this.requestsByIdentity.get(identity);

    if (!bucket || now - bucket.windowStart >= this.windowMs) {
      this.requestsByIdentity.set(identity, {
        count: 1,
        windowStart: now,
      });
      return true;
    }

    if (bucket.count >= this.maxRequests) {
      throw new HttpException(
        `AI request limit reached. Retry after ${Math.ceil(this.windowMs / 1000)} seconds.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    this.requestsByIdentity.set(identity, bucket);
    return true;
  }

  private resolveIdentity(request: RequestWithIdentity): string {
    const userId = request.user?.sub?.trim();
    if (userId) {
      return `user:${userId}`;
    }

    const forwardedFor = request.headers?.['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim();

    return `ip:${forwardedIp || request.ip || 'unknown'}`;
  }

  private pruneExpiredBuckets(now: number): void {
    if (this.requestsByIdentity.size < 2000) {
      return;
    }

    for (const [key, bucket] of this.requestsByIdentity.entries()) {
      if (now - bucket.windowStart >= this.windowMs) {
        this.requestsByIdentity.delete(key);
      }
    }
  }
}
