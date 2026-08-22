# Backend Deployment Compatibility Gate (Phase 0)

Purpose:
Define objective criteria to choose backend deployment target without changing core architecture.

## Preferred and Fallback Targets

1. Preferred target: Cloudflare Worker runtime for backend.
2. Default fallback: Dockerized NestJS backend on AWS ECS/Fargate.
3. Fallback should not require business architecture changes.

## Compatibility Evaluation Criteria

1. Runtime compatibility:

- Verify required Node APIs and package behavior in Worker runtime.
- Confirm request/response lifecycle compatibility with selected NestJS adapter/runtime strategy.

2. Dependency compatibility:

- Audit direct and transitive dependencies for Worker-safe runtime behavior.
- Validate any packages that assume unrestricted Node runtime features.

3. Networking and infrastructure compatibility:

- Confirm backend connectivity patterns to PostgreSQL, Redis, object storage, and AI provider APIs.
- Evaluate latency and timeout behavior for expected API and queue orchestration patterns.

4. Operational compatibility:

- Validate logging, error handling, and observability hooks for runtime.
- Confirm expected environment variable support and secret injection model.

5. Security and compliance baseline:

- Ensure auth, headers, validation, and secret handling standards are retained in selected runtime.

## Mandatory Worker Compatibility Checks

The backend is considered Worker-compatible only if all of the following pass:

1. NestJS boots successfully in the Workers runtime.
2. All required Node.js APIs used by the application are supported.
3. Prisma/database access works with the selected PostgreSQL connectivity approach.
4. Authentication and JWT functionality work.
5. AI provider integration works.
6. Required validation and serialization libraries work.
7. No required dependency relies on unsupported filesystem, TCP, process, or other Node.js runtime behavior.
8. Production build and wrangler deploy succeed.
9. Health endpoint responds correctly.
10. Basic authenticated API flow works.
11. Database read and write operations work.
12. At least one AI request executes successfully.

## Pass and Fail Conditions

Pass for Worker target:

1. Required features operate without unsupported runtime shims.
2. No critical blocking dependency incompatibilities.
3. MVP endpoint behavior is stable under expected load patterns.
4. All mandatory Worker compatibility checks are green.

Fail to Worker target:

1. Critical runtime incompatibility blocks required features.
2. Dependency incompatibilities require non-trivial architecture changes.
3. Stability/performance/security baseline cannot be met.
4. Any mandatory Worker compatibility check fails.

## Decision Flow

1. Attempt Worker compatibility implementation and validation first.
2. If gate fails, switch deployment target to ECS/Fargate container runtime.
3. Preserve the same API contract and module architecture.
4. Document rationale and evidence for chosen runtime.

## Required Outputs from Compatibility Gate

1. Compatibility report with tested dependencies and outcomes.
2. Risks and mitigations list.
3. Final deployment target decision note.
4. Any required deployment configuration deltas.

## Non-Goals for Phase 0

1. Do not implement full ECS infrastructure as code unless required later.
2. Do not redesign backend domain architecture for deployment concerns.
