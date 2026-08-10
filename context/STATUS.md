# Scrapp status and release gates

Status date: 2026-08-10. This document records the current implementation direction; rerun checks before treating any validation statement as current.

## Current implementation

- Next.js v2 identification and decision route handlers are present.
- Image security, provider error shaping, request IDs, rate limiting hooks, and readiness/catalog checks are implemented.
- The OpenAI Responses provider is the registered image provider; text descriptions use the local material catalog.
- San Diego has a validated in-memory jurisdiction bundle with official source metadata and two service profiles.
- The UI test contract covers photo/Describe identification followed by decision resolution, and history is expected to remain display-only.
- IndexedDB history preserves the legacy localStorage migration key and limits records to 20.
- Locations combine category-aware Google search with curated programs; battery routing remains intentionally specific.

## Known gaps and risks

- Only San Diego is supported. Unknown jurisdiction must remain unavailable, never silently become San Diego.
- Barcode input is not enabled and returns a deliberate `501` response.
- The OpenAI provider requires `OPENAI_API_KEY`; missing configuration must surface as an operational error.
- Upstash is needed for meaningful distributed production rate limiting.
- The rule corpus is a foundation, not proof of complete municipal coverage. New rules need source, freshness, effective dates, and regression fixtures.
- Destination discovery is not the same as verified acceptance. Generic Places results must remain clearly labeled and should say to call and confirm when appropriate.
- The current repository contains broad unrelated working-tree changes. Do not reset, clean, or overwrite them while working on Scrapp context.

## Required checks

Use the scripts in `package.json` as the starting point:

```text
bun run test
bun run typecheck
bun run lint
bun run build
bun run test:e2e
```

The e2e suite may require a running app and configured browser environment. A live OpenAI smoke test is separate from normal CI and must be explicitly controlled. Record actual dates, commands, and outcomes here only after running them; do not copy historical pass claims from archived documents.

## Release gates

- No successful result may be produced from missing configuration, malformed provider output, an outage, or unavailable local coverage.
- Photo, upload, and Describe journeys need both success and failure coverage.
- Identify output must remain policy-free; decide output must be sourced and jurisdiction/profile-specific.
- Privacy inspection must find no images, raw notes, exact addresses, precise coordinates, or raw barcode data in PostHog/Sentry payloads.
- Accessibility, responsive camera behavior, reduced motion, keyboard focus, and target-size checks must pass for the released scope.
- Rule catalog validation, typecheck, tests, and production build must pass before deployment.

## Near-term work order

1. Keep the v2 identify/decide split stable while expanding reviewed San Diego rules.
2. Add or improve explicit uncertainty, multi-candidate choice, unavailable-coverage, and provider-failure UI states.
3. Add contract fixtures for new materials, service profiles, special routes, and destination ranking.
4. Verify production environment configuration, distributed rate limiting, request-ID logging, and privacy-safe telemetry.
5. Only then expand jurisdiction, accounts, barcode, or other roadmap features from `PRODUCT_REQUIREMENTS.md`.
