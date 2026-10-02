import { validateEnv } from '../src/config/env.schema';

describe('Environment validation by phase', () => {
  const baseConfig = {
    NODE_ENV: 'test',
    PORT: '3001',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ai_interview_coach_test',
    JWT_SECRET: 'super-secret-value',
    FRONTEND_URL: 'http://localhost:3000',
    AI_PROVIDER: 'gemini',
    GEMINI_API_KEY: 'gemini-test-key',
    STORAGE_DRIVER: 'local',
  };

  it('accepts Phase 1 config with Redis disabled and no REDIS_URL', () => {
    const parsed = validateEnv({
      ...baseConfig,
      REDIS_ENABLED: 'false',
      QUEUE_ENABLED: 'false',
      CACHE_ENABLED: 'false',
      EMBEDDINGS_ENABLED: 'false',
      RAG_ENABLED: 'false',
      RATE_LIMIT_STORE: 'memory',
    });

    expect(parsed.REDIS_ENABLED).toBe(false);
    expect(parsed.QUEUE_ENABLED).toBe(false);
  });

  it('requires REDIS_URL when REDIS_ENABLED=true', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        REDIS_ENABLED: 'true',
      }),
    ).toThrow('REDIS_URL is required when REDIS_ENABLED=true');
  });

  it('requires REDIS_ENABLED=true when QUEUE_ENABLED=true', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        REDIS_ENABLED: 'false',
        QUEUE_ENABLED: 'true',
      }),
    ).toThrow('QUEUE_ENABLED=true requires REDIS_ENABLED=true');
  });

  it('requires R2 credentials when STORAGE_DRIVER=r2', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        STORAGE_DRIVER: 'r2',
      }),
    ).toThrow('R2_BUCKET is required when STORAGE_DRIVER=r2');
  });
});
