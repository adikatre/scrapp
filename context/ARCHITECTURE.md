# Scrapp architecture

Status: current implementation guide. Verify against code before making contract changes.

## Runtime shape

Scrapp is a Next.js 15 App Router application running on Node route handlers. React client components own camera, upload, history, and interactive location UI. Server-side code owns identification, image normalization, rule evaluation, Google Places access, rate limiting, and operational checks.

```text
Browser
  -> /api/v2/identify
       -> identify handler
       -> rate limit + input validation
       -> DetectionService
            -> text: MaterialCatalog search
            -> image: normalizeImage -> configured DetectionProvider
                 -> OpenAI Responses API (default provider)
  -> /api/v2/decide
       -> DecisionEngine
       -> RuleRepository + MaterialCatalog
       -> sourced DisposalDecision or coverage unavailable
  -> locations UI
       -> server-side Google Places helpers + curated programs
```

The archived Flask `/predict` service and the old frontend proxy are not active runtime dependencies. Do not reintroduce them unless a deliberate rollback or migration design is approved.

## User-facing routes

- `/` — landing page and product explanation.
- `/cam` — camera, upload, and Describe workflow. `src/components/ScanView.tsx` calls both v2 APIs.
- `/guide` and `/guide/[material]` — material guidance.
- `/locations` — category, place search, curated destinations, and map/list UI.
- `/history` — local scan history; display-only records must not trigger identification.
- `/settings`, `/account`, `/how-it-works`, `/about`, `/privacy`, `/terms`, `/partners` — supporting product pages.
- `/api/health` — inexpensive process liveness only.
- `/api/ready` — provider configuration plus rule-catalog validation; no paid model request.
- `/api/v2/identify` — identification.
- `/api/v2/decide` — local disposal decision.
- `/api/v2/jurisdictions/resolve` and `/api/v2/materials/search` — supporting rule-system APIs.
- `/api/place-photo` — server-side Google photo-resource resolution.

## Identification contract

`POST /api/v2/identify` accepts `multipart/form-data` with exactly one non-empty primary input:

- `image`: an uploaded file; optional `context` may clarify the image.
- `text`: a description.
- `barcode`: currently returns `501 barcode_not_enabled`.

The handler applies the scan limiter, checks request size, assigns a request ID, and shapes errors with `{ error: { code, message, requestId, retryable } }`. Image uploads are normalized by `src/lib/detection/image.ts`: supported image types, a 5 MB raw limit, decoded-pixel protection, resizing, metadata removal, and server-side JPEG output.

The provider-neutral candidate contract is in `src/lib/detection/contracts.ts`. Candidates contain identity/material clues, condition, packaging clues, hazards, and confidence. They do not contain route, bin, facility, source, or legal-policy fields. This separation is a safety boundary: identification is probabilistic; disposal policy is deterministic.

`DetectionService` sorts candidates by confidence and sets `requiresChoice` when there are multiple candidates or the best confidence is below `0.78`. Text input bypasses the model and searches the material catalog. Image input uses the provider selected by `DETECTION_PROVIDER` (currently the registered `openai` provider) with a 20-second timeout. Provider failures are explicit operational errors; there is no implicit fallback provider and no fabricated success result.

## Decision contract

`POST /api/v2/decide` requires:

```json
{
  "candidate": { "id": "...", "name": "...", "material": "...", "condition": "...", "packagingClues": [], "hazards": [], "confidence": 0.9 },
  "jurisdictionId": "us-ca-san-diego",
  "serviceProfileId": "sd-city-serviced-home"
}
```

`DecisionEngine` resolves the jurisdiction and service profile, maps the candidate to a canonical material, filters active rules by effective date, ranks service-profile/municipality/region/country scope, and requires a matching sourced rule. It returns a `DisposalDecision` containing route, bin, preparation, safety, exceptions, source, effective date, and `lastChecked`. If coverage is not confirmed, the API returns `decision: null` with `coverage: "unavailable"`.

Current rule types and repository contracts live in `src/lib/rules/types.ts` and `src/lib/rules/repository.ts`. The in-memory repository is intentionally replaceable, but any database implementation must preserve the `RuleRepository` interface and validation behavior.

## Jurisdiction and rules

The active bundle is `SAN_DIEGO_BUNDLE` in `src/lib/rules/bundles.ts`, with official City of San Diego sources and postal coverage for `921xx`. Current service profiles are city-serviced home and provider-not-confirmed. Canonical materials, aliases, sources, effective dates, priorities, and rule status are defined in `src/lib/rules/san-diego.ts` and `src/lib/rules/materials.ts`.

Run catalog validation through `src/lib/rules/catalog.ts` before readiness. Validation catches duplicate jurisdiction/rule IDs, invalid postal patterns, unknown materials or sources, invalid dates, unknown service profiles, and conflicting active rules.

## Locations and curated destinations

The location layer is separate from rule evaluation. `src/lib/locationCategories.ts` maps legacy/display route labels and exact bin strings to searchable or informational categories. The exact curbside bin is authoritative when route and bin disagree. Searchable special routes use sanitized `item`, repeatable `q` (maximum four), `category`, and optional `bin` URL parameters. `src/lib/googlePlaces.ts` keeps the server-side Places key out of browser code. Curated programs under `src/lib/curated/` are merged and ranked separately from generic Google discovery; battery handling is intentionally item-specific and conservative.

## Browser persistence

`src/lib/historyStore.ts` stores up to 20 `ScanTicket` records in IndexedDB (`scrapp-local` / `scan-history`) and migrates the legacy `scrapp-scan-history` localStorage key. History is local and display-only. Do not send images, notes, exact addresses, precise coordinates, or raw barcode data to analytics or error telemetry. Existing URLs, `ScanTicket`, and legacy storage compatibility are migration locks.

## Security and operations

- OpenAI credentials and Google Places credentials are server-only; browser map configuration may use the restricted public Maps key.
- Every API response should carry `X-Request-Id`; rate-limited identify responses also carry rate-limit headers.
- Logs are structured and may contain request ID, provider/model, duration, and aggregate token usage only.
- `GET /api/health` must remain dependency-free. `GET /api/ready` may inspect configuration and the local rule catalog but must not spend model credits.
- Upstash is required for distributed production scan limiting; in-memory limiting is for local/single-process use.
- Normal tests mock model traffic. Live OpenAI checks require explicit controlled fixtures and budget approval.

Environment variable names are defined and validated in `src/env.mjs`; inspect that file before adding or renaming configuration. Never place values from `.env` in this folder.

## Safe extension points

- Add a provider by implementing `DetectionProvider`, registering one explicit factory key, and adding readiness, schema, outage, rate-limit, and timeout tests.
- Add jurisdiction coverage by adding canonical materials, a validated `JurisdictionBundle`, official sources, postal coverage, and regression fixtures. Do not add San Diego branches to shared interfaces.
- Add rules as sourced, versioned data; never add route/bin fields to provider output.
- Add destination behavior through the location category/curated-program layer, preserving sanitization and specific-item precedence.
- Keep API handlers thin and put business logic in `src/lib/api`, `src/lib/detection`, and `src/lib/rules` so contracts remain unit-testable.

## Known compatibility traps

- `src/lib/types.ts` still contains legacy `PredictionResult`/`ScanTicket` shapes used by parts of the UI and location helpers; do not casually remove them during v2 work.
- There is a checked-in `src/app/locations/page.tsx.bak`; it is not an active route.
- `barcode` is represented in the identify contract but intentionally disabled.
- A readiness failure is not a successful classification and must not be hidden by UI fallback behavior.
