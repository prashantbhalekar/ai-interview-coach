# AI Interview Coach Phase Blueprint

This document is the execution blueprint for all phases before and during implementation.

## Program Constraints (Locked)

1. UI is polished from MVP start; not deferred.
2. Design language must match portfolio style, recreated independently.
3. Root route is Engineering Lab landing page.
4. Interview Coach is mounted at /interview-coach with nested routes.
5. All backend endpoints use /api/v1 from day one.
6. Backend deployment target preference is Cloudflare Worker.
7. Backend fallback is Dockerized NestJS on AWS ECS/Fargate if Worker incompatibility is confirmed.
8. Worker app remains long-running container runtime only.
9. No Cloudflare Pages for this project.

## Phase Sequence

1. Phase 0: Requirement Freeze and Traceability
2. Phase 1: Monorepo Foundation
3. Phase 2: Frontend Shell and Design System
4. Phase 3: Backend Core Platform
5. Phase 4: Storage and Resume Ingestion
6. Phase 5: Queue and Worker Runtime
7. Phase 6: AI Platform and Structured Outputs
8. Phase 7: MVP Product Flows
9. Phase 8: RAG-Ready and Cost Controls
10. Phase 9: Docker and Deployment
11. Phase 10: CI/CD, Testing, Security, Documentation

## Execution Blueprint by Phase

### Phase 0: Requirement Freeze and Traceability

Goal:
Create an auditable mapping from BRD requirements to implementation tasks and acceptance tests.

Deliverables:

1. Requirement traceability matrix.
2. Locked architecture decisions and exclusions.
3. Canonical route map and endpoint map.
4. UI acceptance checklist and deployment compatibility gate definition.

Exit Gates:

1. No unresolved requirement ambiguity.
2. Every BRD section mapped to owner phase and validation artifact.
3. Contradictions resolved using Query Answers.

### Phase 1: Monorepo Foundation

Goal:
Initialize tooling and project structure for reliable multi-app development.

Deliverables:

1. Workspace structure with apps, packages, docker, workflows.
2. Root package scripts and turbo pipelines.
3. TypeScript, ESLint, Prettier, Husky, lint-staged baseline.
4. Environment template files.

Exit Gates:

1. Install/build/lint/typecheck commands pass at root.
2. App-specific commands are runnable.

### Phase 2: Frontend Shell and Design System

Goal:
Ship a polished UI shell and reusable design system from the beginning.

Deliverables:

1. Next.js app scaffold and route tree.
2. Product routes under /interview-coach.
3. Engineering Lab landing page at /.
4. Dedicated API client layer.
5. Recreated design tokens and component primitives.

Exit Gates:

1. UI parity checklist passes for core style dimensions.
2. Route architecture supports future projects under root.

### Phase 3: Backend Core Platform

Goal:
Create secure and modular NestJS API foundation.

Deliverables:

1. Global backend setup (validation, errors, CORS, headers, config).
2. API prefix /api/v1 enforced globally.
3. Prisma and PostgreSQL setup with migrations and seed.
4. Auth module and users/me endpoint.
5. Health endpoint.

Exit Gates:

1. Core auth flow works with JWT.
2. Health and protected routes pass integration checks.

### Phase 4: Storage and Resume Ingestion

Goal:
Implement async-friendly resume upload architecture.

Deliverables:

1. Storage abstraction.
2. R2 storage provider.
3. PDF upload validation and metadata persistence.
4. Resume processing status model and APIs.

Exit Gates:

1. Upload is non-blocking for expensive work.
2. No PDF binary stored in PostgreSQL.

### Phase 5: Queue and Worker Runtime

Goal:
Offload expensive tasks to resilient asynchronous processing.

Deliverables:

1. Redis + BullMQ setup.
2. Backend enqueue services.
3. Worker processors for resume, analysis, interview jobs.
4. Retry/backoff/idempotency policies.

Exit Gates:

1. End-to-end enqueue and consume flow works.
2. Failure states persist and are observable.

### Phase 6: AI Platform and Structured Outputs

Goal:
Build reliable AI abstraction and schema-safe output processing.

Deliverables:

1. AI provider interface.
2. Gemini provider implementation.
3. Placeholder providers for OpenAI and Ollama.
4. Prompt layer files.
5. Zod schemas and malformed-output handling.
6. AI usage tracking model and persistence.

Exit Gates:

1. Structured AI outputs pass validation.
2. Provider is switchable by environment setting.

### Phase 7: MVP Product Flows

Goal:
Deliver end-to-end user value for analysis and interview coaching in polished UI.

Deliverables:

1. Milestone A flows (auth, resume, job description, analysis, structured display).
2. Milestone B flows (interviews, Q&A, evaluation, follow-up, history).
3. Dashboard and result visualizations per UX section in BRD.

Exit Gates:

1. All MVP screens and endpoints functional.
2. UX acceptance checklist passes for polish and consistency.

### Phase 8: RAG-Ready and Cost Controls

Goal:
Prepare extensibility without adding unnecessary complexity.

Deliverables:

1. pgvector-ready schema seams.
2. Embedding/vector module scaffolding.
3. Rate limiting for expensive endpoints.
4. Optional caching where high value.

Exit Gates:

1. Incremental RAG path is enabled without major refactors.

### Phase 9: Docker and Deployment

Goal:
Provide local infra and deployment-ready runtime paths.

Deliverables:

1. Docker compose for local infra.
2. Backend and worker containerization.
3. Frontend Cloudflare deployment path.
4. Backend compatibility gate report.

Exit Gates:

1. Frontend deployment plan validated for /interview-coach path.
2. Backend runtime target selected based on compatibility evidence.

### Phase 10: CI/CD, Testing, Security, Documentation

Goal:
Harden project quality and operational readiness.

Deliverables:

1. GitHub Actions workflows.
2. Unit/integration/e2e test suites.
3. Security baseline controls and validations.
4. Production-ready README and architecture diagram.

Exit Gates:

1. CI passes all mandatory checks.
2. Documentation covers setup, architecture, deployment, and trade-offs.

## Parallelization Rules

1. Phase 0 and Phase 1 are serial and mandatory.
2. Phase 2 and Phase 3 can run in parallel after Phase 1.
3. Phase 4 through Phase 7 are integration-heavy and should be mostly serial.
4. Phase 8 can begin after Phase 7 baseline stabilization.
5. Phase 9 and Phase 10 can begin partially earlier, but final sign-off depends on stable Phase 7 flows.

## Definition of Done (Global)

1. Requirements mapped and verified.
2. Deliverables implemented.
3. Tests added and passing.
4. Security and non-functional constraints respected.
5. Documentation updated.
6. No prohibited technologies introduced.

## Phase 0 Current Status

1. Blueprint finalized.
2. Sign-off decisions are closed and reflected in Phase 0 artifacts.
3. Phase 1 monorepo foundation implementation completed and validated.
4. Phase 2 frontend refinement is in progress with responsive route shells and reusable loading, empty, error, and success states.
5. Phase 3 backend core is in progress with global /api/v1 setup, auth/users foundation, env validation, and Prisma baseline.
6. Next action: complete backend module hardening and connect frontend API layer to backend endpoints.
