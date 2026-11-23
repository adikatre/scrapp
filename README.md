# Scrapp: Smart Waste Disposal Helper

Photograph or describe a household item to get disposal guidance for the City of San Diego. [Try the demo and see the verified results](demo/clean.md). Scrapp is a mobile-first PWA built to reduce recycling confusion and keep hazardous waste out of the wrong bins.

## How to Use

1. **Home** (`/`). Scan an item or open a local guide for a common material.
2. **Scan** (`/cam`). Take or upload a photo, type an item description, or use both. Known household items also offer a local lookup without an API call.
3. **Result**. Select an item and answer any condition question. Open **Scan details** for the model's observations, estimated confidence and your original description.
4. **Disposal options** (`/locations`). The selected item and condition travel with you. See the local bin, program, appointment or places to contact. The original scan stays in this browser's history.

### Install as an App (PWA)

On mobile, open Scrapp in your browser and choose **Add to Home Screen** (Safari: Share → Add to Home Screen; Chrome: menu → Install app). Camera access requires HTTPS in production.

## Features

- Photo and text identification via the backend’s Adaption vision model, with support for existing OpenAI deployments.
- Local guidance linked to City, County and collection-program sources. Fabric condition, gas cylinder labels and battery type change what the app recommends.
- Item-by-item history and return navigation. A fresh photo preview stays in memory. Saved scans contain text and condition answers.
- A Google-independent local guide and curated battery sites, with optional live place search, contact details and map tiles.
- Mobile-first layout and installable PWA.

## Congressional App Challenge

Scrapp placed **4th nationally** in the Congressional App Challenge 2025. We built it as high school students to tackle a real community problem: people don't know how to dispose of things properly, which hurts the environment. Our solution makes it simple, take a photo and get clear disposal instructions.

## Developer Setup

### Prerequisites

- Node.js 20+
- For model analysis, run the [Scrapp backend](https://github.com/adikatre/scrapp-backend) with an `ADAPTION_API_KEY` or `OPENAI_API_KEY`. Keep provider credentials on the backend.
- Google Cloud project with **Maps JavaScript API** and **Places API (New)** enabled (optional, for live places and interactive maps)

### Install and Run

```bash
cp -n .env.example .env.local
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The household guide and curated programs work with the frontend alone. For scans, start the backend on port 5000 and set the same `BACKEND_API_KEY` on both servers.

### Scripts

| Command | What it does |
|---|---|
| `npm test` | Local guidance, program matching and scan history tests |
| `npm run dev` | Next.js dev server with Turbopack on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build (run `build` first) |
| `npm run lint` | ESLint via `next lint` |
| `npm run data:batteries` | **Regenerates** `src/lib/curated/socalBatteries.data.json` from the CSV at the repo root, see [Regenerating the data](#regenerating-the-data). Needs `python3` on PATH; the only script here that writes to source files |

### Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PRIVATE_BACKEND_URL` | Flask backend URL (e.g. `http://localhost:5000`) |
| `BACKEND_API_KEY` | Shared secret sent to the backend as `Authorization: Bearer <key>`. Must match `BACKEND_API_KEY` on the backend exactly, or every scan comes back `401`. The scanner shows an unavailable message when configuration is missing |
| `GOOGLE_PLACES_API_KEY` | Server-side Places search (keep secret) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client-side map tiles (restrict by domain in production) |

Only `NEXT_PUBLIC_`-prefixed variables reach the browser; the rest stay server-side. See [.env.example](.env.example) for a template.

### Project Structure

| Path | Description |
|---|---|
| `src/app/page.tsx` | Landing page |
| `src/app/cam/` | Scan flow (mobile and desktop UIs) |
| `src/app/locations/` | Map and place search |
| `src/lib/backend.ts` | Server action that proxies to `/predict` (adds the bearer token) |
| `src/lib/googlePlaces.ts` | Places API search and details |
| `src/lib/curated/` | Curated local drop-off programs |
| `src/app/api/place-photo/` | Route handler that proxies Places photos so the key stays server-side |

### Curated Drop-Off Data

For an item needing a facility, the locations page merges live Google Places candidates and curated drop-off programs in
[src/lib/curated/](src/lib/curated/). Each program owns its data plus a `matches()` rule deciding when
that data is relevant, so adding one means a new module and a line in the registry
([index.ts](src/lib/curated/index.ts)), nothing in the search pipeline changes. Curated sites render as
ordinary cards and map pins.

| Program | Sites | Accepts |
|---|---|---|
| [sanDiegoBatteries.ts](src/lib/curated/sanDiegoBatteries.ts) | 16 County Library branches | Household batteries only |
| [socalBatteries.ts](src/lib/curated/socalBatteries.ts) | ~690 Battery Network sites (Home Depot, Lowe's, bike shops, HHW facilities) across 10 SoCal counties | Split into three providers: household (rechargeable / single-use), e-bike (e-bike / high-energy packs), and cell phone |

The split matters: a bike shop won't take your AAs, a library collection box won't take a 500Wh e-bike
pack or a 40lb car battery, and a store with a battery bucket doesn't necessarily accept a whole
handset. [items.ts](src/lib/curated/items.ts) holds the single definition of how a scanned item maps to
one of these kinds, shared by every provider. Two things about it are easy to get wrong:

- **It resolves to exactly one kind, via ordered rules.** The classifier's wording overlaps, a
  "hoverboard battery" is both a hoverboard and a battery, and only the first reading routes it
  somewhere that accepts it. `vehicle` (car / lead-acid / marine) is a real outcome, not a failure: no
  curated site takes lead-acid, so it deliberately yields **no** curated places and leaves the search to
  Google, which finds the auto parts stores that do.
- **The item name is free text, so `search_queries` are a secondary signal, read strictly.** A phone
  can arrive as "smartphone", "iPhone", or "Samsung Galaxy S21", and no regex over brand names catches
  the last one. The classifier's queries are the fallback, but measuring the real model (gpt-4o-mini,
  production prompt) showed they name the *facility*, not reliably the item: across a sample of
  brand-name phones it **never** emitted "cell phone recycling", it emitted "electronics recycling
  drop-off", "Samsung device recycling center", and for several of them a generic **"battery recycling
  drop-off"**. Taking that last one at face value reads a handset as a household battery and sends it to
  a library collection box that won't accept it. So a query settles the kind only when it names the item
  ("iPhone recycling drop-off", "car battery recycling"), never when it merely says "battery", and only
  when the name resolved to nothing, or an e-bike pack's own generic battery query would put libraries
  back in front of a 500Wh pack. When nothing resolves, curated stays empty and Google's e-waste results
  still render, which is the safe failure.

Each provider caps how many sites it contributes via `nearestLimit`, so a few hundred retail sites can't
bury the live results.

#### Regenerating the data

`socalBatteries.data.json` is **generated, do not hand-edit it.** It is built from
`socal_battery_locations_live.csv` at the repo root (scraped by `sd_county_live_locator.py`):

```bash
npm run data:batteries   # wraps ../generate_socal_batteries_json.py
```

Two known quirks of the upstream data, both handled by the generator:

- **`google_place_id` is address-level, not business-level.** The IDs resolve, but to a `street_address`
 , Google returns `"21218 Roscoe Blvd"` rather than `"The Home Depot"`, with no hours or phone, and they
  never match the place IDs Google's own search returns. So the app renders the CSV's own fields and never
  looks these up. It also means Google results are de-duplicated against curated sites by name and
  proximity (`isSamePlace` in [geo.ts](src/lib/curated/geo.ts)), not by ID.
- **~20% of phone numbers are corrupt.** Upstream stored `1` + the 10-digit number in a 12-character
  field, truncating the final digit (`166-186-2890` is really `661-862-890_`). The lost digit is
  unrecoverable, so invalid numbers are dropped rather than shown.

### Architecture

```
User → Next.js PWA → server action → Flask /predict → Adaption or OpenAI
                   → city/county guide → condition-specific bin, appointment or drop-off
                   → Google Places API (locations search)
                   → Google Maps JS API (map tiles)
```

## Deployment

Deploy the frontend to Vercel and the backend to Railway or Render. Set `NEXT_PRIVATE_BACKEND_URL` to your production backend URL, set the same `BACKEND_API_KEY` on both sides, and restrict `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to your domain in Google Cloud Console.

For a full launch checklist, budget, metrics, distribution, and ops, see [LAUNCH_GUIDE.md](LAUNCH_GUIDE.md).

## Tech Stack

**Frontend (this repo):** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Radix UI, Google Maps

**Backend:** [scrapp-backend](https://github.com/adikatre/scrapp-backend), Flask, Adaption and OpenAI vision

## Made By

- Frontend: [SlushEE0](https://github.com/slushee0), [repo](https://github.com/SlushEE0/scrapp)
- Backend & AI: [adikatre](https://github.com/adikatre), [repo](https://github.com/adikatre/scrapp-backend)

---

_Making waste disposal less confusing, one photo at a time._
