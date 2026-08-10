# Scrapp product contract

## Product

Scrapp is an independent disposal decision assistant. It identifies an item from a photo, upload, or description; resolves the user's local service context; applies a versioned rule from an official or verified source; explains preparation and safety; and hands off to a verified destination when curbside disposal is inappropriate.

Scrapp begins with City of San Diego rules and must not market worldwide coverage until another jurisdiction passes the same source, accuracy, and review gates.

## Audience and operating scene

- Residents making a quick decision beside a bin, garage, or drop-off site.
- People who know the object but not its material or local program.
- Mobile users working one-handed, sometimes with weak connectivity.
- Future municipal and hauler reviewers maintaining accountable local guidance.

## Core mechanism

1. Accept exactly one primary input: photo, upload, description, or later barcode.
2. Return item, material, condition, hazard, and confidence candidates only.
3. Ask the user to choose when multiple items or meaningful uncertainty remain.
4. Resolve jurisdiction and collection service.
5. Apply the highest-precedence active rule: provider/property, municipality, regional, national, or explicitly unavailable.
6. Present bin or special route, preparation, safety, source, effective date, and last-checked date.
7. Offer locations only when a physical handoff is required.
8. Save locally and collect structured corrections without retaining cloud photos.

## Trust principles

- Identification is probabilistic; disposal policy is deterministic.
- The model never chooses a bin, facility, or legal rule.
- Confirmed decisions cite an active rule version and official or verified source.
- Unknown coverage stays unknown and never defaults to San Diego.
- Classifier fallbacks, empty output, and outages are not successful decisions.
- Verified facility acceptance outranks generic discovery; generic results say "Call to confirm."
- Community corrections enter review and never publish automatically.
- Scrapp is not an official City of San Diego service.

## Privacy and accounts

- Anonymous use remains complete.
- Browser history uses IndexedDB and preserves the legacy `scrapp-scan-history` migration source.
- Scan photos are excluded from cloud history and analytics.
- Images, raw notes, barcodes, exact addresses, and precise coordinates must never be sent to PostHog or Sentry.
- Optional accounts may sync metadata only after explicit import consent.
- The consumer product remains free during the current roadmap.

## Routes

Public: `/`, `/cam`, `/guide`, `/guide/[material]`, `/locations`, `/history`, `/settings`, `/account`, `/how-it-works`, `/about`, `/privacy`, `/terms`, and `/partners`.

Internal rule, feedback, and evaluation tools remain configuration-gated until authentication and reviewer roles are connected.

## Compatibility locks

- Preserve `/cam`, `/locations`, repeatable `q`, category/item/bin parameters, `ScanTicket`, and both legacy browser-storage keys.
- Keep the Flask `/predict` service available for one rollback window while the Next.js Responses classifier reaches parity.
- Do not remove legacy data until migration is confirmed.
- No production UI may fabricate a successful result.
- San Diego data must not be encoded as branches in the core rule interfaces.

## Route Label

Route Label is Scrapp's original visual language: photographed material specimens move through optical inspection frames and continuous route lines into large physical answer labels. Chalk off-white and charcoal canvases carry the product; teal is reserved for actions and route continuity; blue, green, and gray communicate disposal only. Sora leads concise display moments, Geist carries controls and guidance, and the camera remains intentionally dark.

Primary mobile controls target 44px, product motion uses 120/200/320ms with reduced-motion fallbacks, system theme is respected, and WCAG 2.2 AA is the acceptance standard.
