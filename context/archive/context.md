# Scrapp Project Context

> Snapshot date: August 9, 2026  
> Frontend repository: `A:\WEB\scrapp` / <https://github.com/adikatre/scrapp>  
> Backend repository: `A:\WEB\scrapp-backend` / <https://github.com/adikatre/scrapp-backend>  
> Production site: <https://scrapp.app/>

This document is a technical and product handoff for Scrapp. It explains what the application does, how the frontend and backend communicate, how classification and location routing work, where state is stored, which external services are involved, and which implementation details are important to preserve.

No environment-variable values or secrets are included here.

## 1. Product Purpose

Scrapp is a mobile-first waste-disposal assistant focused on City of San Diego rules.

The core user problem is that people often do not know whether an item belongs in recycling, organics, trash, a hazardous-waste facility, an e-waste facility, or a donation/drop-off program. Scrapp reduces that decision to a short workflow:

1. Photograph an item or upload an image.
2. Optionally add a short note explaining what the item is or asking a question.
3. Send the image to an AI vision classifier.
4. Receive an item name, material, disposal route, exact San Diego bin, practical guidance, confidence, and location-search suggestions.
5. If a physical destination is relevant, open a location search preconfigured for the classified item.
6. View nearby Google Places and hand-curated drop-off programs on a list and map.
7. Open directions or additional place details.

The application is intentionally more specific than a generic recycling classifier. It embeds San Diego curbside rules and has curated routing logic for batteries and other items where sending a user to the wrong type of collection site could be unsafe or misleading.

## 2. System Overview

```text
User's browser
  |
  |-- Next.js application (scrapp)
  |     |-- Landing page and educational content
  |     |-- Camera/upload and scan history
  |     |-- Server Action proxy for classification
  |     |-- Location search orchestration
  |     |-- Google Maps rendering
  |     |-- Curated drop-off data
  |     `-- PWA manifest and icons
  |
  |-- Flask backend (scrapp-backend)
  |     |-- Bearer-token authentication
  |     |-- Image decoding and normalization
  |     |-- Optional YOLO detection (disabled in production by default)
  |     |-- OpenAI vision classification
  |     `-- Structured disposal response and fallback behavior
  |
  |-- OpenAI API
  |     `-- Waste-item image classification
  |
  |-- Google Places API (server-side key)
  |     |-- Text search
  |     |-- Location autocomplete
  |     |-- Place coordinate resolution
  |     |-- Place details
  |     `-- Place photo resolution
  |
  |-- Google Maps JavaScript API (browser key)
  |     `-- Interactive map and markers
  |
  |-- Upstash Redis (optional but intended for production)
  |     `-- Rate-limit state
  |
  `-- PostHog (optional)
        `-- Client-side analytics/autocapture
```

The browser never calls the Flask backend directly. A Next.js Server Action receives the browser's `FormData`, applies frontend-side validation and rate limiting, adds the shared bearer secret, and forwards the request to Flask.

## 3. Technology Stack

### Frontend

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI and shadcn-style local UI components
- Lucide icons
- `react-webcam` for camera capture
- `@vis.gl/react-google-maps` for the map
- Sonner for toast messages
- Upstash Redis/Ratelimit support
- PostHog client instrumentation
- Vitest and Testing Library
- Biome configuration is present
- Vercel Analytics and Speed Insights packages are installed, although the current layout does not render their React components

### Backend

- chatgpt-4o api

## 4. Frontend Routes

### `/` — Landing page

Implemented in `src/app/page.tsx`.

The landing page is a client component. It contains:

- A full-viewport hero with a looping background video
- The Scrapp name and value proposition
- A primary link to `/cam`
- Animated environmental statistics
- Educational cards for lesser-known recyclable/disposal cases
- A final scan call to action
- Frontend and backend repository links

The hero currently loads `public/hero-video-loop-2k.mp4`. The file is approximately 51.8 MB.

The page defines its own Intersection Observer hook for reveal animations and statistic counters. A reusable hook also exists at `src/hooks/useOnScreen.ts`, but the landing page currently uses the local implementation.

### `/cam` — Scan workflow

Implemented by:

- `src/app/cam/page.tsx`
- `src/components/ScanView.tsx`
- `src/components/DisposalTicket.tsx`
- `src/components/ScanHistory.tsx`
- `src/components/ScanHistorySheet.tsx`
- `src/components/ImageDetectionViewer.tsx`

The page is client-rendered because it depends on browser media devices, local storage, viewport size, and interactive scan state.

At widths below 800 px, the camera fills the screen and controls are overlaid on top. At larger widths, a persistent scan-history sidebar appears beside the camera.

The main camera states are:

1. **Camera ready** — live webcam view, upload control, camera switch on mobile, and capture button.
2. **Image captured** — still preview, optional note field, Retake, and Analyze actions.
3. **Analyzing** — blocking translucent overlay and spinner.
4. **Result active** — captured image remains in the background and a disposal ticket overlays the bottom portion.

`react-webcam` defaults to the environment-facing camera. The user-facing camera can be selected on mobile, and that view is mirrored.

When Analyze is pressed:

1. The captured data URL is converted to a `File` by `dataURLtoFile()`.
2. A `FormData` body is created with optional `text` and required `file` fields.
3. The `predict()` Server Action is called.
4. The response is summarized into display text.
5. The highest-confidence relevant item determines the dominant route, bin, item name, and search queries.
6. A new `ScanTicket` is added to local state and made active.
7. The captured image and note input are reset.

The result ticket displays:

- Item name
- Disposal-route badge
- Exact-bin chip when available
- Optional user note
- Guidance text
- Link to a preconfigured `/locations` URL
- Scan Again action

### `/locations` — Disposal-location discovery

Implemented primarily in:

- `src/app/locations/page.tsx`
- `src/components/locations/CategoryTabs.tsx`
- `src/components/locations/MapPanel.tsx`
- `src/components/locations/PlaceCard.tsx`
- `src/components/widgets/location-search/LocationSearchWidget.tsx`
- `src/components/widgets/location-map/LocationMapWidget.tsx`
- `src/lib/googlePlaces.ts`
- `src/lib/locationCategories.ts`
- `src/lib/locationSearchParams.ts`
- `src/lib/curated/`

The page accepts these URL parameters:

- `category` — normalized location category key
- `item` — classified item name
- `q` — repeatable item-specific search query; up to four are accepted
- `bin` — exact curbside bin, accepted only when it is a recognized curbside bin

Example shape:

```text
/locations?category=e_waste&item=USB%20cable&q=electronics%20recycling%20drop-off&bin=Special%20Drop-off
```

The actual URL is generated rather than handwritten, and `Special Drop-off` is not currently preserved as a `bin` parameter because only curbside-bin values are encoded into location links.

The locations screen includes:

- Current scan context when present
- City/ZIP/location autocomplete
- Use My Location action
- Disposal-category selection
- Optional item subcategories for e-waste and hazardous waste
- Text filter over returned place names and addresses
- Result cards with photos, distance, address, directions, details, hours, phone, and website where available
- Interactive Google Map with user and place markers

On mobile, the map is currently ordered before the search/results panel and occupies 45% of viewport height. On desktop, the controls and scrollable result list appear in a 320 px left column and the map fills the remaining area.

### `/api/place-photo`

Implemented in `src/app/api/place-photo/route.ts`.

This route protects the server-side Google Places key while resolving place photos:

1. Validate that `name` matches a Google photo-resource pattern.
2. Clamp requested width to 48–640 px; default is 128 px.
3. Ask Google for the final photo URL with `skipHttpRedirect=true`.
4. Redirect the browser to the returned CDN URL.
5. Cache the lookup for one day and allow stale responses for seven days.

### `/api/health`

Implemented in `src/app/api/health/route.ts`.

The response reports whether required environment variables are present and attempts a three-second authenticated call to `${NEXT_PRIVATE_BACKEND_URL}/health`. It returns HTTP 200 only if the required frontend environment is configured and the backend reports healthy; otherwise it returns 503.

The current Flask application defines `/predict` but does not define `/health`, so this health check can report the backend as unhealthy unless the deployed backend differs from the checked-in code or a platform layer supplies that endpoint.

### `/manifest.webmanifest`

Generated by `src/app/manifest.ts`.

The application is installable as a standalone PWA and includes 192 px, 512 px, and maskable icons. The manifest starts at `/` and uses Scrapp's dark-green/light-green theme colors.

## 5. Shared Layout and Navigation

`src/app/layout.tsx` provides:

- Geist through `next/font`
- Global Tailwind/CSS import
- Fixed `PillNav`
- Global Sonner toaster
- Page metadata and PWA-related metadata

The body is always assigned the `dark` class. There is no user-selectable theme even though `next-themes` is installed and the Sonner wrapper reads a theme.

`PillNav` links to:

- Home (`/`)
- Scan (`/cam`)
- Locations (`/locations`)

It measures the active link and animates a pill-shaped indicator between routes. On small screens, inactive link labels are hidden but icons remain visible.

## 6. Scan Data Model and Browser Persistence

The primary browser-side scan record is `ScanTicket`:

```ts
type ScanTicket = {
  id: string;
  timestamp: Date;
  image: string | null;
  note?: string;
  guidance: string;
  disposalRoute: string;
  bin?: string;
  itemName: string;
  searchQueries?: string[];
};
```

Scan history is stored under:

```text
scrapp-scan-history
```

The app stores up to 20 scans in `localStorage`. Images are stored as base64 data URLs. If browser quota is exceeded, it retries by persisting the same records with `image: null`. If that also fails, persistence is skipped for that update.

Location preferences are stored separately under:

```text
scrapp-locations-prefs
```

Saved location data includes latitude, longitude, display label, and last active category.

There are no user accounts or server-side scan-history records. Scan history is specific to one browser profile and can disappear when site storage is cleared.

## 7. Classification Request Path

### Browser to Next.js

`src/lib/backend.ts` is a Server Action module.

It requires:

- `NEXT_PRIVATE_BACKEND_URL`
- `BACKEND_API_KEY`

Both are read at module load, and missing values throw startup errors.

Before forwarding a file, the Server Action:

1. Resolves a rate-limit identifier from `formData.clientId`.
2. Checks the scan rate limiter.
3. Confirms that `file` is a `File`.
4. Validates maximum size and MIME/extension.
5. Creates a URL from `NEXT_PRIVATE_BACKEND_URL` and forces its path to `/predict`.
6. Sends the original multipart body with `Authorization: Bearer <BACKEND_API_KEY>`.
7. Returns a tuple containing `BaseStates.SUCCESS` and a `PredictionResult`, or `BaseStates.ERROR` and `null`.

Allowed image types are JPEG, PNG, and WebP. The frontend limit is 5 MB.

The current camera code does not add `clientId` to the `FormData`, so requests normally use the fallback identifier `anonymous`. If the shared Upstash limiter is enabled, unrelated users can therefore share the same scan bucket of ten requests per minute.

### Next.js to Flask

`A:\WEB\scrapp-backend\final\app.py` exposes:

```text
POST /predict
```

Every non-OPTIONS request must provide the correct bearer secret. Authentication uses `hmac.compare_digest`. When `BACKEND_API_KEY` is missing, the backend fails closed and rejects every request.

The endpoint:

1. Verifies that a multipart file exists and has a non-empty filename.
2. Reads optional `text` context.
3. Loads the image with Pillow and converts it to RGB.
4. Optionally runs YOLO detection.
5. Calls the OpenAI classifier.
6. Converts the classification to the frontend response shape.
7. Returns JSON.

The Flask app currently allows CORS from:

- `https://scrapp.app`
- `https://www.scrapp.app`
- `https://scrapp-sd.vercel.app`
- Any additional comma-separated origins in `CORS_ORIGINS`

CORS is not treated as authentication; the bearer token is the security boundary.

## 8. OpenAI Classifier

The main implementation is:

```text
A:\WEB\scrapp-backend\final\openai_classifier.py
```

Default configuration:

- Model: `gpt-4o-mini`
- Image detail: `high`
- Timeout: 20 seconds
- Maximum image dimension: 1280 px
- JPEG quality: 85
- Enabled unless `OPENAI_ENABLED=false`

Before transmission, the backend resizes large images and re-encodes them as JPEG data URLs.

The classifier requests a structured JSON object containing:

```ts
{
  items: Array<{
    name: string;
    material: string;
    route: string;
    bin: string;
    confidence: number;
    caveats: string;
    search_queries: string[];
  }>;
  guidance: string;
}
```

The system prompt is explicitly localized to City of San Diego rules. It contains detailed rules for:

- Blue Bin recycling
- Green Bin organics
- Gray Bin trash
- Special drop-off items
- Styrofoam, plastic bags/film, compostable plastics, food-soiled paper, batteries, bulbs, electronics, chemicals, bulky items, textiles, and other edge cases
- Miramar Household Hazardous Waste routing
- Ignoring people and background subjects
- Treating cables, chargers, adapters, and similar accessories as e-waste
- Returning concise, actionable guidance
- Producing item-specific Google Places queries without `near me` or a location name

The response is normalized after parsing. Unknown routes fall back conservatively. Invalid/missing bin values are derived from the route. Waste items are ordered ahead of people or other non-waste detections.

If OpenAI is disabled, unavailable, times out, or returns an unusable result, the backend produces a fallback result. With YOLO disabled, that fallback may have no confidently detected items. With YOLO enabled, detections are mapped to disposal routes and bins using `final/categories.py`.

## 9. Supported Disposal Routes and Bins

Frontend and backend route names must stay aligned.

Supported routes:

- `Recycle`
- `Compost`
- `E-Waste`
- `Hazardous Waste`
- `Bulky Items (Donate)`
- `Landfill / Donate / Check rules`
- `Single-Use Items`
- `General Trash`
- `City Infrastructure`
- `Living Things`

Supported exact bins:

- `Blue Bin (Recycling)`
- `Green Bin (Organics)`
- `Gray Bin (Trash)`
- `Special Drop-off`
- `Not Applicable`

The exact bin is authoritative for curbside items. If the route and bin disagree, `resolveCategoryKey()` uses the curbside bin to choose the location category. This prevents a model route such as donation/check-rules from overriding a valid gray-bin result.

Non-searchable categories are:

- Single-use items
- General trash
- City infrastructure
- Living things

These display explanatory messages rather than running Google Places searches.

## 10. How a Dominant Result Is Chosen

The classifier may return multiple items. The frontend reduces them to one dominant item for the main disposal ticket and location link.

Selection order:

1. Filter out `Living Things` and `City Infrastructure` when any waste item exists.
2. Pick the remaining classified item with the highest confidence.
3. If structured items are unavailable, use the largest route count from `bin_totals`.
4. If that is unavailable, use the first relevant detection.
5. If only object names exist, use the first object name.

The dominant structured item supplies:

- Route
- Bin
- Item name
- Search queries

## 11. Location Search Pipeline

`src/lib/googlePlaces.ts` uses server-side functions so the private Places API key never reaches browser JavaScript.

### Search input

A search receives:

- Category key
- Location label
- Optional latitude/longitude
- Optional classified item name
- Optional classifier-generated search queries

### Query construction

Each searchable category has a generic fallback template, for example:

- Recycling: `recycling center drop-off`
- Compost: `compost drop-off facility`
- E-waste: `electronics recycling drop-off`
- Hazardous: `household hazardous waste disposal facility`
- Donation: `donation center thrift store`

E-waste and hazardous searches can be refined by recognized item types such as batteries, bulbs, paint, motor oil, ink cartridges, phones, and laptops.

Classifier-generated queries are sanitized, deduplicated, limited to four, and searched in parallel. When coordinates are available, the text does not include a location label; Google receives a 25 km circular location bias and `rankPreference: DISTANCE`. Without coordinates, `near <location label>` is appended.

### Merge order

Results are merged in this order:

1. Matching curated providers
2. Item-specific Google results
3. Generic category Google results when item-specific results are absent or fewer than five

Duplicates are removed by Google place ID. Curated locations do not use Google IDs, so curated/Google duplicates are also checked by normalized name and geographic proximity. The curated entry wins because it knows what material the program accepts.

Generic hazardous and donation queries use exclusion patterns to remove obviously adjacent-but-wrong businesses such as scrap yards, auto salvage, pawn shops, landfills, and dumps. Item-specific query results are trusted more and are not filtered by these generic patterns.

### Location acquisition

When `/locations` mounts, it reads saved preferences and queries browser geolocation permissions. If geolocation is granted or still in the prompt state, it requests the current location with:

- High accuracy enabled
- Ten-second timeout
- Five-minute cached-position allowance

If that succeeds, the label becomes `Your location`. Otherwise the page continues with the saved/default label, initially `San Diego, CA`.

The user can also:

- Request geolocation explicitly
- Type a city/ZIP/region and use Places autocomplete
- Submit raw text, which attempts browser-side Google geocoding when available and otherwise performs a label-based search

### Place details

Initial search results request only the fields needed for cards and map pins. Phone, website, rating, open status, and weekly hours are fetched only when a user expands a non-curated result. Curated results already carry their own details and do not trigger that call.

## 12. Curated Drop-Off Programs

Curated providers live under:

```text
src/lib/curated/
```

The registry currently includes:

- San Diego County library household-battery program
- Southern California household-battery program
- Southern California e-bike battery program
- Southern California cell-phone program

Provider contract:

```ts
type CuratedProvider = {
  id: string;
  name: string;
  matches(input: CuratedMatchInput): boolean;
  places: Place[];
  nearestLimit?: number;
};
```

To add a program, create a provider module and register it in `src/lib/curated/index.ts`. The general search pipeline does not need to change.

Large providers can specify `nearestLimit`; when coordinates are known, only the closest sites are returned so hundreds of curated markers do not overwhelm Google results or the map.

### Battery-kind resolution

`src/lib/curated/items.ts` resolves a battery-related search into exactly one kind:

- `vehicle`
- `ebike`
- `cellphone`
- `household`

This is intentionally ordered and conservative.

Examples:

- Lead-acid/car/marine batteries resolve to `vehicle` and deliberately produce no curated result because the current curated programs do not accept them; Google can find auto-parts returns.
- E-bike, e-scooter, hoverboard, and similar packs resolve to `ebike`.
- Whole handsets resolve to `cellphone`.
- Loose common batteries and power banks resolve to `household`.
- Chargers, cables, docks, headphones, and device cases are excluded from battery programs.
- A phone battery resolves as a battery rather than as a whole handset.

The free-text item name is the primary signal. Classifier queries are only a strict fallback because generic phrases such as `battery recycling drop-off` do not prove that the scanned item is a loose household battery.

The large Southern California location dataset is generated JSON and should not be hand-edited. The generator cleans known upstream phone-number corruption and uses source-owned business fields rather than attempting to enrich address-level Google IDs.

## 13. Rate Limiting and Upload Validation

`src/lib/rateLimit.ts` defines three limiters:

- Scans: 10 per minute
- Place searches: 30 per minute
- Photo requests: 30 per minute

When Upstash credentials exist, rate-limit state is stored in Redis. Otherwise each server process uses an in-memory fallback.

Important current behavior:

- The scan Server Action calls the scan limiter.
- The identifier normally becomes `anonymous` because the UI does not send `clientId`.
- The exported place-search and photo limiters are not called by the current `googlePlaces.ts` functions or photo route.
- In-memory limits are not shared across server instances.

Upload validation checks:

- Maximum 5 MB
- JPEG, PNG, or WebP MIME type
- Matching common extension, with a special allowance for a filename of `blob`

The backend independently decodes the image with Pillow but does not currently enforce its own explicit byte-size or pixel-count limit before decoding.

## 14. Analytics and Observability

`src/instrumentation-client.ts` initializes PostHog only when `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is present.

Current PostHog behavior:

- Automatic page views
- Automatic page leaves
- Autocapture
- Local-storage persistence
- Respect for Do Not Track
- Development debugging

There are no explicit domain events in the current scan or location code, such as scan started, scan succeeded, scan failed, result viewed, location opened, or directions clicked.

The package list includes:

- `@vercel/analytics`
- `@vercel/speed-insights`

Neither is currently imported into the application layout.

The environment schema includes an optional `NEXT_PUBLIC_SENTRY_DSN`, but Sentry is not currently installed or initialized.

## 15. Security and Headers

Security-related behavior includes:

- Shared bearer authentication between Next.js and Flask
- Constant-time secret comparison in Flask
- Server-only Google Places key
- Domain-restricted public Google Maps key expected at deployment
- Input sanitization for item names and classifier search queries before Places calls
- Validation of Google photo-resource names
- Width clamping for photo requests
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- Production HSTS with preload directive
- `poweredByHeader: false`

`src/middleware.ts` defines a CSP string, but the middleware does not currently attach it to responses. The defined policy also contains `unsafe-inline` and `unsafe-eval`, largely for current script requirements.

`next.config.ts` repeats several security headers and configures caching for the place-photo route.

## 16. Environment Variables

### Frontend required

| Variable | Purpose |
|---|---|
| `GOOGLE_PLACES_API_KEY` | Server-side Places search, autocomplete, details, and photos |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser-side Google Maps JavaScript API |
| `NEXT_PRIVATE_BACKEND_URL` | Base URL of the Flask backend |
| `BACKEND_API_KEY` | Shared bearer secret; must match backend |

### Frontend optional

| Variable | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Shared production rate limiter |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash authentication |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | Enables PostHog |
| `NEXT_PUBLIC_POSTHOG_HOST` | Overrides default PostHog host |
| `NEXT_PUBLIC_SENTRY_DSN` | Reserved for Sentry; not currently used |
| `NEXT_PUBLIC_DISABLE_CAMERA` | Documented in `.env.example`, but not included in `src/env.mjs` and not read by current camera code |

### Backend

| Variable | Purpose | Default |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI authentication | none |
| `BACKEND_API_KEY` | Shared frontend/backend secret | none; missing rejects all calls |
| `USE_YOLO` | Enables YOLO pipeline | `false` |
| `CORS_ORIGINS` | Additional allowed origins | none |
| `OPENAI_ENABLED` | Enables OpenAI classification | `true` |
| `OPENAI_MODEL` | Vision model | `gpt-4o-mini` |
| `OPENAI_IMAGE_DETAIL` | Vision detail | `high` |
| `OPENAI_TIMEOUT_SECONDS` | OpenAI timeout | `20` |
| `OPENAI_MAX_IMAGE_SIZE` | Maximum image edge after resize | `1280` |
| `OPENAI_JPEG_QUALITY` | Re-encoded JPEG quality | `85` |

## 17. Styling and Component System

Global styles live in `src/app/globals.css`.

The app uses Tailwind 4 theme variables and shadcn-style semantic tokens for:

- Background/foreground
- Card/popover
- Primary/secondary/muted/accent
- Destructive
- Border/input/ring
- Charts
- Sidebar tokens
- Radius scale

Both light and dark variables exist, but the root layout always activates dark mode.

Category badge colors and bin colors are separate:

- Category colors communicate high-level disposal routes.
- Bin colors communicate exact San Diego curbside destinations.

The UI component directory contains local wrappers for buttons, cards, badges, dialog, drawer, sheet, dropdown menu, input, label, select, skeleton, table, textarea, tooltip, toast, and related primitives.

There are also older or currently unused widget abstractions under `src/components/widgets/` and utility components such as `NoLibCamera`, `AnimatedStatistic`, and `BackButton`. The active pages do not use all dependencies or components present in the repository.

## 18. PWA and Assets

Public assets include:

- Standard favicon and Apple icon
- 192 px and 512 px app icons
- Maskable icon variants
- Google icon
- Generic SVG starter assets
- Large homepage MP4

The PWA manifest is present, but there is no custom service worker or explicit offline cache implementation in the repository. Installation provides standalone display behavior, not full offline scan or location functionality.

Camera access requires a secure origin in production.

## 19. Testing and Current Build Health

Frontend test command:

```text
npm test
```

At this snapshot, the frontend suite passes:

- 4 test files passed
- 51 tests passed
- 4 tests skipped

Coverage is concentrated in:

- Utility behavior
- Rate limiting
- Location categories
- Curated battery item resolution

There are no committed browser end-to-end tests for the complete camera, classifier, results, or location journeys.

Production build command:

```text
npm run build
```

At this snapshot, the production build succeeds. Reported first-load JavaScript:

| Route | Route JS | First load JS |
|---|---:|---:|
| `/` | 7.4 kB | 195 kB |
| `/cam` | 17 kB | 223 kB |
| `/locations` | 55.5 kB | 253 kB |
| Shared by all routes | — | 176 kB |

The lint script is currently:

```text
next lint
```

Running it enters the deprecated Next.js lint-configuration prompt rather than performing a non-interactive lint. Production builds also set `eslint.ignoreDuringBuilds: true`, so lint is not presently an enforced quality gate.

Backend test command:

```text
python -m pytest
```

The backend README notes that the full YOLO test path needs additional packages that are intentionally absent from production requirements. In the inspected local Python environment, pytest itself is not installed, so the backend suite was not runnable during this snapshot.

## 20. Deployment

### Frontend

The frontend is configured for Vercel and Docker:

- `vercel.json`
- Standalone Next.js output
- Dockerfile
- Static image formats AVIF/WebP
- Compression enabled
- Google image-host remote patterns
- Static asset/cache headers

### Backend

The backend Docker image runs Gunicorn with two workers and a 60-second timeout. The intended hosting targets are Railway, Render, or a similar container platform.

Deployment requirements:

1. Set the same strong `BACKEND_API_KEY` in both environments.
2. Set the frontend's private backend URL to the deployed Flask origin.
3. Configure OpenAI credentials on the backend only.
4. Enable Places API (New) and Maps JavaScript API in Google Cloud.
5. Restrict the browser Maps key by allowed referrer.
6. Keep the server-side Places key private and appropriately API-restricted.
7. Configure Upstash if scan limits must be shared across instances.
8. Keep `USE_YOLO=false` unless the backend image and memory budget are expanded for the optional dependencies/model.

## 21. Important Current Behaviors and Caveats

These are descriptive notes about the checked-in implementation, not a separate redesign plan.

1. **Shared scan identity:** the scan limiter normally receives `anonymous`, causing users to share a bucket when Redis is enabled.
2. **Large landing asset:** the autoplay hero video is approximately 51.8 MB.
3. **Client-heavy routes:** the home, scan, and locations pages are all client components; 34 of 80 source files begin with `use client`.
4. **Map loads immediately:** the locations page imports and mounts the Google Maps provider with the page.
5. **Mobile map ordering:** the map occupies the top 45vh before controls/results.
6. **Automatic geolocation prompt:** the page calls geolocation when browser permission is still `prompt`.
7. **Generic scan errors:** failures are currently reduced to short toast messages without distinct recovery guidance.
8. **LocalStorage image pressure:** full base64 scan images can exceed quota; the fallback silently removes persisted images.
9. **Health endpoint mismatch:** the frontend probes backend `/health`, which is not present in the checked-in Flask app.
10. **Unused rate limiters:** place-search and photo limiter helpers exist but are not wired into the active calls.
11. **CSP not emitted:** a CSP is constructed in middleware but never set on the response.
12. **Analytics packages partially wired:** PostHog is initialized, but domain events are absent; Vercel analytics packages are installed but not mounted.
13. **Sentry placeholder only:** the environment schema anticipates Sentry, but no implementation exists.
14. **Camera kill switch not wired:** `.env.example` documents `NEXT_PUBLIC_DISABLE_CAMERA`, but current code does not consume it.
15. **Lint not enforced:** the current command is deprecated/interactive and builds ignore lint errors.
16. **Backend image validation:** Flask decodes the upload but does not independently enforce a raw upload-size or decompressed-pixel ceiling.
17. **Generated curated data:** `socalBatteries.data.json` should be regenerated through the provided script, never manually edited.
18. **Route/bin coupling:** exact strings are shared across repositories and changes must be coordinated.

## 22. Repository Map

```text
scrapp/
|-- public/                         PWA icons, favicon, hero media
|-- marketing/                      Flyer, demo video, contact notes
|-- src/
|   |-- app/
|   |   |-- page.tsx                Landing page
|   |   |-- layout.tsx              Root layout, navigation, toaster
|   |   |-- globals.css             Theme and global styles
|   |   |-- manifest.ts             PWA manifest
|   |   |-- cam/page.tsx            Scan state and history persistence
|   |   |-- locations/page.tsx      Location orchestration and UI
|   |   `-- api/
|   |       |-- health/route.ts      Environment/backend health probe
|   |       `-- place-photo/route.ts Places photo redirect proxy
|   |-- components/
|   |   |-- ScanView.tsx             Camera and scan interaction
|   |   |-- DisposalTicket.tsx       Primary result presentation
|   |   |-- ScanHistory*.tsx         Previous scan UI
|   |   |-- PillNav.tsx              Fixed route navigation
|   |   |-- locations/               Active map/list/category components
|   |   |-- widgets/                 Search/map/list widget abstractions
|   |   `-- ui/                      Local UI primitives
|   |-- data/                         Educational recyclable content
|   |-- hooks/                        Camera, media, hydration, viewport hooks
|   `-- lib/
|       |-- backend.ts                Classification Server Action
|       |-- googlePlaces.ts           Server-side Places functions
|       |-- locationCategories.ts     Route/bin/category/search mapping
|       |-- locationSearchParams.ts   URL state encoding/decoding
|       |-- rateLimit.ts              Upstash and in-memory limits
|       |-- geo.ts                    Distance and location persistence
|       |-- types.ts                  Shared frontend contracts
|       |-- utils.ts                  Data URL and prediction helpers
|       `-- curated/                  Curated provider registry and data
|-- next.config.ts                   Build/images/headers
|-- package.json                     Dependencies and scripts
|-- Dockerfile                       Frontend container build
|-- vercel.json                      Vercel configuration
|-- README.md                        Setup and architecture notes
|-- LAUNCH_GUIDE.md                  Launch, budget, metrics, operations
`-- TODO.md                          Early roadmap notes

scrapp-backend/
|-- final/
|   |-- app.py                       Flask app and /predict
|   |-- openai_classifier.py         Prompt, schema, image prep, fallback
|   `-- categories.py                Route/bin constants and YOLO mappings
|-- tests/                           API, categories, classifier tests
|-- scripts/                         Curated-data collection/generation
|-- requirements.txt                Production Python dependencies
|-- Dockerfile                       Gunicorn container
`-- README.md                        Backend setup and API reference
```

## 23. Safe Extension Points

### Add a curated program

1. Create a provider module under `src/lib/curated/`.
2. Return `Place[]` entries with stable IDs and `curated: true`.
3. Implement a narrow `matches()` rule.
4. Set `nearestLimit` when the dataset is dense.
5. Register the provider in `src/lib/curated/index.ts`.
6. Add tests for match behavior and ambiguous item wording.

### Add or change a disposal route/bin

Coordinate all of these:

- Backend schema and prompt
- `scrapp-backend/final/categories.py`
- Frontend `PredictionRoute`
- `LOCATION_CATEGORIES`
- Route-to-category mapping
- Bin constants and curbside information
- Result styling
- Location-link behavior
- Tests in both repositories

### Add a scan-result field

Coordinate:

- Backend JSON schema
- Response parsing/normalization
- Backend response conversion
- Frontend `ClassifiedItem` or `PredictionResult`
- Dominant-item helpers if the field affects routing
- `ScanTicketPayload` if the field must persist
- Result UI and history migration behavior

### Add a product analytics event

Prefer explicit events tied to the core journey rather than relying only on autocapture. Avoid sending camera images, raw notes, API secrets, or other sensitive content. Useful event boundaries include:

- Scan screen opened
- Camera permission granted/denied
- Capture or upload selected
- Analysis requested
- Analysis succeeded/failed/timed out
- Result route/bin shown
- Location search opened
- Place details expanded
- Directions clicked

## 24. Mental Model for Future Work

Scrapp is not simply an image classifier with a map. Its real product value is the chain of trust between four decisions:

```text
What is this item?
  -> What does San Diego require?
     -> Is a curbside bin sufficient?
        -> If not, which nearby place actually accepts this specific item?
```

Changes should preserve that chain. A visually impressive result is still wrong if it sends an e-bike pack to a household-battery bucket, treats a phone as a loose battery, suggests a facility when the item belongs at the curb, or hides uncertainty from the user.

The safest architectural principle is to keep:

- Classification and local disposal policy explicit
- Exact bin values separate from broad disposal routes
- Curated-provider acceptance rules conservative
- Location queries item-specific and sanitized
- API secrets on servers
- User-facing guidance concise and actionable
- External-service failures recoverable

That is the current application model and the foundation future UI, performance, analytics, and feature work should build on.
