# Optional Resume Text + Auto-Fill From Parsed PDF (Planned)

Status: Deferred for later implementation.

## Goal

Allow resume text to be optional at upload time, and when it is not provided manually, auto-fill it from parsed PDF output. Keep analysis quality protected by requiring adequate text length before running analysis.

## Scope

1. Resume text optional in upload form.
2. Worker parses uploaded PDF text and stores parsed output.
3. Frontend auto-fills resume text from parsed output when user has not typed text.
4. Analysis remains gated with minimum lengths.
5. Clear UX for file-uploaded vs analysis-ready states.

## Proposed Implementation Plan

### 1. Data Model and API Contracts

1. Extend resume persistence with parse-related fields, for example:

- parsedText
- parsedTextChars
- parseStatus
- parseFailureReason
- parsedAt

2. Add Prisma migration.
3. Expose parse metadata in resume status API response.
4. Update frontend contracts to include parse metadata.

### 2. Worker PDF Parsing

1. Implement PDF text extraction in resume worker job.
2. Read uploaded file by storage key.
3. Normalize extracted text and persist to resume record.
4. Persist parse quality metadata.

### 3. Frontend Auto-Fill Behavior

1. Keep manual resume text input optional.
2. After upload status polling returns terminal state, fetch parse fields.
3. Auto-fill resume text only when user input is empty (or untouched).
4. Persist auto-filled text into local context used by analysis page.

### 4. Analysis Gating and Validation Consistency

1. Keep readiness rule:

- resumeText length >= 120
- jobDescription length >= 80

2. Add backend minimum validators to mirror frontend checks.
3. Improve messaging to distinguish:

- File upload success
- Analysis readiness

### 5. Edge Case: Parsed Text Less Than 120 Characters

Recommended behavior:

1. Store and show parsed text anyway.
2. Mark parse quality as too short / low confidence.
3. Block analysis until user enriches text to >= 120.
4. Show targeted reason and action guidance.

Reason:

- This avoids silent failures.
- It keeps AI analysis quality stable.
- It still helps users by pre-filling whatever could be extracted.

## Validation Checklist (When Implemented)

1. Happy path: no manual text, parser returns >=120, analysis works.
2. Short parse path: parser returns <120, user sees warning and cannot run analysis until edited.
3. Manual priority path: user-provided text is not overwritten by auto-fill.
4. Contract path: backend rejects under-threshold analysis payload with clear message.

## Notes

- OCR for scanned/image-only PDFs can be a later enhancement.
- Current temporary project mode keeps resume text mandatory to unblock testing of other modules.
