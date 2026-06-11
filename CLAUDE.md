# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**find_names** is a public French baby name discovery app ("Prénoms"). Users search, compare and share name trends (INSEE data 1900–2024) via shareable URLs. No authentication — fully public. All UI text is in French.

The app lives in the `web/` subfolder (Next.js on Vercel). **There is no database** — all data is pre-computed static JSON served from the CDN.

## Technology Stack (`web/`)

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (custom "Minuit graphite" dark theme, no shadcn)
- **Fonts**: Fraunces (display) + Figtree (body) via next/font
- **Charts**: Recharts
- **URL State**: nuqs (`?names=CAMILLE,CÔME` — names stored uppercase as in INSEE data)
- **Data**: static JSON generated from `nat2024.csv` into `web/public/data/` (committed to git; the CSV itself is git-ignored)

## Data Architecture

`npm run build:data` (scripts/build-data.ts) reads `../nat2024.csv` and writes to `public/data/`:

- `index.json` — `[name, totalBirths, genderFlag][]` sorted by popularity (flag: 1 boy, 2 girl, 3 mixed). Loaded once client-side for instant, accent-insensitive autocomplete (no network per keystroke).
- `s/{XX}.json` — 354 shards keyed by normalized first bigram of the name (`src/lib/shard.ts`). Each maps `NAME → [[year, boys, girls], ...]`.
- `top.json` — empty-state suggestions (top 2024 + century classics).

Rows with non-numeric years or `_PRENOMS_RARES` are filtered out. The script also writes `src/lib/dataset-meta.ts` (`LATEST_YEAR`), imported wherever the latest year is displayed.

## Request Flow

- Initial load / shared link: `page.tsx` (RSC) parses `?names=` via nuqs server loader, reads shards from the filesystem (`src/lib/data.ts`), renders chart + stats server-side.
- Client interactions: `Explorer` updates the URL via nuqs and fetches missing shards from `/data/s/{XX}.json` with an in-memory cache (`src/lib/series-client.ts`).

## Project Structure

```
find_names/
  web/
    src/
      app/
        layout.tsx              # Fonts + NuqsAdapter
        page.tsx                # RSC: loads initial series from searchParams
        globals.css             # Tailwind v4 @theme (Almanach palette)
      components/
        explorer.tsx            # Main client component: hero, chips, stats, suggestions
        search-bar.tsx          # Client-side instant autocomplete (keyboard nav)
        name-chart.tsx          # Recharts line chart + PALETTE
      lib/
        shard.ts                # shardKey() + normalizeForSearch() (shared build/runtime)
        data.ts                 # Server-side shard loading (fs)
        series-client.ts        # Client-side shard fetching + cache
        names-index.ts          # Client index loading, search, random pick
        types.ts                # SeriesRow/NameSeries, displayName(), summarize()
        search-params.ts        # nuqs parser (import from "nuqs/server")
    scripts/build-data.ts       # CSV → public/data/ generator
    public/data/                # Generated static data (committed)
  nat2024.csv                   # Source data (git-ignored, ~711k rows)
```

## Commands (from `web/`)

```bash
npm run dev          # Dev server → http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run build:data   # Regenerate public/data/ from ../nat2024.csv
```

No environment variables are required.

## Key Notes

- Names in URLs and data keys are uppercase with accents (INSEE format, e.g. `CÔME`); `displayName()` title-cases for display.
- Gender encoding from INSEE: `1 = garçon`, `2 = fille`.
- Max 6 names compared at once (`MAX_NAMES` in explorer.tsx); chart colors come from `PALETTE` in name-chart.tsx.
- `search-params.ts` must import from `nuqs/server` so the parser works in both RSC and client components.
