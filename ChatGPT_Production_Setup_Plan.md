We need to prepare this project for a cost-conscious Phase 1 production deployment while keeping the existing architecture fully extensible for Phase 2.

IMPORTANT:

- First inspect the entire repository and understand the current implementation.
- Do NOT blindly rewrite existing working functionality.
- Do NOT remove Phase 2 architecture just because it is disabled in Phase 1.
- The goal is to make Phase 1 run WITHOUT requiring Redis, BullMQ worker, pgvector, embeddings, distributed cache, OpenAI, or other optional infrastructure.
- Optional infrastructure must be controlled through environment/configuration.
- Later, Phase 2 should ideally require infrastructure/env changes rather than major application-code changes.
- Preserve existing API contracts and `/api/v1/*` versioning.
- Do not introduce fake implementations or fake production data.
- Do not add unnecessary dependencies.
- Keep the architecture clean enough to explain in a senior backend interview.

==================================================

1. PRIMARY OBJECTIVE
   \==================================================

Prepare the application for:

PHASE 1:

- Minimal production infrastructure
- Low/no unnecessary infrastructure cost
- Single backend instance
- PostgreSQL
- Gemini (minimal possible version for cost)
- Cloudflare R2
- Synchronous AI processing
- No Redis requirement
- No BullMQ requirement
- No separate worker deployment
- No pgvector
- No embeddings/RAG
- No distributed cache
- No distributed rate limiting
- No OpenAI requirement
- No production Ollama requirement

PHASE 2:

- Redis
- BullMQ
- Separate NestJS worker
- Async AI processing
- Redis-backed cache
- Distributed rate limiting
- pgvector
- Embeddings
- RAG
- Multiple backend instances
- Optional OpenAI provider
- Better observability/scaling

The codebase must support both phases cleanly.

================================================== 2. CREATE A NEW ARCHITECTURE DOCUMENT
==================================================

Create this file:

docs/PHASE-1-PRODUCTION-ARCHITECTURE.md

This file is mandatory.

It must become the single source of truth for the current deployment architecture and future Phase 2 architecture.

Document ALL of the following:

A. Project overview
B. Current monorepo architecture
C. Phase 1 architecture
D. Phase 2 architecture
E. Request flow
F. Authentication flow
G. Resume upload/storage flow
H. Resume analysis flow
I. Interview/question generation flow
J. Answer evaluation flow
K. Current synchronous processing flow
L. Future asynchronous BullMQ flow
M. Database architecture
N. Redis architecture
O. AI provider architecture
P. Storage architecture
Q. Frontend architecture
R. Backend architecture
S. Worker architecture
T. Environment variables
U. Which env variables are required in Phase 1
V. Which env variables are disabled/optional in Phase 1
W. Which env variables become required in Phase 2
X. Infrastructure required in Phase 1
Y. Infrastructure intentionally NOT deployed in Phase 1
Z. Infrastructure required in Phase 2
AA. Deployment flow
AB. CI/CD flow
AC. Health/readiness flow
AD. Security considerations
AE. Scaling path
AF. Rollback considerations
AG. Cost-control considerations
AH. Migration checklist from Phase 1 → Phase 2
AI. Exact steps to enable Redis/BullMQ later
AJ. Exact steps to enable embeddings/pgvector later
AK. Exact steps to enable distributed rate limiting later

Use diagrams where useful using Mermaid.

================================================== 3. PHASE 1 TARGET ARCHITECTURE
==================================================

Implement/configure the application so Phase 1 looks conceptually like:

                    ┌──────────────────────────┐
                    │ Cloudflare                │
                    │ Next.js / OpenNext        │
                    │ lab.prashantbhalekar.dev  │
                    └────────────┬─────────────┘
                                 │
                                 │ HTTPS
                                 ▼
                    ┌──────────────────────────┐
                    │ NestJS Backend            │
                    │ /api/v1/*                 │
                    │ Single instance            │
                    └───────┬─────────┬────────┘
                            │         │
                    PostgreSQL        │
                            │         │
                            ▼         ▼
                    ┌────────────┐  ┌───────────────┐
                    │ PostgreSQL │  │ Gemini        │
                    │            │  │ Flash-Lite    │
                    └────────────┘  └───────────────┘

                            │
                            ▼
                    ┌────────────────┐
                    │ Cloudflare R2  │
                    │ Resume storage │
                    └────────────────┘

IMPORTANT:

Redis should NOT be required for this architecture.

BullMQ should NOT be required for this architecture.

The separate worker should NOT be required for this architecture.

================================================== 4. PHASE 1 VS PHASE 2 FEATURE MATRIX
==================================================

Add a clear table to the documentation similar to:

Feature Phase 1 Phase 2
---------------------------------------------------------

PostgreSQL ENABLED ENABLED
Gemini ENABLED ENABLED
R2 ENABLED ENABLED
JWT auth ENABLED ENABLED
Redis DISABLED ENABLED
BullMQ DISABLED ENABLED
NestJS Worker NOT DEPLOYED DEPLOYED
Async resume analysis DISABLED ENABLED
Redis cache DISABLED ENABLED
Distributed rate limiting DISABLED ENABLED
pgvector DISABLED ENABLED
Embeddings DISABLED ENABLED
RAG DISABLED ENABLED
OpenAI DISABLED OPTIONAL
Ollama production DISABLED OPTIONAL
Multiple backend replicas DISABLED ENABLED
Advanced observability BASIC ENABLED
Usage/token tracking BASIC/OPTIONAL ENABLED

Make sure this reflects the actual implementation after inspecting the repository.

================================================== 5. REDIS MUST BE OPTIONAL
==================================================

This is one of the most important requirements.

The backend must be able to start and operate successfully when:

REDIS_ENABLED=false

or equivalent configuration.

Do NOT allow application startup to fail simply because Redis is unavailable when Redis is disabled.

Create/use a centralized configuration such as:

REDIS_ENABLED=false

When false:

- Do not require REDIS_URL.
- Do not initialize Redis connections.
- Do not create Redis-dependent providers.
- Do not fail application startup.
- Do not require BullMQ.
- Do not require the worker.
- Do not require Redis-backed cache.
- Do not require Redis-backed rate limiting.

When true:

- Validate REDIS_URL.
- Initialize Redis.
- Allow Redis-backed features.
- Allow BullMQ.
- Allow distributed cache.
- Allow distributed rate limiting.

Do NOT scatter `process.env.REDIS_ENABLED` throughout the application.

Use a proper configuration module/service.

Example conceptual configuration:

REDIS_ENABLED=false
REDIS_URL=

================================================== 6. BULLMQ MUST BE OPTIONAL
==================================================

The current code may contain BullMQ/queue architecture.

Do NOT remove it.

Instead make it configurable:

QUEUE_ENABLED=false

or:

BULLMQ_ENABLED=false

When disabled:

- Backend must work normally.
- No Redis dependency.
- No queue connection.
- No worker dependency.
- Resume analysis should use the Phase 1 synchronous path.
- AI operations that currently support queues must have a synchronous fallback.

When enabled:

- Queue jobs should be created.
- Worker should process jobs.
- Redis should be required.
- Async processing should be used.

The business/service layer must not be tightly coupled to BullMQ.

Use an abstraction such as:

AIProcessingService
├── Sync processing
└── Queue processing

or an equivalent clean design.

The controller should not contain queue-specific implementation details.

================================================== 7. SYNCHRONOUS FALLBACK
==================================================

For Phase 1:

Resume analysis should work like:

POST /api/v1/ai/resume-analysis
|
▼
Controller
|
▼
AI Service
|
▼
Gemini Provider
|
▼
Validate structured response
|
▼
Save result
|
▼
Return response

No Redis.
No BullMQ.
No worker.

When Phase 2 is enabled:

POST /api/v1/ai/resume-analysis
|
▼
Controller
|
▼
AI Processing Service
|
▼
Queue
|
▼
Redis
|
▼
BullMQ Worker
|
▼
Gemini
|
▼
PostgreSQL
|
▼
Frontend polls/statuses result

Keep the domain/business logic common between these two paths.

================================================== 8. CACHE MUST BE OPTIONAL
==================================================

Make caching configurable.

Example:

CACHE_ENABLED=false

Phase 1:

- Cache disabled.
- Application should still work normally.
- No Redis required.

Phase 2:

- CACHE_ENABLED=true
- Redis-backed cache can be used.

Do not make business logic depend directly on Redis.

Use an abstraction/interface such as:

CacheService

Possible implementations:

NoOpCacheService
RedisCacheService

When CACHE_ENABLED=false, use the no-op implementation.

Do NOT duplicate business logic.

================================================== 9. RATE LIMITING MUST BE OPTIONAL/DESIGNED FOR UPGRADE
==================================================

Phase 1 can use the existing single-instance/in-memory rate limiter if already implemented.

Do NOT require Redis for rate limiting in Phase 1.

Introduce configuration such as:

RATE_LIMIT_ENABLED=true

RATE_LIMIT_STORE=memory

Possible future:

RATE_LIMIT_STORE=redis

Phase 1:

RATE_LIMIT_STORE=memory

Phase 2:

RATE_LIMIT_STORE=redis

Make sure the application does not require Redis just because rate limiting is enabled.

Document clearly that memory-based rate limiting is suitable only for a single backend instance and is not distributed.

================================================== 10. PGVECTOR / EMBEDDINGS / RAG MUST NOT BE REQUIRED
==================================================

Do NOT deploy pgvector in Phase 1.

Do NOT create embedding jobs in Phase 1.

Do NOT make application startup dependent on pgvector.

Do NOT require embedding-related environment variables.

If these modules already exist:

- keep the architecture
- make them disabled
- prevent them from initializing unnecessarily

Add configuration such as:

EMBEDDINGS_ENABLED=false
RAG_ENABLED=false

Phase 1:

EMBEDDINGS_ENABLED=false
RAG_ENABLED=false

Phase 2:

EMBEDDINGS_ENABLED=true
RAG_ENABLED=true

Document the future flow:

Resume/JD
↓
Chunking
↓
Embedding model
↓
pgvector
↓
Semantic retrieval
↓
RAG context
↓
Gemini
↓
Structured response

Do not implement/deploy unnecessary RAG infrastructure now unless the existing code already requires it.

================================================== 11. AI PROVIDERS
==================================================

Keep the existing AI provider abstraction.

The application should support:

AI_PROVIDER=gemini

Phase 1 production:

AI_PROVIDER=gemini
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_REQUEST_TIMEOUT_MS=30000

Gemini API key must remain backend-only.

Do not expose it to Next.js/browser.

Keep Ollama provider if already implemented, but do not require it in production.

Example:

AI_PROVIDER=ollama

should remain useful for local development if supported.

OpenAI should remain optional.

Do not require OpenAI environment variables if:

AI_PROVIDER != openai

The backend must not fail startup because unused provider credentials are missing.

Use provider-specific configuration validation.

================================================== 12. STORAGE
==================================================

Resume files must NOT depend on local container filesystem for production.

Use a storage abstraction.

Example:

STORAGE_DRIVER=r2

Possible drivers:

local
r2
s3

Phase 1 production:

STORAGE_DRIVER=r2

Local development may use:

STORAGE_DRIVER=local

Phase 2 can continue using R2 or support S3.

The application should interact with something like:

StorageService

rather than directly calling R2/S3/local filesystem throughout business logic.

When local storage is used:

- document that it is development-only/non-durable
- do not use it for production ECS/Fargate/container deployments

R2 credentials/configuration should only be required when:

STORAGE_DRIVER=r2

================================================== 13. WORKER
==================================================

The NestJS worker should NOT be deployed in Phase 1.

Do NOT delete it.

Keep:

apps/worker

but make it Phase 2 infrastructure.

Document:

Phase 1:

- worker code exists
- worker deployment disabled
- BullMQ disabled
- Redis disabled

Phase 2:

- Redis enabled
- BullMQ enabled
- worker deployed
- queue-based processing enabled

The worker should fail clearly if someone tries to start it without required Redis configuration, but the backend must NOT depend on the worker in Phase 1.

================================================== 14. ENVIRONMENT CONFIGURATION
==================================================

Review the current env schema and reorganize it so optional infrastructure is genuinely optional.

Create/update:

.env.example

and document variables in:

docs/PHASE-1-PRODUCTION-ARCHITECTURE.md

Clearly separate:

REQUIRED PHASE 1

OPTIONAL PHASE 1

DISABLED PHASE 1 / PHASE 2

Example:

# =========================

# Core

# =========================

NODE_ENV=production
PORT=3001

# =========================

# Database

# =========================

DATABASE_URL=

# =========================

# Auth

# =========================

JWT_SECRET=

# =========================

# Frontend

# =========================

FRONTEND_URL=https://lab.prashantbhalekar.dev

# =========================

# AI

# =========================

AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_REQUEST_TIMEOUT_MS=30000

# =========================

# Storage

# =========================

STORAGE_DRIVER=r2

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# =========================

# Redis

# Phase 1 disabled

# =========================

REDIS_ENABLED=false
REDIS_URL=

# =========================

# Queue

# Phase 1 disabled

# =========================

QUEUE_ENABLED=false

# =========================

# Cache

# Phase 1 disabled

# =========================

CACHE_ENABLED=false

# =========================

# Rate limiting

# =========================

RATE_LIMIT_ENABLED=true
RATE_LIMIT_STORE=memory

# =========================

# Embeddings / RAG

# Phase 1 disabled

# =========================

EMBEDDINGS_ENABLED=false
RAG_ENABLED=false

Adjust names to match the actual existing code/configuration rather than blindly introducing duplicate variables.

IMPORTANT:

Do not make unused environment variables mandatory.

For example, if:

REDIS_ENABLED=false

then REDIS_URL should not be required.

If:

AI_PROVIDER=gemini

then OPENAI_API_KEY should not be required.

If:

STORAGE_DRIVER=r2

then R2 variables should be required.

If:

STORAGE_DRIVER=local

then R2 variables should not be required.

Use conditional configuration validation where appropriate.

================================================== 15. DATABASE
==================================================

PostgreSQL is REQUIRED in Phase 1.

Keep Prisma as currently implemented.

Production migration must use:

prisma migrate deploy

NOT:

prisma db push

Do not make production startup depend on automatically running destructive schema changes.

Document the production migration process.

Also document:

- backup before destructive migrations
- migration compatibility
- rollback strategy
- Prisma connection configuration

================================================== 16. FRONTEND
==================================================

Keep:

lab.prashantbhalekar.dev/interview-coach

Frontend API base:

https://api.lab.prashantbhalekar.dev/api/v1

Do not introduce direct browser → Gemini calls.

Flow must remain:

Browser
↓
Next.js
↓
NestJS /api/v1
↓
AI Provider

Gemini credentials must never be exposed to the frontend.

Ensure:

NEXT_PUBLIC_API_BASE_URL

contains only the public API URL.

================================================== 17. API VERSIONING
==================================================

Do not change the existing API versioning strategy.

All backend business endpoints must remain under:

/api/v1/*

Examples:

/api/v1/auth/*
/api/v1/resumes/*
/api/v1/interviews/*
/api/v1/ai/*
/api/v1/health

Do not create duplicate unversioned business endpoints.

================================================== 18. HEALTH CHECKS
==================================================

Maintain:

/api/v1/health

and readiness if already implemented.

Important:

Health/readiness must not fail just because optional Redis is disabled.

Example:

Phase 1 readiness:

Database: required
Redis: disabled/ignored
Gemini: not required for basic health

Phase 2 readiness:

Database: required
Redis: required

Do not make the health endpoint call Gemini.

Keep dependency checks separate from application liveness.

================================================== 19. SECURITY
==================================================

Review Phase 1 implementation for:

- strict CORS
- JWT secret validation
- password hashing
- request validation
- rate limiting
- file size limits
- PDF validation
- secure file storage
- no secrets in frontend
- no Gemini API key in logs
- no resume text in logs
- no raw AI provider response exposed to frontend
- safe error responses
- security headers if already supported
- environment validation
- production logging

CORS should allow the actual frontend origin rather than `*`.

For example:

https://lab.prashantbhalekar.dev

Do not expose private resume files publicly from R2.

================================================== 20. AI ERROR HANDLING
==================================================

Keep the Gemini provider abstraction and existing hardening.

Gemini provider should handle:

- timeout
- authentication errors
- 400 errors
- 429 errors
- 5xx errors
- malformed JSON
- empty candidates
- missing content
- missing text
- unexpected provider responses

Do not expose raw Gemini response bodies to the frontend.

Keep Zod/domain validation after provider response parsing.

================================================== 21. LOGGING
==================================================

Phase 1 should have basic structured logging.

Do NOT log:

- passwords
- JWTs
- Gemini API keys
- resume full text
- job description full text
- AI prompts containing sensitive user information
- complete AI responses if they contain user data

Log useful operational information:

- request ID
- endpoint
- HTTP method
- status
- latency
- user ID where appropriate
- AI provider
- model
- operation name
- safe error category

Phase 2 can add more advanced observability.

================================================== 22. DO NOT DEPLOY THESE IN PHASE 1
==================================================

Explicitly document and ensure these are NOT required for Phase 1:

1. Redis
2. ElastiCache
3. BullMQ
4. Separate NestJS worker
5. pgvector
6. Embedding infrastructure
7. RAG
8. Distributed cache
9. Redis-backed rate limiting
10. Multiple backend replicas
11. OpenAI
12. Production Ollama
13. Unnecessary Kafka
14. Kubernetes
15. Elasticsearch
16. Separate vector database
17. Any unnecessary AWS infrastructure

Do not remove their abstractions if already implemented.

Just make them optional/disabled.

================================================== 23. PHASE 1 DEPLOYMENT MODEL
==================================================

Document the actual Phase 1 deployment separately.

Target:

Frontend:
Cloudflare Workers/OpenNext

Backend:
Single NestJS production container/service

Database:
Managed PostgreSQL

Storage:
Cloudflare R2

AI:
Gemini

Redis:
OFF

Worker:
NOT DEPLOYED

Queue:
OFF

Embeddings:
OFF

RAG:
OFF

Cache:
OFF or memory-only where applicable

Rate limiting:
Memory/single-instance

Backend replicas:
1

Clearly document that this is intentionally a single-instance architecture and therefore not horizontally scalable yet.

================================================== 24. PHASE 2 DEPLOYMENT MODEL
==================================================

Document the future target:

Frontend:
Cloudflare Workers/OpenNext

Backend:
Multiple NestJS instances

Redis:
Enabled

BullMQ:
Enabled

Worker:
Separate NestJS worker deployment

Database:
Managed PostgreSQL

Storage:
R2

Cache:
Redis

Rate limiting:
Redis

AI:
Gemini/OpenAI provider abstraction

Embeddings:
Enabled

pgvector:
Enabled

RAG:
Enabled

Observability:
Expanded

Scaling:
Backend and worker independently scalable

================================================== 25. PHASE 1 → PHASE 2 MIGRATION
==================================================

This section is extremely important.

Document exact steps such as:

STEP 1
Provision Redis.

STEP 2
Add:

REDIS_ENABLED=true
REDIS_URL=...

STEP 3
Enable queue:

QUEUE_ENABLED=true

STEP 4
Deploy worker.

STEP 5
Change AI processing mode from synchronous to queued where appropriate.

STEP 6
Enable Redis cache:

CACHE_ENABLED=true

STEP 7
Change rate limiter:

RATE_LIMIT_STORE=redis

STEP 8
Provision pgvector.

STEP 9
Enable:

EMBEDDINGS_ENABLED=true
RAG_ENABLED=true

STEP 10
Run required migrations.

STEP 11
Deploy backend/worker.

STEP 12
Validate queue processing.

Make this a practical runbook rather than vague documentation.

================================================== 26. TESTING REQUIREMENTS
==================================================

Add/update tests so Phase 1 works when:

REDIS_ENABLED=false
QUEUE_ENABLED=false
CACHE_ENABLED=false
EMBEDDINGS_ENABLED=false
RAG_ENABLED=false

Tests must verify:

1. Backend starts without Redis.
2. Backend starts without REDIS_URL.
3. Resume analysis works synchronously.
4. AI provider works.
5. Storage works using configured storage driver.
6. Rate limiting works with memory store.
7. Health endpoint works without Redis.
8. Cache-disabled mode does not break requests.
9. Queue-disabled mode does not break AI operations.

Also test Phase 2 configuration paths where practical:

REDIS_ENABLED=true
QUEUE_ENABLED=true

Do not require an actual production Redis/Gemini service for unit tests.

Mock external services appropriately.

================================================== 27. DO NOT OVERENGINEER
==================================================

Do NOT:

- rewrite the whole architecture
- introduce microservices unnecessarily
- introduce Kafka
- introduce Kubernetes
- introduce Elasticsearch
- introduce another database
- introduce another queue
- introduce another AI framework
- introduce LangChain/LangGraph unless the existing code already requires it
- add unnecessary abstraction layers
- change working APIs without a strong reason

The architecture should remain:

Next.js +
NestJS +
PostgreSQL +
Prisma +
Gemini +
R2

for Phase 1.

Phase 2 adds:

Redis +
BullMQ +
Worker +
pgvector +
Embeddings +
RAG

================================================== 28. IMPORTANT CODE QUALITY REQUIREMENT
==================================================

Use interfaces/configuration to separate optional infrastructure from core business logic.

Prefer architecture such as:

Application
|
+-- AIProcessingService
| |
| +-- SyncAIProcessor
| |
| +-- QueueAIProcessor
|
+-- CacheService
| |
| +-- NoOp/Memory implementation
| |
| +-- Redis implementation
|
+-- StorageService
| |
| +-- Local implementation
| |
| +-- R2 implementation
|
+-- AIProvider
|
+-- Gemini
+-- Ollama
+-- OpenAI (optional)

Use the existing architecture where possible instead of blindly creating these exact classes.

The important principle is:

CORE BUSINESS LOGIC
must NOT directly depend on
REDIS / BULLMQ / R2 / GEMINI / OPENAI.

Those should be replaceable infrastructure implementations.

================================================== 29. DOCUMENT ENVIRONMENT VARIABLES BY PHASE
==================================================

In the new architecture document, create tables like:

Variable | Phase 1 | Phase 2 | Required when

DATABASE_URL | Required | Required | Always
JWT_SECRET | Required | Required | Always
GEMINI_API_KEY | Required | Required | AI_PROVIDER=gemini
GEMINI_MODEL | Required | Required | AI_PROVIDER=gemini
R2_* | Required | Required | STORAGE_DRIVER=r2
REDIS_ENABLED | false | true | Phase 2
REDIS_URL | Not required | Required | REDIS_ENABLED=true
QUEUE_ENABLED | false | true | Phase 2
CACHE_ENABLED | false | true | Phase 2
RATE_LIMIT_STORE | memory | redis | Phase 2
EMBEDDINGS_ENABLED | false | true | Phase 2
RAG_ENABLED | false | true | Phase 2
OPENAI_API_KEY | Not required | Optional | AI_PROVIDER=openai
OLLAMA_* | Local only | Optional | AI_PROVIDER=ollama

Adjust this based on the actual repository.

================================================== 30. DOCUMENT ARCHITECTURE DECISIONS
==================================================

Add an "Architecture Decision Records" section explaining:

Why Redis is disabled in Phase 1:

- avoid unnecessary infrastructure/cost
- single backend instance
- synchronous processing is sufficient for MVP

Why BullMQ is disabled:

- no Redis dependency
- lower operational complexity
- async processing can be introduced later

Why R2 is enabled:

- durable resume storage
- container filesystem is not appropriate for production persistence
- storage abstraction allows future S3 support

Why Gemini is used:

- current production AI provider
- provider abstraction allows future provider changes

Why pgvector is deferred:

- RAG is not required for MVP
- avoid unnecessary database complexity

Why single backend instance:

- Phase 1 cost/complexity control
- application remains ready for horizontal scaling later

================================================== 31. FINAL IMPLEMENTATION REQUIREMENT
==================================================

After making the changes:

1. Run typecheck.
2. Run lint.
3. Run tests.
4. Build backend.
5. Build frontend.
6. Build worker if it exists.
7. Verify Phase 1 configuration with Redis disabled.
8. Verify backend starts without Redis.
9. Verify health endpoint.
10. Verify AI flow.
11. Verify resume upload/storage.
12. Verify interview flow.
13. Verify no Phase 2 dependency accidentally becomes mandatory.

Then provide a concise implementation summary containing:

- Files created
- Files modified
- New environment variables
- Removed/disabled Phase 1 dependencies
- Phase 1 architecture
- Phase 2 architecture
- Tests executed
- Any remaining issues
- Exact commands needed to run Phase 1 locally
- Exact environment changes needed to enable Phase 2 later

Do not claim something is working unless it was actually verified.

The most important acceptance criterion is:

THE APPLICATION MUST BE ABLE TO RUN IN PHASE 1 WITHOUT REDIS, BULLMQ WORKER, PGVECTOR, EMBEDDINGS, RAG, OPENAI, OR ANY OTHER OPTIONAL PHASE 2 INFRASTRUCTURE.

And later:

ENABLING PHASE 2 SHOULD PRIMARILY REQUIRE INFRASTRUCTURE + ENVIRONMENT CONFIGURATION CHANGES, NOT A MAJOR BUSINESS-LOGIC REWRITE.
