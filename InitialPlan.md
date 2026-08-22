## Plan: AI Interview Coach Monorepo Execution Plan

Build a production-quality TypeScript monorepo for AI Interview Coach with polished UI from day one, Cloudflare-first deployment strategy, strict API versioning, async processing, and extensible AI architecture. The implementation should prioritize maintainability and clear module boundaries while delivering a portfolio-grade product experience early.

**Steps**

1. Phase 0: Requirement Freeze and Traceability Matrix
2. Convert all BRD requirements into a traceability checklist grouped by platform areas: frontend, backend, worker, data, infra, CI/CD, security, docs.
3. Lock non-negotiables from clarified decisions: polished UI from MVP start, portfolio-consistent design language, backend `/api/v1` prefix on all endpoints, root Engineering Lab page, Interview Coach under `/interview-coach`, Cloudflare Worker as preferred backend target, ECS/Fargate Docker fallback when Worker-incompatible.
4. Define exclusions for initial scope: no Kubernetes, no Kafka, no LangChain/LangGraph, no separate vector DB, no Cloudflare Pages.

5. Phase 1: Monorepo Foundation (blocks all later phases)
6. Initialize pnpm workspace with required structure: apps/frontend, apps/backend, apps/worker, packages/shared-types, docker, .github/workflows.
7. Configure root toolchain with Node 22, pnpm 9.12.0, strict TypeScript (ES2022, Node16 resolution), turbo orchestration, ESLint, Prettier, Husky, lint-staged.
8. Implement root scripts and app filters: dev/build/lint/typecheck/test/test:e2e and app-specific run commands.
9. Create environment contract templates with separated backend/frontend/worker env examples and secret safety guidance.

10. Phase 2: Frontend Product Shell + Design System (starts immediately after Phase 1)
11. Scaffold Next.js frontend with TypeScript, Zod, ESLint, Jest.
12. Implement route architecture:
13. `/` as Engineering Lab landing page (no redirect).
14. `/interview-coach` as public showcase entry page.
15. Feature routes under `/interview-coach/*`: login, register, dashboard, resume, interviews, interview detail.
16. Build dedicated frontend API client layer and request/response typing strategy (no scattered fetch logic).
17. Recreate design system independently with portfolio visual parity targets:
18. Typography hierarchy equivalent to portfolio reference.
19. Spacing scale, radii, card language, button styles, color system, background treatment.
20. Navigation style and transition rhythm aligned with existing portfolio feel.
21. Motion/animation conventions and reduced-motion support.
22. Dark/light behavior parity if present in final selected theme behavior.
23. Implement reusable UI primitives and section templates for SaaS-like product polish, not admin-dashboard default styling.

24. Phase 3: Backend Core Platform (parallelizable with late Phase 2 feature UI)
25. Scaffold NestJS backend with modular architecture and global platform setup: validation pipes, exception filters, config validation, CORS, secure headers baseline.
26. Enforce global REST prefix `/api/v1` from day one.
27. Add Prisma + PostgreSQL integration with migration and seed workflow.
28. Implement auth foundation: register/login, bcrypt hashing, JWT issuance, Passport JWT strategy, auth guards, `/api/v1/users/me`.
29. Implement health endpoint at `/api/v1/health`.
30. Create domain modules: users, resumes, jobs, interviews, questions, answers, evaluations.
31. Keep controllers thin: request validation -> service orchestration -> response mapping.

32. Phase 4: Storage and Async Resume Processing Foundation
33. Implement storage abstraction and Cloudflare R2 provider.
34. Build resume upload pipeline with PDF type/size validation and metadata persistence in PostgreSQL (no binary storage in DB).
35. Implement async workflow: upload -> metadata create -> enqueue processing -> return status.
36. Add status endpoints and processing lifecycle states.

37. Phase 5: Queue + Worker Runtime
38. Integrate Redis 7 + BullMQ + Nest BullMQ in backend for job enqueueing.
39. Build worker app as long-running NestJS process/container, not Cloudflare Worker.
40. Implement processors for resume processing, analysis tasks, and interview processing.
41. Add retries, backoff, failure state persistence, and idempotency keys.

42. Phase 6: AI Platform and Structured Outputs
43. Implement AI provider abstraction with `generateText` and `generateStructured` contract.
44. Implement Gemini provider first; add OpenAI/Ollama placeholders behind the same interface.
45. Implement provider selection via environment (`AI_PROVIDER`).
46. Create prompt layer files for resume analysis, question generation, answer evaluation, and follow-up question generation.
47. Enforce structured output validation with Zod schemas and malformed output handling.
48. Implement AI usage tracking persistence (provider, model, operation, token usage, latency, status, errors).

49. Phase 7: MVP Functional Flows with Polished UX
50. Deliver milestone A end-to-end:
51. Register/login.
52. Resume upload.
53. Job description submission.
54. Resume + JD analysis via Gemini.
55. Structured result display (score, matching skills, missing skills, strengths, weaknesses, recommendations).
56. Deliver milestone B interview flow:
57. Interview creation.
58. Personalized question generation.
59. Answer submission.
60. AI evaluation + follow-up questions.
61. Interview history and results view.
62. Ensure all core flows are presented in polished, portfolio-consistent product UI from MVP start.

63. Phase 8: RAG-Ready Expansion and Cost Controls
64. Add pgvector-ready schema and module seams for embeddings/vector-search.
65. Implement incremental embedding storage and retrieval scaffolding without full RAG orchestration initially.
66. Add rate limiting for costly endpoints using Redis.
67. Add optional caching for repeated expensive AI operations.

68. Phase 9: Docker and Deployment Strategy
69. Build local Docker setup with PostgreSQL 16 and Redis 7 using required local port mappings.
70. Provide backend and worker Dockerfiles using node:22-alpine where appropriate.
71. Implement frontend deployment pipeline for Cloudflare Worker via OpenNext/Wrangler with `/interview-coach` routing compatibility.
72. Backend deployment decision gate:
73. First preference: Cloudflare Worker deployment for backend.
74. If incompatibilities are confirmed, use Dockerized NestJS deployment targeting AWS ECS/Fargate as default fallback.
75. Keep backend runtime architecture deployment-independent so switching targets requires no module redesign.
76. Defer full ECS infrastructure as code unless needed for deployment phase.

77. Phase 10: CI/CD, Quality Gates, Security, Documentation
78. Implement GitHub workflows: ci.yml, deploy-frontend.yml, deploy-backend.yml, deploy-worker.yml (optional deploy-full.yml).
79. CI gates: install, lint, typecheck, unit tests, backend e2e tests, build.
80. Testing strategy:
81. Frontend unit/component tests.
82. Backend unit/integration/e2e tests with real PostgreSQL/Redis for e2e contexts.
83. Worker processor and queue integration tests.
84. Security baseline:
85. Input validation, authz/authn, password hashing, rate limiting, CORS, secure headers.
86. File validation and safe handling of untrusted resume/JD text.
87. Secret protection and sensitive log redaction.
88. Prompt-injection-aware content handling safeguards.
89. Create comprehensive README and architecture diagram covering all requested sections and deployment trade-offs.

**Relevant files**

- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/BRD.md — authoritative requirements source.
- /Users/prashantbhalekar/Desktop/practice/my-portfolio/src/styles.css — visual token and styling reference baseline.
- /Users/prashantbhalekar/Desktop/practice/my-portfolio/src/components/site/nav.tsx — navigation interaction reference.
- /Users/prashantbhalekar/Desktop/practice/my-portfolio/src/components/site/primitives.tsx — card/reveal interaction reference.
- /Users/prashantbhalekar/Desktop/practice/my-portfolio/src/constants/site.ts — motion timing/easing reference.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/package.json — root tooling and scripts.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/pnpm-workspace.yaml — workspace package topology.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/turbo.json — task pipeline graph.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/tsconfig.base.json — strict TS baseline.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/frontend/next.config.ts — route behavior and deployment path handling.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/frontend/src/lib/api-client.ts — centralized frontend API layer.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/backend/src/main.ts — global backend bootstrap and `/api/v1` enforcement.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/backend/src/app.module.ts — module composition.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/backend/src/auth/\* — authentication foundation.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/backend/src/ai/interfaces/ai-provider.interface.ts — AI abstraction contract.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/backend/src/ai/providers/gemini.provider.ts — Gemini implementation.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/backend/src/ai/prompts/\* — prompt layer.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/backend/prisma/schema.prisma — DB entities and indexing.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/backend/src/queue/\* — enqueue infrastructure.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/backend/src/storage/\* — R2 abstraction/provider.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/worker/src/worker.module.ts — worker composition.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/apps/worker/src/processors/\* — BullMQ processors.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/packages/shared-types/src/\* — shared DTO contracts.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/docker/\* — compose and Docker runtime files.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/.github/workflows/\* — CI/CD workflows.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/.env.example — env contract.
- /Users/prashantbhalekar/Desktop/practice/ai-interview-coach/README.md — setup and architecture docs.

**Verification**

1. BRD coverage verification: each requirement maps to implementation task(s) and acceptance test(s).
2. Frontend routing verification: root lab page works, `/interview-coach` primary showcase works, nested coach routes function correctly.
3. API contract verification: all endpoints are reachable under `/api/v1/*` only.
4. MVP UI verification: core pages satisfy portfolio-consistent typography, spacing, colors, card/button language, motion, and navigation behavior.
5. Infrastructure verification: local PostgreSQL and Redis start on required ports via Docker.
6. Backend verification: migrations/seed run and `/api/v1/health` is green.
7. Resume pipeline verification: PDF upload validates, stores via R2 abstraction, queues processing, and reports status.
8. AI verification: Gemini structured outputs pass schema validation; malformed responses are safely handled.
9. Queue verification: backend enqueue and worker consume path works with retries/backoff and persistent status updates.
10. Security verification: auth guards, validation, rate-limits, secret handling, and sensitive log redaction checks pass.
11. CI verification: workflows pass install/lint/typecheck/tests/build.
12. Deployment verification: frontend Cloudflare deployment works; backend Worker compatibility gate documented; ECS/Fargate fallback path prepared if needed.

**Decisions**

- UI is not deferred. Polished portfolio-consistent product UI is an MVP requirement from the beginning.
- Root route remains Engineering Lab landing page for future project expansion.
- Interview Coach is mounted at `/interview-coach` with nested product routes.
- Backend uses `/api/v1` prefix on all REST APIs from day one.
- Backend prefers Cloudflare Worker deployment; fallback is Dockerized NestJS on AWS ECS/Fargate if compatibility issues are proven.
- Backend architecture must remain deployment-independent so runtime target can switch without redesign.

**Further Considerations**

1. Add a visual acceptance checklist tied to specific UI screens so design parity can be tested objectively during implementation.
2. Add a backend compatibility audit checkpoint before deployment scripts are finalized to avoid rework between Worker and ECS targets.
3. Keep architecture docs continuously updated per phase so CI/CD and deployment decisions remain traceable.
