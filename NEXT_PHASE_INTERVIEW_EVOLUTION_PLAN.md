# Next Phase Interview Evolution Plan

Status: Track 1 completed. Track 2 planned for next phase.

## Track 1: Current Implementation Todo (Execute Now)

Track Status: Completed

Goal:
Enable AI-generated interview questions by focus area with safe fallback to static questions, and allow richer multiline focus input.

### Backend

1. Add interview-question prompt builder for structured generation from focus area context.
2. Add interview-question schema with strict JSON validation.
3. Extend AI service with interview question generation method.
4. Persist AI usage telemetry for interview question generation success and failure.
5. Update interview session creation flow to call AI first.
6. Keep fallback to deterministic static question set if AI call fails, times out, or output is invalid.
7. Keep session lifecycle APIs unchanged so frontend remains compatible.
8. Expand focus area DTO limit to support detailed multiline input.

### Frontend

1. Convert focus area field from single-line input to multiline textarea.
2. Increase max length to support richer user prompts.
3. Show character counter for input visibility.
4. Keep existing start-interview UX and session route flow unchanged.

### Validation and Reliability

1. Validate that session creation succeeds when AI is available and questions are persisted.
2. Validate that session creation still succeeds with static fallback when AI returns errors.
3. Validate that focus area normalization and required checks still behave correctly.
4. Validate that existing interview answer and results flows remain stable.

### Exit Criteria

1. Creating a session with detailed multiline focus area works.
2. Questions are AI-generated when provider is healthy.
3. Static fallback is used automatically when AI is unavailable.
4. No regressions in existing interview lifecycle endpoints.

Track 1 Completion Notes:

1. AI question generation by focus area is integrated with structured output parsing.
2. Automatic static fallback is active when AI generation fails or is unavailable.
3. Focus area accepts multiline detailed input with expanded length support.
4. Session creation response now includes question source metadata to indicate ai or fallback.

## Track 2: Phase2 Todo (Plan for Later)

Goal:
Evolve interview generation to support both focus-area-first mode and resume+job-description mode, while integrating deferred resume auto-fill behavior.

### A. Resume Auto-Fill Integration (Deferred Plan Activation)

1. Activate deferred resume auto-fill scope from OPTIONAL_RESUME_TEXT_AUTOFILL_PLAN.md.
2. Add parse-related resume fields in persistence and API contracts.
3. Implement worker parsing persistence and parse quality metadata.
4. Auto-fill resume text from parsed output only when user has not typed manual text.
5. Keep strict minimum length gating for analysis readiness.
6. Surface clear UI states for upload success versus analysis readiness.

### B. Two Interview Start Modes

1. Keep mode 1: Focus area prompt mode (current path).
2. Add mode 2: Start interview from uploaded resume and job description.
3. Add an explicit action button label, for example Start Context Interview.
4. Enable mode 2 button only when resume text and job description are both present and submitted.
5. Keep mode 1 always available so users are not blocked by uploads.

### C. AI Interview Context Expansion

1. Define prompt strategy for context interview mode using resume text + job description.
2. Preserve structured JSON output contract for generated questions.
3. Include guardrails to avoid leaking sensitive tokens or credentials in prompts.
4. Add fallback behavior for context mode when AI is unavailable.
5. Add traceable metadata to session records indicating generation mode and context source.

### D. API and Data Contract Updates

1. Extend create session API to accept generation mode and optional context references.
2. Add backend validation for mode-specific required fields.
3. Add typed frontend contracts for both create-session variants.
4. Ensure backward compatibility for existing clients.

### E. UX and Product Flow

1. Show clear mode selection between focus prompt and resume+job context.
2. Provide disabled-state guidance when context mode prerequisites are missing.
3. Display generation mode in session history and details.
4. Keep interview start path concise with minimal friction.

### F. Quality, Safety, and Observability

1. Add tests for both interview generation modes and fallback paths.
2. Add end-to-end checks for resume auto-fill plus context interview flow.
3. Add telemetry for generation mode, provider/model, failures, and fallbacks.
4. Add performance and cost controls for larger context prompts.

### Exit Criteria

1. Users can start interviews either by focus area or by resume+job context.
2. Resume auto-fill works without overwriting manual user text.
3. Context mode button enablement is reliable and transparent.
4. Both modes are stable under AI failure via fallback behavior.
5. End-to-end tests cover both modes and validation gates.
