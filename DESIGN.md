# Scrapp Route Label design system

## Direction

**Route Label** is Scrapp's original visual world. It turns the disposal journey into a physical routing artifact: a photographed object, an optical inspection frame, a continuous route line, and a large die-cut answer label.

The system borrows from the real operating environment rather than another website. Its source material is collection tags, material swatch libraries, municipal route maps, public signage, camera contact sheets, and repair manuals. The result should feel tactile, calm, precise, and unmistakably built for Scrapp.

## Core composition

Each important journey follows the same visual sequence:

1. **Specimen** - show the actual item or place with honest photography.
2. **Inspection** - use an optical frame or focused selection state when input is still unresolved.
3. **Route** - connect steps with a visible line, station, or directional band.
4. **Label** - present the final bin or special route as the largest physical field.
5. **Provenance** - finish with source, jurisdiction, and verification details in a quiet technical table.

The route is structural, not decorative. It should make progress and causality easier to understand.

## Visual language

- Canvas: chalk off-white in light mode and deep charcoal in dark mode.
- Action: confident teal only.
- Disposal: blue means recycling, green means organics, and gray means trash. These colors are never generic decoration.
- Photography: clean studio specimens, real item texture, realistic municipal equipment, no nature montages, glowing AI orbs, or fabricated interfaces.
- Display type: Sora, used in short lines and capped at 6rem on large screens.
- Product type: Geist for controls, guidance, metadata, locations, and long-form reading.
- Geometry: mostly square fields with one clipped or notched corner. Rounded rectangles are reserved for controls, sheets, and true task states.
- Elevation: borders, overlap, and color fields establish hierarchy. Shadows are rare and shallow.
- Icons: Lucide at consistent optical sizes and stroke weights. Icons support labels; they do not replace them.

## Layout rules

- Prefer one dominant visual field per viewport over collections of equal cards.
- Use open editorial space, purposeful dividers, and uneven columns.
- Landing pages connect the specimen and disposal answer with a continuous route.
- Camera is an immersive dark workspace with a stable optical frame and tactile thumb dock.
- Results are physical semantic labels, not white cards inside sheets.
- Guide pages behave like a material library: large photographic fields, direct filtering, and no dashboard grid.
- Locations behaves like a route index: scan context and controls first, flat station rows second, map as supporting context.
- History is a quiet ledger with dividers, not a gallery of scan cards.
- Settings and trust pages use the shared title rail and open content field.
- At narrow widths, maintain the sequence and collapse columns without hiding content or introducing horizontal overflow.

## Component rules

- Navigation: a full-width site line on desktop and a safe-area tab rail on mobile; hidden in the camera workspace.
- Primary controls: at least 44px tall on mobile, visibly focused, and shaped consistently.
- Pills: compact state or filter labels only.
- Camera: dedicated Home and History controls, no global tab collision, safe-area-aware 100dvh.
- Result: item identity, exact route, imperative guidance, provenance, then secondary actions.
- Category picker: bottom sheet on mobile and compact menu on desktop, preserving query-string behavior.
- Places: photograph, verification status, name, distance, address, then actions. Generic discovery results always say to confirm.
- Maps: optional on mobile and never allowed to block list results.
- Empty, loading, permission, offline, and error states may use bounded containers because they are task states, not page composition.

## Color and theme

- Teal communicates action, selection, and route continuity.
- Blue, green, and gray communicate disposal outcomes only.
- Amber and red are reserved for caution and error states.
- Dark mode preserves the same roles without neon saturation.
- The camera stays dark in both system themes.
- Text and control contrast must meet WCAG 2.2 AA.

## Motion

- Press and focus feedback: 120ms.
- Standard state transition: 200ms.
- Bounded layout continuity: 320ms.
- Route motion is subtle and never required to understand state.
- Initial HTML remains visible.
- Reduced motion removes transform and tracking effects; opacity changes remain optional.
- Avoid parallax, continuous ambient animation, oversized cursor effects, and decorative scroll choreography.

## Content rules

- Lead with the answer or next action.
- Use plain imperative guidance.
- Say "Looks like" when identity is uncertain.
- Label static demonstrations as examples.
- Never imply City endorsement or invent statistics, rules, locations, or successful classifications.
- Source and jurisdiction details remain reachable without an account.

## Performance rules

- Route Label imagery must be responsive, explicitly sized, and compressed.
- The landing visual media budget is below 750 KB on mobile and 1.5 MB on desktop.
- Mobile maps and barcode fallbacks load only when requested.
- No autoplay video or hidden-on-load content.
- Visual detail must not compromise LCP, CLS, INP, zoom, or touch targets.

## Direction contract

- **Chosen world:** physical collection labels and route tags.
- **Supporting cues:** photographic specimens, die-cut windows, route bands, inspection frames, and technical metadata.
- **Rejected worlds:** neon AI dashboards, nature-campaign imagery, glassmorphism, ornamental card grids, generic SaaS bento layouts, and copied website compositions.
- **Quality test:** without the Scrapp wordmark, the specimen-to-route-to-label sequence should still identify this product.

## Decision ledger

- Replaced the earlier floating-card interpretation with an open, object-led system.
- Generated original specimen photography for Scrapp rather than using stock marketing scenes or another site's visual composition.
- Kept Sora, Geist, Lucide, semantic bin colors, system theming, and the dark camera because they remain useful product constraints.
- Kept all route, storage, URL, classification, geolocation, and backend contracts outside the visual redesign.
- Uses CSS for most interaction feedback and reserves Motion for bounded transitions only.
