# Day-1 Docker Operations Cheat Sheet

This is the fastest command guide to run, validate, and debug the local Docker stack.

## Stack Topology

The compose stack starts these services:

1. `postgres` (PostgreSQL 16)
2. `redis` (Redis 7)
3. `backend` (NestJS API)
4. `worker` (BullMQ processors)
5. `frontend` (Next.js)

## Main Commands

From repository root:

```bash
pnpm docker:build
pnpm docker:up
pnpm docker:logs
pnpm docker:down
```

## One-Go Bootstrap

Bring up stack, run migrations, optional seed, and health checks:

```bash
pnpm docker:bootstrap
pnpm docker:bootstrap:seed
```

Script options (direct script usage):

```bash
sh ./scripts/docker-bootstrap.sh --seed
sh ./scripts/docker-bootstrap.sh --no-build
```

## Port Overrides (when local ports are occupied)

```bash
POSTGRES_HOST_PORT=55433 REDIS_HOST_PORT=56380 pnpm docker:bootstrap
```

Defaults remain:

1. Postgres host port `5433`
2. Redis host port `6380`
3. Backend host port `3001`
4. Frontend host port `3000`

## Prisma Commands Inside Container

```bash
docker-compose exec -T backend pnpm --filter backend prisma:generate
docker-compose exec -T backend pnpm --filter backend prisma:deploy
docker-compose exec -T backend pnpm --filter backend prisma:seed
```

## Health Checks

```bash
curl -i http://localhost:3001/api/v1/health
curl -I http://localhost:3000/interview-coach
```

## Useful Debug Commands

```bash
docker-compose ps
docker-compose logs -f --tail=150 backend
docker-compose logs -f --tail=150 worker
docker-compose logs -f --tail=150 postgres
docker-compose logs -f --tail=150 redis
docker-compose logs -f --tail=150 frontend
```

## Reset Patterns

Stop and remove containers/network only:

```bash
pnpm docker:down
```

Stop and remove containers plus named volumes (full DB/Redis reset):

```bash
docker-compose down -v
```

## Current Feature Notes

1. Queue processing is enabled (resume/analysis/interview/embedding queues).
2. Mail sending is not implemented yet (no SMTP/mail provider module wired).
3. Storage supports `local` and `r2` drivers; compose defaults to `local`.
