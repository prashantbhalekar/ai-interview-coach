# Canonical Routing Contract (Phase 0)

Purpose:
Define non-ambiguous frontend route behavior for all environments.

## Route Decisions

1. Root route remains a standalone Engineering Lab landing page.
2. Interview Coach root route is /interview-coach.
3. All Interview Coach product pages are nested under /interview-coach/\*.
4. No redirect from / to /interview-coach.
5. Future products can be added as additional top-level paths.

## Initial Frontend Route Map

1. / -> Engineering Lab landing
2. /interview-coach -> Interview Coach landing/dashboard
3. /interview-coach/login -> authentication login
4. /interview-coach/register -> authentication registration
5. /interview-coach/resume -> resume upload and context
6. /interview-coach/analysis -> resume analysis view
7. /interview-coach/interview/[id] -> interview session runtime
8. /interview-coach/results/[id] -> interview results view

## Legacy Route Alias Policy

1. If legacy route names are introduced during implementation (for example, /interview-coach/interviews/[id]), they must be treated as temporary aliases only.
2. Canonical route names listed above remain the source of truth for navigation and documentation.
3. Alias routes should be removed once all internal links and bookmarks are migrated.

## Route Architecture Rules

1. Business APIs must not be implemented in frontend route handlers.
2. Frontend calls backend HTTP APIs through a dedicated client layer.
3. Route generation should use centralized route helpers to avoid drift.
4. Navigation and links must be based on canonical route constants.

## Cloudflare Compatibility Rules

1. Frontend deployment must preserve /interview-coach path behavior.
2. Asset and router behavior should be validated in deployed environment.
3. No route assumptions that require root-only hosting.

## Acceptance Checks

1. Manual route walk-through for all initial routes.
2. Automated navigation tests for primary route transitions.
3. Deployment preview confirms /interview-coach deep links are stable.
