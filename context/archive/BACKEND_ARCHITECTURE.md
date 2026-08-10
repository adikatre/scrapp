# Scrapp backend architecture

Scrapp's active backend runs inside the Next.js application. The archived Flask repository is not part of the runtime.

## Request flow

1. `/api/v2/identify` validates one input mode, applies rate limits, normalizes images, and calls `DetectionService`.
2. Text descriptions search the jurisdiction-independent material catalog without invoking a model.
3. Images are delegated to the configured `DetectionProvider`. The OpenAI implementation uses the Responses API and a shared Zod output schema.
4. `/api/v2/decide` requires an item candidate, jurisdiction ID, and service-profile ID.
5. `DecisionEngine` queries `RuleRepository` and returns only active, sourced rules that apply to that service profile.

Detection providers may identify items, materials, visible conditions, packaging clues, hazards, and confidence. They must never return bins, local disposal rules, facilities, or legal claims.

## Adding a detection provider

1. Extend `DetectionProvider` and implement `readiness()` and `detect()`.
2. Return the provider-neutral candidate contract from `detection/contracts.ts`.
3. Register one factory key in `detection/registry.ts`.
4. Add configuration validation and mocked contract tests covering success, invalid output, outage, rate limit, and timeout.

Do not add implicit provider fallback. Shadow or evaluation traffic must be an explicit, separately approved path so images are not sent to multiple systems unexpectedly.

## Adding jurisdiction coverage

1. Reuse or add canonical materials in `rules/materials.ts`.
2. Create a `JurisdictionBundle` containing jurisdiction metadata, service profiles, official sources, postal coverage, and versioned rules.
3. Register the bundle in the repository composition root.
4. Add regression fixtures demonstrating different outcomes for at least one shared material.
5. Run catalog validation. Duplicate IDs, unknown references, invalid dates, conflicts, and invalid postal patterns block readiness.

The in-memory repository is deliberately replaceable. A future database repository must implement the same `RuleRepository` interface; API routes and decision logic should remain unchanged.

## Operational contracts

- `GET /api/health` is process liveness and never calls paid dependencies.
- `GET /api/ready` validates provider configuration and the complete rule catalog without making an OpenAI request.
- Every API response receives an `X-Request-Id` header.
- Logs may contain request IDs, provider/model names, status, latency, and aggregate token usage. They must not contain images, notes, barcodes, exact addresses, or precise coordinates.
- Normal CI never calls OpenAI. Live smoke verification is opt-in and must use a controlled fixture and budget.
