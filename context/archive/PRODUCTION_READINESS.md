# Production readiness

Status recorded 2026-08-10 for the backend-foundation migration.

## Security

- ✅ AI identification is rate limited before parsing or inference: `src/lib/api/identify-handler.ts`.
- ✅ Uploads enforce type, signature, 5 MB raw size, 25 MP decoded size, 1600 px normalization, metadata stripping, and server-side re-encoding: `src/lib/detection/image.ts`.
- ✅ OpenAI credentials remain server-only and provider configuration is validated: `src/env.mjs`.
- ✅ Detection output cannot contain disposal policy because the shared provider schema has no route, bin, source, or facility fields.
- ✅ Structured diagnostics exclude images and raw user context.
- ⚠️ Upstash is required for distributed production rate limiting; the in-memory limiter is appropriate only for local or single-process development.

## Infrastructure and contracts

- ✅ Identification and decisions run in Next.js Route Handlers; active Flask rollback configuration has been removed.
- ✅ `/api/health` provides inexpensive liveness.
- ✅ `/api/ready` validates the active provider and rule catalog without paid network traffic.
- ✅ API request and error contracts use shared Zod schemas and request IDs.
- ✅ The legacy Flask suite passed 34 tests in an isolated environment before archival.
- ⚠️ Hosting-level rollback remains the deployment platform's responsibility; the archived Flask service is not a rollback target.

## Reliability and observability

- ✅ Provider failures distinguish invalid output, rate limiting, configuration failure, upstream failure, and timeout.
- ✅ Inference is never retried automatically.
- ✅ Structured completion logs contain provider/model, request ID, latency, and aggregate usage only.
- ⚠️ Centralized error ingestion is intentionally deferred; server logs must be retained by the deployment platform.

## Tests and release gates

- ✅ Provider, image-security, repository, second-jurisdiction, rules, and Route Handler contract tests are present.
- ✅ Saved history images are display-only and cannot trigger another identification request.
- ✅ Unit tests mock model traffic; normal CI does not require or spend an OpenAI key.
- Required gates: `bun run test`, `bunx biome check src e2e`, `bun run typecheck`, `bun run build`, and `bun run test:e2e`.
- Manual pre-release check: verify `/api/health`, `/api/ready`, one controlled live image, one text description, unsupported coverage, and provider failure recovery.
