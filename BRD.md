# AI Interview Coach — Full-Stack AI Monorepo

Build a production-quality full-stack AI Interview Coach application as a TypeScript monorepo.

The goal is to create a portfolio-quality project that demonstrates modern backend engineering, AI integration, asynchronous processing, RAG/vector search, authentication, testing, Docker, CI/CD, and Cloudflare deployment.

Do not over-engineer the application. Prefer simple, maintainable architecture and implement the foundation correctly so advanced AI capabilities can be added incrementally.

---

## 1. Core Product

Build an AI-powered interview preparation platform.

The initial product should support:

1. User registration/login.
2. Resume upload.
3. Job description input.
4. AI-powered resume/job-description analysis.
5. Skill matching.
6. Missing skill identification.
7. Resume strengths/weaknesses.
8. Personalized interview question generation.
9. Interview sessions.
10. User answers to interview questions.
11. AI evaluation of answers.
12. Structured feedback.
13. Follow-up questions.
14. Interview history.

The architecture must be designed so that RAG/vector search can be added cleanly.

Do not attempt to implement every advanced AI feature in the first iteration. Build a strong foundation and MVP first.

---

# 2. Monorepo

Use pnpm workspaces.

Use this structure:

```text
ai-interview-coach/
│
├── apps/
│   ├── frontend/
│   ├── backend/
│   └── worker/
│
├── packages/
│   └── shared-types/
│
├── docker/
│
├── .github/
│   └── workflows/
│
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── turbo.json
├── README.md
└── .gitignore
```

Use:

- Node.js 22
- pnpm 9.12.0
- TypeScript
- strict TypeScript configuration
- ES2022
- Node16 module resolution

Use `apps` only for deployable applications.

Use `packages` for reusable libraries/shared code.

---

# 3. Frontend

Use:

- Next.js
- React
- TypeScript
- Zod
- ESLint
- Jest

Use the current stable versions compatible with the project rather than blindly copying old versions from an existing project.

Do not use Next.js API routes for business/backend APIs.

The frontend must communicate with the NestJS backend through HTTP APIs.

Required initial routes:

```text
/
 /login
 /register
 /dashboard
 /interview-coach
 /resume
 /interviews
 /interviews/[id]
```

The application should eventually be accessible at:

```text
https://lab.prashantbhalekar.dev/interview-coach
```

The frontend must therefore be designed so that `/interview-coach` works correctly when deployed behind Cloudflare.

Use clean reusable components.

Keep frontend API communication in a dedicated API/client layer rather than scattering fetch calls throughout components.

---

# 4. Backend

Use:

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication
- Passport
- class-validator/class-transformer or Zod where appropriate

Structure the backend using feature modules.

Suggested structure:

```text
apps/backend/src/

├── main.ts
├── app.module.ts
│
├── auth/
├── users/
├── resumes/
├── jobs/
├── interviews/
├── questions/
├── answers/
├── evaluations/
│
├── ai/
│   ├── ai.module.ts
│   ├── ai.service.ts
│   ├── interfaces/
│   ├── providers/
│   ├── prompts/
│   └── schemas/
│
├── embeddings/
├── vector-search/
├── storage/
├── queue/
├── health/
│
└── common/
    ├── guards/
    ├── decorators/
    ├── filters/
    ├── interceptors/
    └── pipes/
```

Keep business logic out of controllers.

Controllers should primarily handle:

```text
HTTP request
↓
validation
↓
service
↓
response
```

---

# 5. AI Architecture

Use Gemini as the initial/primary AI provider.

Do NOT tightly couple the application directly to Gemini.

Create an AI provider abstraction.

For example:

```typescript
interface AIProvider {
  generateText(request: AIRequest): Promise<string>;

  generateStructured<T>(request: AIRequest, schema: unknown): Promise<T>;
}
```

Create:

```text
ai/
├── providers/
│   ├── gemini.provider.ts
│   ├── openai.provider.ts
│   └── ollama.provider.ts
```

Initially implement only:

```text
GeminiProvider
```

The other providers can initially be interfaces/placeholders if implementation would unnecessarily increase scope.

The application should be able to select the provider through configuration/environment variables.

Example:

```text
AI_PROVIDER=gemini
```

Do not add LangChain or LangGraph initially.

Use the underlying provider SDK/API directly so that the AI architecture remains understandable.

---

# 6. Structured AI Output

AI responses must not be treated as arbitrary strings when the application needs structured information.

For example, resume analysis should return a structure similar to:

```json
{
  "overallScore": 82,
  "summary": "...",
  "matchingSkills": ["Node.js", "NestJS", "PostgreSQL"],
  "missingSkills": ["Kubernetes", "Kafka"],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."]
}
```

Validate AI responses against schemas before using them in business logic.

Use Zod or another reliable schema validation mechanism.

Implement reasonable error handling for malformed AI responses.

---

# 7. Prompt Management

Do not hardcode large prompts directly inside controllers/services.

Create a prompt layer:

```text
ai/prompts/

├── resume-analysis.prompt.ts
├── question-generation.prompt.ts
├── answer-evaluation.prompt.ts
└── follow-up-question.prompt.ts
```

Keep prompts versionable and easy to modify.

Prompts should clearly define:

- system instructions
- expected output
- constraints
- context
- user input

---

# 8. Resume Processing

Users should be able to upload a resume.

Supported initial format:

```text
PDF
```

The workflow should be asynchronous where appropriate.

Example:

```text
User
 ↓
POST /resumes
 ↓
Backend
 ↓
Store file
 ↓
Create resume record
 ↓
Queue processing job
 ↓
Return processing status
```

Do not block the HTTP request while performing expensive AI/document processing.

---

# 9. Storage

Use object storage for uploaded files.

Prefer:

```text
Cloudflare R2
```

because the project will primarily use Cloudflare.

Create a storage abstraction:

```typescript
interface StorageProvider {
  upload(...): Promise<...>;
  delete(...): Promise<...>;
  getSignedUrl(...): Promise<...>;
}
```

Initially implement an R2 provider.

Do not store PDF binary content directly in PostgreSQL.

Store metadata in PostgreSQL.

---

# 10. PostgreSQL

Use:

```text
PostgreSQL
```

with:

```text
Prisma ORM
```

Use Prisma migrations.

Use a proper seed script for development data.

The database should initially contain entities similar to:

```text
User
Resume
JobDescription
ResumeAnalysis
Interview
InterviewQuestion
InterviewAnswer
AnswerEvaluation
AIRequest / AIUsage
Document
DocumentChunk
```

Do not create unnecessary tables before they are needed.

Use appropriate indexes and foreign keys.

---

# 11. pgvector / RAG Preparation

Use PostgreSQL + pgvector instead of introducing a separate vector database.

Design the schema so documents/chunks can eventually contain embeddings.

Conceptual flow:

```text
Resume
 ↓
Text extraction
 ↓
Chunking
 ↓
Embedding
 ↓
PostgreSQL + pgvector
```

Later:

```text
User question
 ↓
Embedding
 ↓
Vector similarity search
 ↓
Relevant resume/project context
 ↓
Gemini
 ↓
Answer
```

Do not implement a complicated RAG framework in the initial MVP.

Create clean modules/interfaces so RAG can be added incrementally.

---

# 12. Redis + BullMQ

Use:

```text
Redis 7
BullMQ
@nestjs/bullmq
```

Create asynchronous jobs for expensive operations such as:

```text
resume processing
resume analysis
embedding generation
interview analysis
```

The backend should enqueue jobs.

The worker application should consume them.

Example:

```text
Backend
   ↓
BullMQ
   ↓
Redis
   ↓
Worker
   ↓
AI processing
   ↓
PostgreSQL
```

---

# 13. Worker Application

Create:

```text
apps/worker
```

using NestJS.

It should be a long-running queue consumer.

Example:

```text
worker/
├── src/
│   ├── main.ts
│   ├── worker.module.ts
│   ├── processors/
│   │   ├── resume.processor.ts
│   │   ├── analysis.processor.ts
│   │   └── interview.processor.ts
│   └── services/
```

Important:

Do NOT assume this worker should run as a Cloudflare Worker.

This application uses BullMQ/Redis and should initially be designed as a conventional long-running Node.js process/container.

It can be deployed using Docker to a suitable container runtime.

---

# 14. API Design

Use REST APIs.

Initial endpoints should include:

```text
POST   /auth/register
POST   /auth/login

GET    /users/me

POST   /resumes
GET    /resumes
GET    /resumes/:id
DELETE /resumes/:id

POST   /jobs
GET    /jobs
GET    /jobs/:id

POST   /resume-analysis
GET    /resume-analysis/:id

POST   /interviews
GET    /interviews
GET    /interviews/:id

POST   /interviews/:id/start
POST   /interviews/:id/answers
GET    /interviews/:id/results

GET    /health
```

Keep API versioning in mind.

Use:

```text
/api/v1/...
```

if appropriate.

---

# 15. Authentication

Implement:

```text
JWT access token
```

with secure password hashing.

Use:

```text
bcrypt/bcryptjs
passport
passport-jwt
```

Protect private endpoints using NestJS guards.

Do not store plaintext passwords.

Do not expose secrets to the frontend.

---

# 16. AI Usage / Cost Tracking

Design for AI usage tracking.

Store information such as:

```text
provider
model
operation
inputTokens
outputTokens
latency
status
error
createdAt
```

This will allow the project to later show:

```text
AI usage
AI cost
AI latency
```

and will provide a useful production engineering story.

---

# 17. Rate Limiting

AI APIs can become expensive.

Design rate limiting around expensive endpoints.

For example:

```text
resume analysis
question generation
answer evaluation
```

Do not allow unlimited anonymous AI requests.

Use Redis where appropriate.

---

# 18. Docker

Use Docker for local development and the long-running worker.

Use:

```text
node:22-alpine
```

where appropriate.

Create:

```text
compose.infra.yml
compose.backend.yml
compose.frontend.yml
```

or simplify this if a cleaner Compose structure is preferable.

Infrastructure should include:

```text
PostgreSQL 16
Redis 7
```

Local ports:

```text
PostgreSQL: 5433 → 5432
Redis:       6380 → 6379
```

Avoid exposing infrastructure ports unnecessarily in production.

---

# 19. Local Development

The project should support:

```bash
pnpm install
```

and clear commands such as:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Provide app-specific commands where useful:

```bash
pnpm --filter frontend dev
pnpm --filter backend dev
pnpm --filter worker dev
```

Document environment variables in:

```text
.env.example
```

Never commit real secrets.

---

# 20. Environment Variables

Separate configuration by application.

Example backend:

```text
DATABASE_URL=
REDIS_URL=

JWT_SECRET=

AI_PROVIDER=gemini
GEMINI_API_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=

FRONTEND_URL=
```

Frontend should only contain variables that are explicitly safe to expose.

Never expose:

```text
GEMINI_API_KEY
DATABASE_URL
JWT_SECRET
R2_SECRET_ACCESS_KEY
```

to the browser.

---

# 21. Cloudflare Deployment

The target architecture is:

```text
Frontend:

apps/frontend
    ↓
Next.js
    ↓
OpenNext
    ↓
Cloudflare Worker
    ↓
lab.prashantbhalekar.dev
```

The application must support:

```text
https://lab.prashantbhalekar.dev/interview-coach
```

The `/interview-coach` path should be handled by the Next.js application routing.

Do NOT use Cloudflare Pages for the new project.

Use Cloudflare Workers for the frontend deployment.

For the backend:

```text
apps/backend
    ↓
NestJS
    ↓
Cloudflare Worker
    ↓
api.lab.prashantbhalekar.dev
```

However, before finalizing the backend deployment, verify that the NestJS dependencies actually used by this application are compatible with the Cloudflare Workers runtime.

Do not force unsupported Node.js functionality into Workers.

If a dependency is incompatible, preserve the NestJS API architecture but use a conventional container runtime for the API.

For the queue worker:

```text
apps/worker
    ↓
NestJS + BullMQ
    ↓
Docker
    ↓
Long-running container runtime
```

Do not deploy the BullMQ consumer as a Cloudflare Worker.

Do not introduce Nginx unless the selected container deployment architecture actually requires it.

---

# 22. Domain Architecture

Existing portfolio:

```text
https://prashantbhalekar.dev
```

Existing architecture:

```text
Cloudflare
    ↓
Cloudflare Worker
    ↓
Lovable-generated SSR application
```

Do not modify this existing application.

New AI project:

```text
https://lab.prashantbhalekar.dev/interview-coach
```

Frontend:

```text
lab.prashantbhalekar.dev
```

API:

```text
api.lab.prashantbhalekar.dev
```

Keep the AI project completely independent from the existing portfolio repository.

---

# 23. CI/CD

Use GitHub Actions.

Required workflows:

```text
ci.yml
deploy-frontend.yml
deploy-backend.yml
deploy-worker.yml
```

Optionally:

```text
deploy-full.yml
```

CI should perform:

```text
install dependencies
lint
typecheck
unit tests
backend e2e tests
build
```

Use:

```text
actions/checkout@v4
actions/setup-node@v4
pnpm/action-setup@v4
```

Use Node 22.

Frontend deployment should use the appropriate Cloudflare deployment mechanism, such as Wrangler/OpenNext.

Backend deployment should use Wrangler if Worker-compatible.

Worker deployment should use the selected container deployment mechanism rather than pretending it is a Cloudflare Worker.

---

# 24. Testing

Use Jest.

Frontend:

```text
unit/component tests
```

Backend:

```text
unit tests
integration tests
e2e tests
```

Worker:

```text
processor tests
queue-related integration tests
```

Use real PostgreSQL and Redis services for backend e2e tests where appropriate.

Do not mock everything.

---

# 25. Shared Types

Create:

```text
packages/shared-types
```

for types that genuinely need to be shared between frontend/backend.

Examples:

```text
ResumeAnalysisResponse
InterviewQuestion
InterviewEvaluation
API response contracts
```

Do not put business logic in shared-types.

Do not blindly share Prisma-generated types with the frontend.

Prefer explicit DTO/contract types.

---

# 26. Code Quality

Use:

```text
ESLint
Prettier
TypeScript strict mode
Husky
lint-staged
```

Use pre-commit hooks for:

```text
lint
format
typecheck where practical
```

Avoid excessive abstractions.

Follow SOLID principles where useful, but favor readability over theoretical architecture.

---

# 27. Security

Implement basic production security:

- validation of all external input
- authentication/authorization
- password hashing
- rate limiting
- CORS configuration
- secure HTTP headers where applicable
- file type/size validation
- AI API key protection
- environment-based secrets
- SQL injection protection through Prisma
- avoid logging sensitive resume contents
- avoid logging passwords/tokens
- basic prompt injection awareness for resume/document content

Never trust content extracted from uploaded documents.

Treat resume/job-description text as untrusted input.

---

# 28. Initial MVP Scope

Do NOT implement every feature immediately.

The first working milestone should be:

```text
1. Register/login
2. Upload resume PDF
3. Enter job description
4. Process resume
5. Send resume + job description to Gemini
6. Return structured analysis
7. Display:
   - match score
   - matching skills
   - missing skills
   - strengths
   - weaknesses
   - recommendations
```

Then implement:

```text
8. Interview creation
9. Question generation
10. Answer submission
11. AI answer evaluation
12. Follow-up questions
13. Interview history
```

Then:

```text
14. Embeddings
15. pgvector
16. RAG
```

Then:

```text
17. Redis caching
18. AI usage tracking
19. rate limiting
20. provider switching
```

---

# 29. Important architectural rule

Do not build a generic ChatGPT clone.

The application should be purpose-built around:

```text
Resume
+
Job Description
+
Candidate Experience
+
Interview
+
AI Evaluation
```

The AI should provide structured business functionality rather than simply returning conversational text.

---

# 30. Documentation

Create a high-quality README containing:

```text
Project overview
Architecture
Tech stack
Monorepo structure
Local setup
Environment variables
Database setup
Running migrations
Running seeds
Running tests
Docker setup
AI architecture
Queue architecture
RAG architecture
Deployment architecture
Cloudflare configuration
CI/CD
Security considerations
```

Also include an architecture diagram.

Document important technical decisions and trade-offs.

---

# 31. Do not do these things

Do NOT:

- use MongoDB
- introduce a second database without a real reason
- introduce Kafka
- introduce Kubernetes
- introduce LangChain/LangGraph initially
- introduce a separate vector database
- use Next.js API routes for backend business logic
- put Gemini API keys in the frontend
- store uploaded PDFs in PostgreSQL
- make expensive AI operations synchronous unnecessarily
- deploy the BullMQ consumer as a Cloudflare Worker
- use Cloudflare Pages for the new project
- add Nginx unless required by the selected container runtime
- over-engineer the first MVP

---

# 32. Expected Result

Generate a clean, runnable monorepo with:

```text
apps/
├── frontend/
├── backend/
└── worker/

packages/
└── shared-types/
```

It must:

1. Install successfully with pnpm.
2. Start locally.
3. Start PostgreSQL and Redis through Docker Compose.
4. Run Prisma migrations.
5. Run Prisma seed.
6. Start Next.js frontend.
7. Start NestJS backend.
8. Start NestJS BullMQ worker.
9. Expose a backend `/health` endpoint.
10. Provide authentication foundation.
11. Provide resume upload foundation.
12. Provide Gemini integration abstraction.
13. Provide structured AI response schemas.
14. Provide queue infrastructure.
15. Have working tests.
16. Have `.env.example`.
17. Have GitHub Actions CI.
18. Have deployment configuration prepared for Cloudflare Workers.
19. Have clear documentation.

Before implementing, inspect the entire requested architecture and produce a concise implementation plan with:

- repository structure
- dependency choices
- database schema
- API modules
- queue architecture
- AI architecture
- deployment architecture

Then implement the project in logical phases.

Do not skip foundational configuration.

Do not add technologies that are not explicitly justified by a requirement.

## UI / UX Design

The AI Interview Coach should visually match the existing personal portfolio at:

https://prashantbhalekar.dev or in my-portfolio project

Use the portfolio as the visual design reference.

The new application should feel like a natural extension of the portfolio rather than a completely unrelated product.

Maintain consistency in:

- typography
- spacing
- border radius
- cards
- buttons
- color palette
- background treatment
- navigation style
- animations/transitions
- dark/light theme behavior if present
- overall minimal developer-focused aesthetic

However, do NOT copy the portfolio implementation or couple the two repositories.

Recreate the design system independently in the AI project.

The application should feel more like a polished SaaS/product experience than a simple admin dashboard.

Primary UX:

Landing / entry:

- concise product introduction
- "Start Interview" CTA
- "Analyze Resume" CTA
- clean hero section

Interview Coach:

- resume/job description context
- interview configuration
- question area
- answer input
- submit/next question
- progress indicator
- AI feedback

Dashboard:

- resume status
- interview history
- recent analysis
- skill insights
- quick actions

Resume Analysis:

- overall match score
- strengths
- missing skills
- recommendations
- categorized results using cards/badges/progress indicators

Interview Results:

- overall score
- question-by-question evaluation
- strengths
- weaknesses
- improvement suggestions

Keep the initial UI polished but do not spend excessive effort on visual complexity before the core functionality works.

Use reusable components and a consistent design system.

The `/interview-coach` page should be the primary showcase page because this URL will be publicly accessible from the portfolio.

## Query Answers

1. UI:
   Do not defer the UI to a later phase. Build a polished MVP UI from the beginning. Use my existing personal portfolio at https://prashantbhalekar.dev as the visual/design reference and maintain the same visual language, typography, spacing, colors, components, and overall aesthetic. Recreate the design system independently; do not couple the repositories. The UI should feel like a polished product rather than a generic admin dashboard.

2. Backend deployment:
   Use Cloudflare Worker as the preferred backend deployment target. If NestJS/dependencies prove incompatible with Cloudflare Workers, use a Dockerized NestJS backend deployed to AWS ECS/Fargate as the default fallback. Keep the backend containerized and deployment-independent so this change does not require architectural changes. Do not implement full ECS infrastructure yet unless required.

3. API versioning:
   Yes. Prefix all REST backend endpoints with /api/v1 from day one. For example:
   /api/v1/auth/login
   /api/v1/resumes
   /api/v1/interviews
   /api/v1/health

4. Frontend routing:
   Do NOT redirect / to /interview-coach. Keep / as an Engineering Lab landing page so additional projects can be added later. The Interview Coach should live at /interview-coach and future Interview Coach routes can live under /interview-coach/\*.
