import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for worker status persistence'),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5),
});

export type WorkerEnv = z.infer<typeof envSchema>;

export function validateWorkerEnv(config: Record<string, unknown>): WorkerEnv {
  return envSchema.parse(config);
}
