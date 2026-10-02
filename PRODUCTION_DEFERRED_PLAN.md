# Production Deferred Plan

Date: 2026-10-02
Status: Deferred intentionally for initial limited rollout

## Scope of This Plan

These items are intentionally postponed because initial traffic is expected to be low. They should be completed before opening to broader public usage.

## Deferred Security and Reliability Work

1. Cookie-based authentication migration

- Move access token handling from browser localStorage to secure cookie-based flow.
- Add httpOnly, Secure, SameSite cookie settings.
- Add refresh token rotation and server-side revocation strategy.
- Update frontend auth state management to rely on server session checks rather than local token reads.

2. Distributed Redis-backed rate limiting

- Replace in-memory AI rate limiter with Redis-backed limiter to work across multiple backend instances.
- Add separate quotas for authenticated user and IP fallback.
- Include Retry-After response metadata for 429 handling.

3. Durable file storage migration

- Move resume storage from local filesystem to object storage (R2/S3 compatible).
- Add lifecycle policy and backup/retention checks for uploaded files.

4. Test hardening

- Add non-placeholder tests for frontend auth and worker queue flows.
- Remove or tighten passWithNoTests usage for release branches.

5. Observability and alerting

- Add structured logs with request/job correlation IDs.
- Add alerts for readiness failures, queue failures, AI provider error spikes, and latency regressions.

## Proposed Execution Order

1. Cookie-based auth migration
2. Redis rate limiter migration
3. Durable storage migration
4. Test coverage hardening
5. Observability and alerting enhancements

## Exit Criteria Before Wider Public Launch

1. Auth token is no longer stored in localStorage.
2. Rate limiting is distributed and validated under multi-instance test.
3. Production storage is durable object storage with tested restore path.
4. Critical user journeys are covered by repeatable automated tests.
5. Alerting is active with tested incident notifications.

## Notes

- This deferral is acceptable only for controlled, limited-user launch.
- Reassess this plan before any scale-up, marketing launch, or shared public access.
