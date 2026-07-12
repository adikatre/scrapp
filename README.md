# Scrapp — Smart Waste Disposal Helper

Photograph an item, get clear disposal guidance, and find nearby drop-off locations. Scrapp is a mobile-first PWA built to reduce recycling confusion and keep hazardous waste out of the wrong bins.

## How to Use

1. **Home** (`/`) — Learn how Scrapp works and why proper disposal matters.
2. **Scan** (`/cam`) — Take a photo with your camera or upload an image. Add an optional note for extra context.
3. **Result** — See the item name, material, disposal route, confidence, and guidance.
4. **Locations** (`/locations`) — Find nearby recycling, compost, e-waste, and other drop-off centers on an interactive map. Scan results deep-link here with item-specific search queries.

### Install as an App (PWA)

On mobile, open Scrapp in your browser and choose **Add to Home Screen** (Safari: Share → Add to Home Screen; Chrome: menu → Install app). Camera access requires HTTPS in production.

## Features

- Camera scan and image upload with optional text note
- GPT-4o-mini vision classification with 9 disposal routes, confidence scores, and caveats
- Interactive locations map with category filters and LLM-generated search queries from scan results
- Curated local data (e.g. San Diego County free battery collection at library branches)
- Mobile-first responsive UI with separate mobile and desktop scan experiences
- Installable PWA ([manifest.ts](src/app/manifest.ts))

## Congressional App Challenge

Scrapp placed **4th nationally** in the Congressional App Challenge 2025. We built it as high school students to tackle a real community problem: people don't know how to dispose of things properly, which hurts the environment. Our solution makes it simple — take a photo and get clear disposal instructions.

## Developer Setup

### Prerequisites

- Node.js 20+
- A running [Scrapp backend](https://github.com/adikatre/scrapp-backend) with a valid `OPENAI_API_KEY` (predictions won't work without it)
- Google Cloud project with **Maps JavaScript API** and **Places API (New)** enabled (for the locations page)

### Install and Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Start the backend on port 5000 before scanning.

### Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PRIVATE_BACKEND_URL` | Flask backend URL (e.g. `http://localhost:5000`) |
| `GOOGLE_PLACES_API_KEY` | Server-side Places search (keep secret) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side map tiles (restrict by domain in production) |

See [.env.example](.env.example) for a template.

### Project Structure

| Path | Description |
|---|---|
| `src/app/page.tsx` | Landing page |
| `src/app/cam/` | Scan flow (mobile and desktop UIs) |
| `src/app/locations/` | Map and place search |
| `src/lib/backend.ts` | Server action that proxies to `/predict` |
| `src/lib/googlePlaces.ts` | Places API search and details |
| `src/lib/curated/` | Hand-curated local drop-off programs |

### Architecture

```
User → Next.js PWA → server action → Flask /predict → GPT-4o-mini
                   → Google Places API (locations search)
                   → Google Maps JS API (map tiles)
```

## Deployment

Deploy the frontend to Vercel and the backend to Render or Railway. Set `NEXT_PRIVATE_BACKEND_URL` to your production backend URL and restrict `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your domain in Google Cloud Console.

For a full launch checklist — budget, metrics, distribution, and ops — see [LAUNCH_GUIDE.md](LAUNCH_GUIDE.md).

## Tech Stack

**Frontend (this repo):** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Radix UI, Google Maps

**Backend:** [scrapp-backend](https://github.com/adikatre/scrapp-backend) — Flask, GPT-4o-mini vision

## Made By

- Frontend: [SlushEE0](https://github.com/slushee0) — [repo](https://github.com/SlushEE0/scrapp)
- Backend & AI: [adikatre](https://github.com/adikatre) — [repo](https://github.com/adikatre/scrapp-backend)

---

_Making waste disposal less confusing, one photo at a time._
