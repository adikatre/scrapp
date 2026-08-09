# Scrapp product contract

## What Scrapp does

Scrapp is an independent disposal assistant for San Diego. A person photographs or uploads an item, receives a plain-language disposal route and exact curbside bin when applicable, and can continue to nearby drop-off options when the route needs a physical destination.

## Primary users

- San Diego residents who need a fast answer at the moment of disposal.
- People holding an unfamiliar item who may not know the material or local rule.
- Mobile users working one-handed near a bin, garage, or drop-off site.

## Core journeys

1. Scan or upload an item.
2. Review the image and optionally add a note.
3. Analyze the item using the existing prediction contract.
4. Show the exact bin or special route as the dominant answer.
5. Offer nearby locations only when that route is searchable.
6. Preserve completed scans in local history.

## Compatibility requirements

- Keep the `/`, `/cam`, and `/locations` routes and existing navigation destinations.
- Keep classifier and Places request/response contracts unchanged.
- Keep location query parameters, including repeatable `q` values, compatible.
- Keep `ScanTicket` data and the `scrapp-scan-history` localStorage key compatible, including the 20-item limit.
- Never fabricate a successful production classification. Marketing demos may use clearly labeled static fixtures.
- Do not change backend behavior as part of this redesign.

## Product voice

Clear, calm, local, and practical. Lead with the answer, use short imperative guidance, and explain recovery steps without blame. Scrapp must state that it is an independent assistant rather than an official City of San Diego service.

## Civic Optics design direction

Scrapp combines camera precision with San Diego civic wayfinding. The system uses cool off-white and charcoal canvases, teal for actions, and reserves blue, green, and gray for disposal meaning. Sora carries concise marketing headlines; Geist carries controls and product guidance. Interfaces should feel spatial, direct, and trustworthy rather than botanical, futuristic, or ornamental.

### Interaction principles

- Mobile tasks come before maps and supporting detail.
- Primary touch controls target at least 44px.
- Every state has a clear next action and a usable fallback.
- Motion clarifies continuity and never hides initial content.
- System light and dark preferences are respected; the camera workspace stays intentionally dark.
- WCAG 2.2 AA is the acceptance standard.

### Visual constraints

- Panels use 18-20px radii; controls use 10-12px radii.
- Pills are reserved for navigation and compact selectors.
- Motion uses 120ms, 200ms, and 320ms durations with reduced-motion fallbacks.
- Avoid generic nature-video marketing, decorative statistics, repeated equal card grids, neon AI effects, and excessive floating surfaces.

## Source of truth

Local disposal guidance must be traceable to the City of San Diego Environmental Services recycling resources. Scrapp must not imply City endorsement or invent environmental statistics, acceptance rules, or program claims.
