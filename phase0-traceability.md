# Phase 0 Requirement Traceability Matrix

Purpose:
Map BRD requirements to implementation phases, target artifacts, and verification gates to prevent coverage gaps.

Status legend:

- Pending: not started
- In Progress: currently being implemented
- Done: completed and verified

## A. Product and Scope Requirements

| ID   | Requirement                                               | BRD Section | Planned Phase | Target Artifacts                                   | Verification                                    | Status  |
| ---- | --------------------------------------------------------- | ----------- | ------------- | -------------------------------------------------- | ----------------------------------------------- | ------- |
| A-01 | AI interview preparation platform with MVP-first strategy | 1           | 7             | Frontend flows, backend modules, worker processors | End-to-end scenario tests for milestone A and B | Pending |
| A-02 | Architecture supports incremental advanced AI features    | 1           | 6, 8          | AI abstraction, embeddings/vector seams            | No core refactor required to add embeddings     | Pending |

## B. Monorepo and Toolchain

| ID   | Requirement                                                | BRD Section | Planned Phase | Target Artifacts                                            | Verification                 | Status |
| ---- | ---------------------------------------------------------- | ----------- | ------------- | ----------------------------------------------------------- | ---------------------------- | ------ |
| B-01 | pnpm workspace monorepo structure                          | 2           | 1             | root workspace files, apps/, packages/, docker/, workflows/ | Folder and config validation | Done   |
| B-02 | Node 22, pnpm 9.12.0, strict TS, ES2022, Node16 resolution | 2           | 1             | package manager config, tsconfig.base                       | Typecheck and runtime checks | Done   |
| B-03 | apps only for deployables, packages for shared code        | 2           | 1             | directory conventions                                       | Repo structure review        | Done   |

## C. Frontend Requirements

| ID   | Requirement                                                       | BRD Section       | Planned Phase | Target Artifacts                           | Verification                                    | Status  |
| ---- | ----------------------------------------------------------------- | ----------------- | ------------- | ------------------------------------------ | ----------------------------------------------- | ------- |
| C-01 | Next.js + React + TS + Zod + ESLint + Jest                        | 3                 | 2             | apps/frontend scaffold                     | Build, lint, test scripts pass                  | Pending |
| C-02 | No Next.js API routes for backend business logic                  | 3, 31             | 2             | frontend API client layer only             | Repo check: no business APIs in frontend routes | Pending |
| C-03 | Frontend communicates with NestJS via HTTP APIs                   | 3                 | 2, 7          | API client module + contracts              | Integration tests against backend               | Pending |
| C-04 | Route model with root landing and coach under /interview-coach/\* | 3 + Query Answers | 2             | app router pages and route helpers         | Route integration and navigation tests          | Pending |
| C-05 | /interview-coach works correctly behind Cloudflare                | 3, 21             | 2, 9          | Next config and deployment settings        | Preview deploy verification                     | Pending |
| C-06 | Reusable components and centralized API layer                     | 3                 | 2             | UI primitives and data client architecture | Frontend code review and tests                  | Pending |

## D. Backend Requirements

| ID   | Requirement                                        | BRD Section        | Planned Phase | Target Artifacts                     | Verification                        | Status  |
| ---- | -------------------------------------------------- | ------------------ | ------------- | ------------------------------------ | ----------------------------------- | ------- |
| D-01 | NestJS + TS + Prisma + PostgreSQL + JWT + Passport | 4, 15              | 3             | backend app scaffold and modules     | Unit/integration tests              | Pending |
| D-02 | Feature module architecture and thin controllers   | 4                  | 3             | domain module structure              | Code review and architecture checks | Pending |
| D-03 | REST endpoints and API versioning with /api/v1     | 14 + Query Answers | 3, 7          | controllers and global prefix config | Endpoint tests under /api/v1 only   | Pending |
| D-04 | Health endpoint availability                       | 14, 32             | 3             | health module                        | GET /api/v1/health check            | Pending |
| D-05 | Auth foundation with secure password hashing       | 15, 27             | 3             | auth module, guards, JWT strategy    | Auth integration tests              | Pending |

## E. AI Architecture and Structured Output

| ID   | Requirement                                    | BRD Section | Planned Phase | Target Artifacts                        | Verification                          | Status  |
| ---- | ---------------------------------------------- | ----------- | ------------- | --------------------------------------- | ------------------------------------- | ------- |
| E-01 | Gemini as initial provider with abstraction    | 5           | 6             | ai provider interface + gemini provider | Service tests with provider selection | Pending |
| E-02 | Provider switch via env config                 | 5, 20       | 6             | config module and provider factory      | Env-based provider resolution tests   | Pending |
| E-03 | No LangChain/LangGraph initially               | 5, 31       | 6             | dependency policy                       | Dependency audit                      | Pending |
| E-04 | Structured AI response validation with schemas | 6           | 6             | zod schemas and parsing pipeline        | schema validation tests               | Pending |
| E-05 | Prompt layer files separated from services     | 7           | 6             | prompt files under ai/prompts           | File structure and usage check        | Pending |

## F. Resume, Storage, and Document Data

| ID   | Requirement                                      | BRD Section | Planned Phase | Target Artifacts                     | Verification                                | Status  |
| ---- | ------------------------------------------------ | ----------- | ------------- | ------------------------------------ | ------------------------------------------- | ------- |
| F-01 | Resume upload supports PDF initially             | 8           | 4             | upload controller/service validation | file type tests                             | Pending |
| F-02 | Async workflow for processing, non-blocking HTTP | 8, 12       | 4, 5          | enqueue logic and status model       | async processing tests                      | Pending |
| F-03 | Object storage abstraction and R2 provider       | 9           | 4             | storage interface + r2 provider      | integration tests with provider mocks/stubs | Pending |
| F-04 | Do not store PDF binary in PostgreSQL            | 9, 31       | 4             | metadata-only persistence            | DB schema and repository checks             | Pending |
| F-05 | Document/Chunk schema prepared for embeddings    | 10, 11      | 8             | Prisma schema evolution              | migration validation                        | Pending |

## G. Database and Data Modeling

| ID   | Requirement                                 | BRD Section | Planned Phase | Target Artifacts                  | Verification                        | Status  |
| ---- | ------------------------------------------- | ----------- | ------------- | --------------------------------- | ----------------------------------- | ------- |
| G-01 | PostgreSQL + Prisma migrations              | 10          | 3             | prisma schema, migrations         | migration and seed command success  | Pending |
| G-02 | Initial entities for MVP and evolution path | 10          | 3, 8          | core models + future-ready models | CRUD and relational integrity tests | Pending |
| G-03 | Indexes and foreign keys where appropriate  | 10          | 3             | schema indexes and relations      | query plan and integration tests    | Pending |

## H. Queue and Worker

| ID   | Requirement                               | BRD Section | Planned Phase | Target Artifacts                    | Verification                             | Status  |
| ---- | ----------------------------------------- | ----------- | ------------- | ----------------------------------- | ---------------------------------------- | ------- |
| H-01 | Redis 7 + BullMQ + @nestjs/bullmq         | 12          | 5             | queue module and worker integration | queue integration tests                  | Pending |
| H-02 | Worker as long-running NestJS process     | 13          | 5             | apps/worker runtime                 | process startup and job execution checks | Pending |
| H-03 | Do not deploy worker as Cloudflare Worker | 13, 21, 31  | 9             | deployment docs and workflows       | deployment review                        | Pending |

## I. Deployment and Runtime

| ID   | Requirement                                       | BRD Section        | Planned Phase | Target Artifacts                           | Verification                             | Status  |
| ---- | ------------------------------------------------- | ------------------ | ------------- | ------------------------------------------ | ---------------------------------------- | ------- |
| I-01 | Frontend deploy via OpenNext to Cloudflare Worker | 21                 | 9             | deploy frontend workflow and config        | staging deployment test                  | Pending |
| I-02 | Backend Worker preferred, ECS/Fargate fallback    | 21 + Query Answers | 9             | compatibility gate doc + deployment config | compatibility audit result               | Pending |
| I-03 | Keep backend deployment-independent architecture  | Query Answers      | 3, 9          | clean runtime boundaries and adapters      | no business-layer changes across targets | Pending |
| I-04 | Do not use Cloudflare Pages                       | 21, 31             | 9             | deployment docs and workflows              | CI/workflow review                       | Pending |

## J. Docker and Local Development

| ID   | Requirement                                       | BRD Section | Planned Phase | Target Artifacts                | Verification                  | Status      |
| ---- | ------------------------------------------------- | ----------- | ------------- | ------------------------------- | ----------------------------- | ----------- |
| J-01 | Docker local infra with PostgreSQL 16 and Redis 7 | 18          | 9             | compose files                   | services up and health checks | Pending     |
| J-02 | Local ports: PostgreSQL 5433 and Redis 6380       | 18          | 9             | compose port bindings           | runtime port verification     | Pending     |
| J-03 | Standard dev/build/lint/typecheck/test commands   | 19          | 1             | root scripts and turbo pipeline | command execution checks      | Done        |
| J-04 | App-specific run commands by filter               | 19          | 1             | package scripts                 | app startup checks            | Done        |
| J-05 | .env.example with no real secrets                 | 19, 20, 32  | 1, 10         | env templates                   | secret scan and review        | In Progress |

## K. Security, Quality, and Testing

| ID   | Requirement                                                     | BRD Section | Planned Phase | Target Artifacts                              | Verification                   | Status  |
| ---- | --------------------------------------------------------------- | ----------- | ------------- | --------------------------------------------- | ------------------------------ | ------- |
| K-01 | Security controls baseline                                      | 27          | 3, 4, 10      | validation, authz, CORS, headers, rate limits | security integration checks    | Pending |
| K-02 | Avoid sensitive logging and secret leakage                      | 20, 27, 31  | 3, 10         | logging policy and sanitizers                 | log audit tests                | Pending |
| K-03 | Jest tests across frontend/backend/worker                       | 24          | 2, 3, 5, 10   | unit/integration/e2e suites                   | CI passing tests               | Pending |
| K-04 | Use real PostgreSQL and Redis for backend e2e where appropriate | 24          | 10            | test infra setup                              | e2e pipeline pass              | Pending |
| K-05 | Code quality toolchain and hooks                                | 26          | 1             | lint/format/hooks config                      | local pre-commit and CI checks | Done    |

## L. CI/CD and Documentation

| ID   | Requirement                                            | BRD Section | Planned Phase | Target Artifacts                                   | Verification                   | Status  |
| ---- | ------------------------------------------------------ | ----------- | ------------- | -------------------------------------------------- | ------------------------------ | ------- |
| L-01 | Required GitHub workflows                              | 23          | 10            | ci, deploy-frontend, deploy-backend, deploy-worker | workflow dry-runs and checks   | Pending |
| L-02 | CI includes install/lint/typecheck/tests/build         | 23          | 10            | CI pipeline definitions                            | green pipeline on PR           | Pending |
| L-03 | README with full architecture and operational sections | 30          | 10            | README and diagrams                                | documentation review checklist | Pending |

## M. UI/UX Design Requirements (Mandatory in MVP)

| ID   | Requirement                                                        | BRD Section           | Planned Phase | Target Artifacts                             | Verification                      | Status  |
| ---- | ------------------------------------------------------------------ | --------------------- | ------------- | -------------------------------------------- | --------------------------------- | ------- |
| M-01 | Portfolio-consistent visual language, independently recreated      | UI/UX + Query Answers | 2, 7          | design tokens, UI primitives, page templates | visual acceptance checklist       | Pending |
| M-02 | Polished product UX from MVP start, not admin dashboard look       | UI/UX + Query Answers | 2, 7          | polished layouts for key screens             | UX review and stakeholder signoff | Pending |
| M-03 | Landing page UX with hero and primary CTAs                         | UI/UX                 | 2, 7          | root and coach entry pages                   | route and UI verification         | Pending |
| M-04 | Interview coach page UX sections and controls                      | UI/UX                 | 7             | coach workflow pages                         | functional UI walkthrough         | Pending |
| M-05 | Dashboard UX metrics/actions/history                               | UI/UX                 | 7             | dashboard page and widgets                   | acceptance walkthrough            | Pending |
| M-06 | Resume analysis and interview results card/badge/progress patterns | UI/UX                 | 7             | analysis and results pages                   | UI acceptance checklist           | Pending |

## N. Prohibited Technologies and Patterns

| ID   | Rule                                                 | BRD Section | Enforcement Method                 | Status  |
| ---- | ---------------------------------------------------- | ----------- | ---------------------------------- | ------- |
| N-01 | No MongoDB                                           | 31          | dependency and architecture review | Pending |
| N-02 | No second database without clear reason              | 31          | architecture review gate           | Pending |
| N-03 | No Kafka                                             | 31          | dependency review                  | Pending |
| N-04 | No Kubernetes                                        | 31          | infra review                       | Pending |
| N-05 | No LangChain/LangGraph in initial implementation     | 5, 31       | dependency review                  | Pending |
| N-06 | No separate vector DB                                | 11, 31      | architecture review                | Pending |
| N-07 | No Next.js API routes for business backend APIs      | 3, 31       | repository lint rule/manual review | Pending |
| N-08 | No Gemini API key exposure in frontend               | 20, 31      | env and code scan                  | Pending |
| N-09 | No synchronous expensive AI pipeline in request path | 8, 31       | architecture and load tests        | Pending |
| N-10 | No worker deployment as Cloudflare Worker            | 13, 21, 31  | deployment review                  | Pending |
| N-11 | No Cloudflare Pages deployment                       | 21, 31      | deployment review                  | Pending |
| N-12 | No Nginx unless explicitly required                  | 21, 31      | infra design gate                  | Pending |

## O. Phase 0 Exit Checklist

1. Route map signed off:

- Root: /
- Interview Coach root: /interview-coach
- Feature routes: /interview-coach/\*
- Canonical examples:
  - /interview-coach/resume
  - /interview-coach/analysis
  - /interview-coach/interview/[id]
  - /interview-coach/results/[id]

2. Endpoint versioning signed off:

- All REST APIs under /api/v1

3. Deployment decision gate signed off:

- Backend compatibility check criteria for Cloudflare Worker documented
- ECS/Fargate fallback accepted as default fallback target

4. UI acceptance checklist signed off:

- Typography, spacing, colors, radii, cards, buttons, navigation, transitions, background treatment, and product polish criteria documented
- Responsive behavior and loading/empty/error/success feedback criteria documented
- UI polish is required for MVP sign-off, but polish iteration does not block core backend implementation progress

5. Requirement mapping complete:

- Every BRD section mapped to implementation phase and verification

6. No open contradiction remains between core BRD sections and Query Answers.

## P. Phase 0 Artifact Status

| Artifact                              | Path                                                  | Status      | Notes                                                             |
| ------------------------------------- | ----------------------------------------------------- | ----------- | ----------------------------------------------------------------- |
| Phase blueprint                       | phasePlan.md                                          | Done        | Phase sequence, goals, dependencies, and exit gates finalized     |
| Requirement traceability matrix       | phase0-traceability.md                                | In Progress | Matrix active; Phase 1 rows updated with validation outcomes      |
| Canonical routing contract            | docs/phase-0/canonical-routing-contract.md            | Done        | Canonical nested Interview Coach routes and examples finalized    |
| Canonical API contract                | docs/phase-0/canonical-api-contract.md                | Done        | /api/v1 contract defined for all initial endpoints                |
| UI/UX acceptance checklist            | docs/phase-0/ui-ux-acceptance-checklist.md            | Done        | Portfolio-consistent, responsive, and state-feedback criteria set |
| Backend deployment compatibility gate | docs/phase-0/backend-deployment-compatibility-gate.md | Done        | Mandatory Worker compatibility checks finalized                   |

## Q. Sign-Off Decisions (Closed)

1. Frontend routing confirmed:
   - Engineering Lab landing remains at /
   - Interview Coach product screens remain under /interview-coach/\*
   - Future projects can use their own top-level paths
2. API versioning confirmed:
   - /api/v1 is mandatory for all public REST endpoints
   - Equivalent unversioned business/API endpoints must not be exposed
3. MVP UI acceptance confirmed:
   - UI/UX checklist is the mandatory quality gate for MVP sign-off
   - UI must include responsive behavior and proper loading/empty/error/success states
   - UI polish must not block core backend functionality implementation progress
4. Backend compatibility gate confirmed:
   - Cloudflare Worker remains preferred backend deployment target
   - ECS/Fargate is default fallback if any critical compatibility check fails
   - Backend architecture remains unchanged; only runtime/deployment target changes
   - BullMQ worker remains a long-running container process, not a Cloudflare Worker
