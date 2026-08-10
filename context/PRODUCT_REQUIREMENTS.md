# Scrapp product requirements

Status: active product contract. This document is intentionally concise; the detailed historical PRD is in `archive/PRD.md` and must be checked against current code before reuse.

## Product promise

Scrapp helps a person answer “what should I do with this item here?” beginning with City of San Diego coverage. It accepts a photo, upload, or description; identifies likely item/material candidates; resolves explicit local context; applies a sourced local rule; explains preparation and safety; and offers a destination search when curbside disposal is inappropriate.

Scrapp is an independent assistant, not an official City service. It must optimize for trusted completed decisions, not scan volume, confident-sounding output, or unsupported environmental claims.

## Non-negotiable trust rules

- Identification is probabilistic. Disposal policy is deterministic.
- The model may return item/material clues, condition, packaging clues, hazards, and confidence. It must never choose a bin, route, facility, source, or legal rule.
- A decision requires an explicit jurisdiction and service profile plus an active, sourced, versioned rule.
- Unknown coverage never defaults to San Diego. Unavailable coverage, missing configuration, malformed output, empty identification, timeout, and provider outage are honest failure/uncertainty states—not successful results.
- Confirmed decisions show route/bin, preparation, safety, exceptions, source, effective date, and last-checked metadata.
- Verified facility acceptance outranks generic Places discovery. Generic results must be labeled as unverified and tell users to confirm acceptance.
- Multiple plausible items or low confidence require a user choice or clarification; the UI must not silently collapse a meaningful ambiguity.

## Core journey

1. User chooses Photo, Upload, or Describe. Exactly one primary input is submitted.
2. `POST /api/v2/identify` returns candidate identities only.
3. The user selects a candidate when required.
4. `POST /api/v2/decide` resolves local policy for jurisdiction/profile context.
5. The result presents the action, preparation, safety, provenance, and limitations.
6. Special-route results may open `/locations`; curbside results may explain the correct home bin without implying a facility is required.
7. History is local and display-only. Viewing history must never call identification again.

## Initial scope

- Initial complete jurisdiction: City of San Diego, California.
- Current supported input: image and text. Barcode is represented in the contract but deliberately disabled until a real lookup path and failure UX exist.
- Current local profiles include city-serviced home and provider-not-confirmed.
- Anonymous use is complete; accounts and metadata-only sync are future capabilities.
- Route Label visual language, system theme support, dark camera workspace, semantic bin colors, Sora/Geist typography, responsive one-handed controls, reduced motion, and WCAG 2.2 AA are design acceptance requirements.

## Privacy and safety

- Process photos transiently; do not create a cloud photo history by default.
- Keep images, raw notes, barcodes, exact addresses, and precise coordinates out of PostHog, Sentry, and structured logs.
- Do not expose OpenAI or server-side Google Places credentials to browser code.
- Preserve local history controls, deletion, export/migration decisions, and the legacy `scrapp-scan-history` compatibility key while migrating storage.
- Never fabricate a successful backend response to make the UI look complete.

## Compatibility locks

Preserve `/cam`, `/locations`, `/guide`, repeatable `q` location parameters, `ScanTicket`, the v2 identify/decide schemas, request IDs, and browser-history migration behavior unless a documented migration and rollback plan exists. Legacy `PredictionResult` fields may still be used by UI/location helpers; the archived Flask `/predict` service is not an active runtime dependency.

## Roadmap direction

1. Stabilize v2 identify/decide, source-backed San Diego rules, uncertainty/failure UX, privacy-safe telemetry, and release checks.
2. Expand reviewed rule coverage, service profiles, provenance workflows, and verified destinations.
3. Add optional accounts, metadata-only sync, multilingual content, and correction operations without weakening anonymous use.
4. Add a second jurisdiction only after boundary, source, service-profile, and regression gates prove portability.
5. Consider barcode and other advanced features only with an explicit data source, cost cap, failure path, and tested user value.

## Definition of done

A product change is done when its success, empty, loading, offline, permission, timeout, invalid-input, and service-failure states are handled where relevant; accessibility and responsive behavior are checked; privacy payloads are reviewed; unit/contract/browser tests and build gates appropriate to the change pass; source-backed content has freshness ownership; and user-facing plus rollback documentation is updated.
