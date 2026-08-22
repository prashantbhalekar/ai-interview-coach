import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_URL: z.string().url('REDIS_URL must be a valid URL'),
    JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    AI_PROVIDER: z.enum(['gemini', 'openai', 'ollama']).default('gemini'),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash-lite'),
    GEMINI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
    OLLAMA_MODEL: z.string().default('llama3.1:8b'),
    STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),
    STORAGE_LOCAL_BASE_PATH: z.string().default('.storage'),
    R2_BUCKET: z.string().optional(),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_ENDPOINT: z.string().url().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.AI_PROVIDER === 'gemini' && !env.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GEMINI_API_KEY'],
        message: 'GEMINI_API_KEY is required when AI_PROVIDER=gemini',
      });
    }

    if (env.AI_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
