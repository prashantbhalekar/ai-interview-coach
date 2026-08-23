# Phase 9: Docker Local Infra Runbook

## Purpose

Run the full local stack with Docker for backend, worker, frontend, PostgreSQL 16, and Redis 7.

## Files

- `docker-compose.yml`
- `docker/backend.Dockerfile`
- `docker/worker.Dockerfile`
- `docker/frontend.Dockerfile`

## Default Local Ports

- Frontend: `3000`
- Backend API: `3001`
- PostgreSQL: `5433`
- Redis: `6380`

## Start

1. Build images:

```bash
pnpm docker:build
```

2. Start stack:

```bash
pnpm docker:up
```

If default ports are already in use on your machine, override host bindings for this run:

```bash
POSTGRES_HOST_PORT=55433 REDIS_HOST_PORT=56380 pnpm docker:up
```

3. Watch logs:

```bash
pnpm docker:logs
```

4. Stop stack:

```bash
pnpm docker:down
```

## Operational Notes

1. Backend container runs `prisma migrate deploy` before API start.
2. `AI_PROVIDER=ollama` is used in local Docker defaults to avoid requiring cloud provider keys at boot.
3. Ollama is expected at `http://host.docker.internal:11434` when AI endpoints are exercised.
4. Frontend is built with `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1`.
5. Compose host-port defaults are `5433` for PostgreSQL and `6380` for Redis, matching BRD local-dev targets.

## Smoke Checks

1. Open `http://localhost:3000/interview-coach`.
2. Check backend health from host:

```bash
curl -i http://localhost:3001/api/v1/health
```

3. Verify database connectivity from backend logs and successful migration output.
4. Upload a resume and verify worker transitions status from QUEUED to COMPLETED or FAILED.
