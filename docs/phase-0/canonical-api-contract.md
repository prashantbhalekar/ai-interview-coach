# Canonical API Contract (Phase 0)

Purpose:
Define mandatory REST prefixing and initial endpoint namespace contract.

## API Versioning Rule

1. All backend REST endpoints must be prefixed with /api/v1 from day one.
2. No unversioned public API endpoints should be exposed.
3. Do not expose equivalent unversioned endpoints such as /auth/login, /auth/register, /resumes, or /interviews.

## Initial Endpoint Contract

Authentication:

1. POST /api/v1/auth/register
2. POST /api/v1/auth/login

User:

1. GET /api/v1/users/me

Resumes:

1. POST /api/v1/resumes
2. GET /api/v1/resumes
3. GET /api/v1/resumes/:id
4. DELETE /api/v1/resumes/:id

Jobs:

1. POST /api/v1/jobs
2. GET /api/v1/jobs
3. GET /api/v1/jobs/:id

Resume Analysis:

1. POST /api/v1/resume-analysis
2. GET /api/v1/resume-analysis/:id

Interviews:

1. POST /api/v1/interviews
2. GET /api/v1/interviews
3. GET /api/v1/interviews/:id
4. POST /api/v1/interviews/:id/start
5. POST /api/v1/interviews/:id/answers
6. GET /api/v1/interviews/:id/results

Health:

1. GET /api/v1/health

## API Contract Rules

1. Controllers remain thin and delegate business logic to services.
2. Request validation is mandatory at boundary level.
3. AI response payloads requiring structure must be schema-validated before persistence/use.
4. Expensive AI processing must not block request-response cycles.

## Acceptance Checks

1. E2E tests assert endpoints exist under /api/v1.
2. No equivalent unversioned endpoints available.
3. OpenAPI or endpoint docs include /api/v1 prefix for all routes.
4. Negative checks confirm unversioned routes return not found and are not reachable.
