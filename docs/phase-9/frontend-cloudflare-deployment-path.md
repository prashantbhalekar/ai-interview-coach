# Phase 9: Frontend Cloudflare Deployment Path

## Deployment Target

1. Frontend deployment target: Cloudflare Worker runtime path via OpenNext.
2. Cloudflare Pages is explicitly excluded by architecture constraints.

## Deployment Baseline

1. Keep application route model intact:
   - Root landing: `/`
   - Product routes: `/interview-coach/*`
2. Set production API origin with `NEXT_PUBLIC_API_BASE_URL` to backend public `/api/v1` endpoint.

## Suggested Build/Deploy Pipeline (Phase 9 Path)

1. Install frontend deployment tooling:

```bash
pnpm --filter frontend add -D @opennextjs/cloudflare wrangler
```

2. Build frontend:

```bash
pnpm --filter frontend build
```

3. Publish via wrangler command from frontend app directory.

## Required Secrets/Variables

1. `NEXT_PUBLIC_API_BASE_URL`
2. Any Cloudflare account and Worker deployment credentials required by wrangler.

## Validation Checklist

1. `/interview-coach` loads correctly in deployed environment.
2. Login/register/dashboard flows work against `/api/v1` backend.
3. Browser requests never target unversioned backend endpoints.
4. No deployment path references Cloudflare Pages.
