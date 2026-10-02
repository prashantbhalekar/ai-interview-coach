# AI Interview Coach Deployment Manual

Date: 2026-10-02
Primary reference for deployment modes and cutover process.

## 1) Deployment Modes

This repository supports two deployment modes.

1. Phase 1 (current production mode, cost-conscious):

- Frontend deployed to Cloudflare Workers (OpenNext path)
- Backend deployed as single NestJS container/service
- PostgreSQL required
- Gemini required
- R2 required for production file durability
- Redis disabled
- Queue disabled
- Worker not deployed

2. Phase 2 (scale mode, optional later):

- Frontend still on Cloudflare Workers
- Backend can scale to multiple instances
- Redis enabled
- BullMQ queue enabled
- Worker deployed as separate service
- Embeddings/RAG optional enablement

## 2) Platform Split

Recommended platform split:

1. Frontend: Cloudflare Workers (OpenNext)
2. Backend API: AWS ECS Fargate container
3. Worker (Phase 2 only): AWS ECS Fargate container
4. Database: AWS RDS PostgreSQL (or equivalent managed PostgreSQL)
5. Redis (Phase 2 only): AWS ElastiCache Redis (or equivalent)
6. Storage: Cloudflare R2

## 3) Domains and Routing

1. Frontend domain:

- lab.prashantbhalekar.dev
- Base path: /interview-coach

2. API domain:

- api.lab.prashantbhalekar.dev
- API base path: /api/v1

3. Frontend API base env:

- NEXT_PUBLIC_API_BASE_URL must be https://api.lab.prashantbhalekar.dev/api/v1

## 4) Environment Matrix by Phase

### 4.1 Frontend env (both phases)

1. NEXT_PUBLIC_APP_BASE_PATH=/interview-coach
2. NEXT_PUBLIC_API_BASE_URL=https://api.lab.prashantbhalekar.dev/api/v1

### 4.2 Backend env - Phase 1 baseline

1. NODE_ENV=production
2. PORT=3001
3. DATABASE_URL=postgresql://...
4. JWT_SECRET=...
5. FRONTEND_URL=https://lab.prashantbhalekar.dev
6. AI_PROVIDER=gemini
7. GEMINI_API_KEY=...
8. GEMINI_MODEL=gemini-2.5-flash-lite
9. GEMINI_REQUEST_TIMEOUT_MS=30000
10. STORAGE_DRIVER=r2
11. R2_ACCOUNT_ID=...
12. R2_ACCESS_KEY_ID=...
13. R2_SECRET_ACCESS_KEY=...
14. R2_BUCKET=...
15. Optional: R2_ENDPOINT=...
16. REDIS_ENABLED=false
17. QUEUE_ENABLED=false
18. CACHE_ENABLED=false
19. RATE_LIMIT_ENABLED=true
20. RATE_LIMIT_STORE=memory
21. EMBEDDINGS_ENABLED=false
22. RAG_ENABLED=false
23. AI_RATE_LIMIT_WINDOW_MS=60000
24. AI_RATE_LIMIT_MAX_REQUESTS=20
25. AI_RESUME_ANALYSIS_CACHE_TTL_MS=120000
26. AI_RESUME_ANALYSIS_CACHE_MAX_ENTRIES=200

### 4.3 Worker env - Phase 2 only

1. NODE_ENV=production
2. DATABASE_URL=postgresql://...
3. REDIS_URL=redis://...
4. WORKER_CONCURRENCY=5
5. EMBEDDING_CHUNK_TARGET_CHARS=1200
6. EMBEDDING_CHUNK_OVERLAP_CHARS=120

## 5) Phase 1 Deployment Flow (Current)

1. Validate local production-like mode first:

- cp .env.prod.local.example .env.prod.local
- fill Gemini and JWT values
- keep toggles off: REDIS_ENABLED=false, QUEUE_ENABLED=false, EMBEDDINGS_ENABLED=false
- pnpm docker:config:prodlocal
- pnpm docker:up:prodlocal

2. Validate local health:

- GET http://localhost:3001/api/v1/health
- GET http://localhost:3001/api/v1/health/readiness

Expected in Phase 1 readiness:

1. database.status=up
2. redis.status=disabled

3. Build and push backend container image.
4. Provision and validate PostgreSQL and R2.
5. Run migrations using prisma migrate deploy.
6. Deploy backend service (single instance).
7. Validate API/auth/upload/analysis/interview flows.
8. Deploy frontend to Cloudflare Workers.
9. Execute go-live smoke checks.

## 6) Phase 2 Enablement - Exact Env Delta

When moving from Phase 1 to Phase 2, update these backend env variables:

1. REDIS_ENABLED: false -> true
2. REDIS_URL: set to managed Redis URL (required once REDIS_ENABLED=true)
3. QUEUE_ENABLED: false -> true
4. CACHE_ENABLED: false -> true (if enabling Redis-backed cache path)
5. RATE_LIMIT_STORE: memory -> redis (after Redis rate limiter implementation is deployed)
6. EMBEDDINGS_ENABLED: false -> true (when embeddings pipeline is ready)
7. RAG_ENABLED: false -> true (only after embeddings path is stable)

Phase 2 worker deployment env requirements:

1. DATABASE_URL
2. REDIS_URL
3. WORKER_CONCURRENCY
4. EMBEDDING_CHUNK_TARGET_CHARS
5. EMBEDDING_CHUNK_OVERLAP_CHARS

Phase 2 infra additions required before env switch:

1. Provision Redis
2. Deploy worker service
3. Verify queue/job processing

## 7) Phase-Aware Release Order

### Phase 1 release order

1. Deploy backend
2. Verify backend health/readiness and Gemini operation
3. Deploy frontend
4. Run browser E2E smoke checks

### Phase 2 release order

1. Provision Redis
2. Deploy backend with REDIS_ENABLED=true and QUEUE_ENABLED=true
3. Deploy worker service
4. Verify queue processing and retry behavior
5. Enable embeddings/RAG flags only after queue path is healthy

## 8) Verification Checklist

### Phase 1 checks

1. /api/v1/health returns success
2. /api/v1/health/readiness returns success with redis marked disabled
3. Resume upload works and persists in R2
4. AI resume analysis works synchronously
5. Interview flow works end-to-end

### Phase 2 additional checks

1. /api/v1/health/readiness returns redis up
2. Queue jobs are produced and consumed
3. Worker service healthy and processing jobs
4. No queue backlog growth under expected load

## 9) Rollback Strategy

1. Roll back frontend to previous Worker deployment.
2. Roll back backend ECS service to prior stable task definition/image.
3. If in Phase 2, roll back worker service independently.
4. If migration issue occurs:

- stop rollout
- restore DB snapshot if needed
- redeploy previous compatible backend image

## 10) Operations

First 24-48 hours post release:

1. Monitor API error rate and 5xx rate
2. Monitor readiness stability
3. Monitor Gemini timeout and provider error rates
4. In Phase 2, monitor worker failures and queue lag

## 11) Related Documents

1. Phase 1 runbook: PHASE_1_DEPLOYMENT_MANUAL.md
2. Architecture source of truth: docs/PHASE-1-PRODUCTION-ARCHITECTURE.md
3. Deferred hardening backlog: PRODUCTION_DEFERRED_PLAN.md
