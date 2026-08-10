# Production readiness

Status: implementation complete for the local-first trust foundation; deployment and configured cloud services remain external release work.

## Implemented

- Next.js Responses API classifier with structured, policy-free identification output.
- Deterministic San Diego rule engine with version, effective date, service profile, and official source.
- V2 identify, decide, material search, and jurisdiction-resolution endpoints.
- Describe mode, multi-item choice, on-device image compression, explicit timeouts, and recovery states.
- IndexedDB history with one-time legacy localStorage import and read-only saved-image viewing.
- Guide, material, History, Settings, Account status, About, How It Works, Privacy, Terms, and Partners routes.
- Verified-versus-discovery location labels, photo and Places rate limiting, random device identity, CSP, permissions policy, and allow-listed analytics events.
- Supabase-ready schema, RLS policies, and a minimal San Diego seed. No live database is implied.
- Bun, TypeScript, unit, production-build, Playwright, axe, and backend Python CI gates.
- Flask rollback health, request IDs, raw upload ceiling, image signature, and decompressed-pixel validation.

## Release blockers outside this checkout

- Production deployment must be triggered with valid Vercel credentials and then compared against local screenshots.
- `OPENAI_API_KEY` must be configured for photo identification.
- Google Maps and Places keys are optional for the Guide but required for live discovery.
- Upstash is required for distributed rate limits; without it, limits are instance-local.
- Supabase Auth/data sync and Sentry remain deliberately inactive until project credentials, retention, and access policies are approved.
- San Diego source records need an editor review before database publication beyond the included seed subset.
- A second jurisdiction must pass source and regression review before any global coverage claim.

## Rollback

The legacy Flask `/predict` service remains available but is no longer the default web classifier. Keep it deployable for one release window, compare contract, latency, failure, and cost telemetry, then archive it only after parity gates pass.

## Data boundaries

Never log or send scan images, raw notes, barcode values, exact addresses, or precise coordinates to analytics or error reporting. Cloud history must contain decision metadata only.
