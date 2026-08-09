# Scrapp Civic Optics design system

## Direction

**Civic Optics** combines camera precision with San Diego civic wayfinding. It should feel calm, local, and engineered for a person making a disposal decision in the moment. The interface is not a nature campaign and not a futuristic AI showcase.

## Reference locks

- Camera-first structure: Google Lens.
- Short task journey and local discovery: Too Good To Go.
- Localized education: Recycle Coach.
- Disposal claims: City of San Diego Environmental Services.
- Accessibility: WCAG 2.2 AA and Google Maps accessible marker guidance.

These references guide structure and clarity. Scrapp keeps its own typography, color, product voice, and interaction model.

## Visual language

- Canvas: cool off-white in light mode and deep charcoal-teal in dark mode.
- Action: teal only. It must remain distinguishable from disposal semantics.
- Disposal: blue means recycling, green means organics, gray means trash. These colors are not decorative accents.
- Display type: Sora for concise marketing and section headlines.
- Product type: Geist for controls, instructions, results, addresses, and metadata.
- Panels: 18-20px corner radius with quiet borders and restrained shadows.
- Controls: 10-12px radius and at least 44px for primary mobile targets.
- Pills: navigation and compact selection only.

## Motion

- Fast feedback: 120ms.
- Standard transitions: 200ms.
- Spatial continuity: 320ms.
- Motion never hides initial HTML content.
- Reduced motion follows the device preference globally. Large transforms are removed; opacity-only enhancement is acceptable.

## Layout rules

- Landing pages use an asymmetric composition and a real rendered Scrapp example.
- Camera is an immersive dark workspace independent of the system theme.
- Locations shows scan context, location, category, and list results before the map on mobile.
- Desktop locations keeps a wider list-and-map split.
- Avoid nested card stacks, repeated equal grids, generic statistics, and ornamental UI.

## Component rules

- Navigation: desktop floating pill; mobile safe-area bottom tabs; hidden on camera.
- Camera: dedicated safe-area Home and History controls, stable thumb-zone capture dock.
- Result: item first, exact bin or route second, imperative guidance third, location only when searchable.
- Category picker: mobile bottom sheet, desktop dropdown, preserving URL-state behavior.
- Map: mounted on demand on mobile; Advanced Markers have meaningful titles.
- Toasts, sheets, dialogs, and navigation use the named global z-index layers.

## Content rules

- Lead with the disposal answer rather than environmental persuasion.
- Use short, actionable recovery guidance.
- Clearly label static marketing fixtures as examples.
- Never imply City endorsement or invent statistics, acceptance rules, or successful production classifications.

## Decision ledger

- Kept Lucide and standardized its role instead of migrating the icon system.
- Added Motion only for bounded client-island continuity; CSS handles hover and press feedback.
- Rejected React Bits and GSAP because they add visual machinery without improving the core task.
- Removed the large autoplay hero video and all invisible-on-load reveal behavior.
- Reserved map loading for when it adds value, keeping list results usable without it.
