# Phase 1 Deployment Manual (Cost-Conscious)

Date: 2026-10-02
Scope: Minimal production deployment without Redis/BullMQ/worker/pgvector/embeddings/RAG

## 1) Target Platforms

Phase 1 production stack:

1. Frontend: Cloudflare Workers (OpenNext path)
2. Backend: Single NestJS container/service (AWS ECS Fargate recommended)
3. Database: Managed PostgreSQL
4. Storage: Cloudflare R2
5. AI: Gemini (`gemini-2.5-flash-lite`)

Not deployed in Phase 1:

1. Redis
2. BullMQ queues
3. Worker service
4. Embeddings/RAG/pgvector

## 2) Domain and Routing Model

1. Frontend domain:

- `https://lab.prashantbhalekar.dev/interview-coach`

2. API domain:

- `https://api.lab.prashantbhalekar.dev/api/v1`

3. Frontend public env:

- `NEXT_PUBLIC_API_BASE_URL=https://api.lab.prashantbhalekar.dev/api/v1`

## 3) Step-by-Step Deployment Runbook

### Step 0: Freeze release input

1. Pick release tag/version.
2. Confirm migration state and DB backup policy.
3. Confirm no pending breaking changes in contracts.

### Step 1: Prepare production environment values

Create service-specific env/secret sets.

Backend required env for Phase 1:

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

Feature toggles for Phase 1:

1. REDIS_ENABLED=false
2. QUEUE_ENABLED=false
3. CACHE_ENABLED=false
4. RATE_LIMIT_ENABLED=true
5. RATE_LIMIT_STORE=memory
6. EMBEDDINGS_ENABLED=false
7. RAG_ENABLED=false

Frontend required env:

1. NEXT_PUBLIC_APP_BASE_PATH=/interview-coach
2. NEXT_PUBLIC_API_BASE_URL=https://api.lab.prashantbhalekar.dev/api/v1

### Step 2: Local production-like validation

From repo root:

1. Create local env file:

- `cp .env.prod.local.example .env.prod.local`

2. Edit `.env.prod.local`:

- set real Gemini key and JWT secret
- set `REDIS_ENABLED=false`, `QUEUE_ENABLED=false`, `EMBEDDINGS_ENABLED=false`

3. Validate compose config:

- `pnpm docker:config:prodlocal`

4. Start local stack:

- `pnpm docker:up:prodlocal`

5. Validate endpoints:

- `curl -i http://localhost:3001/api/v1/health`
- `curl -i http://localhost:3001/api/v1/health/readiness`

Expected readiness behavior in Phase 1:

1. `database.status=up`
2. `redis.status=disabled`
3. HTTP 200

4. Run smoke flow manually:
5. Register/login
6. Upload resume
7. Run resume analysis
8. Create interview session and submit answers

### Step 3: Build backend image

1. Build image from backend Dockerfile.
2. Tag with immutable release tag.
3. Push to your container registry.

Recommended naming:

1. `ai-interview-coach-backend:<release-tag>`
2. optional promotion tag `stable`

### Step 4: Provision production infrastructure

1. PostgreSQL instance (managed)
2. Networking/security groups allowing backend -> DB
3. Cloudflare R2 bucket + access credentials
4. TLS certificate and DNS for API domain

Do not provision Redis for Phase 1 unless you are already moving to Phase 2.

### Step 5: Run database migration safely

Before switching traffic:

1. Take DB backup/snapshot.
2. Run Prisma migration deploy on target DB:

- `pnpm --filter backend prisma:deploy`

Do not use `prisma db push` for production schema rollout.

### Step 6: Deploy backend service (single instance)

1. Deploy one backend task/service instance.
2. Set all backend env variables from Step 1.
3. Expose port 3001 behind ALB/ingress.
4. Health check path:

- `/api/v1/health/readiness`

### Step 7: Validate backend in staging/prod

1. Health checks:

- `/api/v1/health`
- `/api/v1/health/readiness`

2. Auth checks:

- register/login and protected endpoint access

3. AI checks:

- execute one resume analysis with Gemini

4. Storage checks:

- upload resume and verify object exists in R2

### Step 8: Deploy frontend to Cloudflare Workers

Important: if Wrangler/OpenNext config is not committed yet, add it first.

1. Install tooling in frontend package:

- `pnpm --filter frontend add -D @opennextjs/cloudflare wrangler`

2. Build frontend:

- `pnpm --filter frontend build`

3. Deploy with Wrangler from `apps/frontend`.

4. Ensure frontend env has:

- `NEXT_PUBLIC_API_BASE_URL=https://api.lab.prashantbhalekar.dev/api/v1`

### Step 9: Production cutover sequence

1. Deploy backend first
2. Validate backend health/readiness and core APIs
3. Deploy frontend
4. Run full browser E2E smoke test
5. Monitor logs and API error rates for 24-48h

## 4) Verification Checklist (Go/No-Go)

All must pass:

1. `/api/v1/health` is healthy
2. `/api/v1/health/readiness` is healthy
3. Resume upload works and persists in R2
4. Resume analysis returns valid structured response
5. Interview flow works end-to-end
6. No Redis dependency errors in backend logs
7. CORS allows only expected frontend origin

## 5) Rollback Plan

If release fails:

1. Roll back frontend to previous Worker deployment
2. Roll back backend to previous image/task definition
3. If migration issue exists:

- stop rollout
- restore DB snapshot
- redeploy compatible backend image

## 6) Operational Notes for Phase 1

1. This is intentionally single-instance and not horizontally scalable.
2. Memory rate limiting is not distributed.
3. Redis/BullMQ/worker are intentionally off.
4. Use this mode for controlled rollout and cost control.

## 7) How to Enable Phase 2 Later (High Level)

1. Provision Redis.
2. Set `REDIS_ENABLED=true` and `REDIS_URL`.
3. Set `QUEUE_ENABLED=true`.
4. Deploy worker service.
5. Enable `CACHE_ENABLED=true`.
6. Switch `RATE_LIMIT_STORE=redis` after Redis limiter implementation.
7. Enable `EMBEDDINGS_ENABLED=true` and `RAG_ENABLED=true` with required migration/infra.

See detailed migration path in:

- `docs/PHASE-1-PRODUCTION-ARCHITECTURE.md`
