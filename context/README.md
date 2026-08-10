# Scrapp agent context

Read this folder in this order:

1. `ARCHITECTURE.md` — current code and runtime contracts.
2. `PRODUCT_REQUIREMENTS.md` — product behavior, safety, privacy, and release requirements.
3. `STATUS.md` — implementation status, known gaps, and verification gates.
4. `LAUNCH_GUIDE.md` — outreach and launch strategy; useful context, but not a code source of truth.

## Source-of-truth rules

- Code and tests are authoritative for implemented behavior.
- `ARCHITECTURE.md` records the current implementation and should be updated when code contracts change.
- `PRODUCT_REQUIREMENTS.md` describes the intended product; requirements marked as future or partial are not proof that the feature exists.
- `STATUS.md` is the place for dated validation results and known gaps.
- Documents in `archive/` are historical references only. Do not use them to infer the current runtime without checking the source.

## Current one-paragraph orientation

Scrapp is a mobile-first Next.js 15 application for local disposal decisions, beginning with City of San Diego coverage. The browser sends exactly one photo, description, or barcode input to `POST /api/v2/identify`. Identification returns item/material candidates only. `POST /api/v2/decide` then applies a sourced, versioned rule for a jurisdiction and service profile; the model never chooses a bin or local policy. Special-route decisions can lead to the Locations experience, while scan history remains local to the browser.

## Repository scope

This checkout is the active frontend and rule-engine repository. The old Flask backend is not part of the current runtime. The current application code is under `src/`; automated tests are under `src/**/__tests__`, `tests/`, and `e2e/` when present. Environment names are documented in `ARCHITECTURE.md`, but secret values must never be copied into context files.
