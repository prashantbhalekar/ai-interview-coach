# Release Checklist (Copy-Paste)

Date: 2026-10-02

## Phase 1 Go-Live (Redis/Queue/Worker OFF)

1. Prepare env

```bash
cp .env.prod.local.example .env.prod.local
```

2. Ensure these toggles in .env.prod.local

```env
REDIS_ENABLED=false
QUEUE_ENABLED=false
CACHE_ENABLED=false
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORE=memory
EMBEDDINGS_ENABLED=false
RAG_ENABLED=false
AI_PROVIDER=gemini
STORAGE_DRIVER=r2
```

3. Validate config and run local production-like stack

```bash
pnpm docker:config:prodlocal
pnpm docker:up:prodlocal
```

4. Local health checks

```bash
curl -i http://localhost:3001/api/v1/health
curl -i http://localhost:3001/api/v1/health/readiness
```

5. Quality gates before deploy

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

6. Production migration

```bash
pnpm --filter backend prisma:deploy
```

7. Deploy order
1. Deploy backend (single instance)
1. Verify /api/v1/health and /api/v1/health/readiness
1. Deploy frontend
1. Run smoke flow: register, login, upload resume, run analysis, interview session

## Phase 2 Enablement Delta (When Scaling Later)

1. Infra prerequisites
1. Provision Redis
1. Deploy worker service runtime

1. Backend env changes

```env
REDIS_ENABLED=true
REDIS_URL=redis://<your-managed-redis>
QUEUE_ENABLED=true
CACHE_ENABLED=true
RATE_LIMIT_STORE=redis
EMBEDDINGS_ENABLED=true
RAG_ENABLED=true
```

3. Worker required env

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://<your-managed-redis>
WORKER_CONCURRENCY=5
EMBEDDING_CHUNK_TARGET_CHARS=1200
EMBEDDING_CHUNK_OVERLAP_CHARS=120
```

4. Phase 2 rollout order
1. Deploy backend with Redis/Queue enabled
1. Deploy worker
1. Verify queue production/consumption
1. Verify readiness shows redis up
1. Enable embeddings/RAG flags only after queue path is healthy

## Rollback (Quick)

1. Roll back frontend to previous Worker deployment.
2. Roll back backend to previous stable image/task definition.
3. If Phase 2 deployment, roll back worker independently.
4. If migration issue, restore DB snapshot and redeploy compatible backend image.
