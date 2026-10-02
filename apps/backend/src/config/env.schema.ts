import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'off', ''].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    REDIS_ENABLED: booleanFromEnv.default(false),
    REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),
    QUEUE_ENABLED: booleanFromEnv.default(false),
    CACHE_ENABLED: booleanFromEnv.default(false),
    RATE_LIMIT_ENABLED: booleanFromEnv.default(true),
    RATE_LIMIT_STORE: z.enum(['memory', 'redis']).default('memory'),
    EMBEDDINGS_ENABLED: booleanFromEnv.default(false),
    RAG_ENABLED: booleanFromEnv.default(false),
    JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    AI_PROVIDER: z.enum(['gemini', 'openai', 'ollama']).default('gemini'),
    AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
    AI_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
    AI_RESUME_ANALYSIS_CACHE_TTL_MS: z.coerce.number().int().min(0).default(120000),
    AI_RESUME_ANALYSIS_CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(200),
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
    if (env.REDIS_ENABLED && !env.REDIS_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['REDIS_URL'],
        message: 'REDIS_URL is required when REDIS_ENABLED=true',
      });
    }

    if (env.QUEUE_ENABLED && !env.REDIS_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['QUEUE_ENABLED'],
        message: 'QUEUE_ENABLED=true requires REDIS_ENABLED=true',
      });
    }

    if (env.EMBEDDINGS_ENABLED && !env.QUEUE_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['EMBEDDINGS_ENABLED'],
        message: 'EMBEDDINGS_ENABLED=true currently requires QUEUE_ENABLED=true',
      });
    }

    if (env.RAG_ENABLED && !env.EMBEDDINGS_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RAG_ENABLED'],
        message: 'RAG_ENABLED=true requires EMBEDDINGS_ENABLED=true',
      });
    }

    if (env.RATE_LIMIT_STORE === 'redis' && !env.REDIS_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['RATE_LIMIT_STORE'],
        message: 'RATE_LIMIT_STORE=redis requires REDIS_ENABLED=true',
      });
    }

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

    if (env.STORAGE_DRIVER === 'r2') {
      const requiredR2Fields: Array<keyof typeof env> = [
        'R2_BUCKET',
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
      ];

      for (const field of requiredR2Fields) {
        if (!env[field]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field} is required when STORAGE_DRIVER=r2`,
          });
        }
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
