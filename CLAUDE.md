# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**find_names** is a public French baby name discovery app. Users search, compare and share name trends (INSEE data 1900-2022) via shareable URLs. No authentication — fully public.

The app lives in the `web/` subfolder (Next.js on Vercel with Turso database).

## Technology Stack (`web/`)

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui, Lucide Icons
- **Charts**: Recharts
- **Database**: Turso (libSQL) + Drizzle ORM
- **URL State**: nuqs (selected names synced to URL query params)
- **Deployment**: Vercel (Root Directory = `web`)

## Project Structure

```
find_names/
  web/                              # Production Next.js app
    src/
      app/
        layout.tsx                  # Root layout with NuqsAdapter + Header
        page.tsx                    # Home page with NameSelection
        globals.css                 # Tailwind + shadcn CSS variables
        actions/
          search.ts                 # Server Actions: searchNames, getNameStats, getMultipleNameStats
      components/
        header.tsx                  # App header with logo + SearchBar
        search-bar.tsx              # Client component: autocomplete with nuqs URL sync
        name-selection.tsx          # Client component: name chips + chart from URL state
        name-chart.tsx              # Client component: Recharts line chart
        ui/                         # shadcn/ui components (button, input, card, tabs)
      db/
        schema.ts                   # Drizzle schema: nameStats table
        index.ts                    # Drizzle client instance (Turso)
      lib/
        utils.ts                    # cn() utility from shadcn
        search-params.ts            # nuqs parser: namesParser for ?names=X,Y,Z
    scripts/
      seed.ts                       # CSV → Turso batch import script
    drizzle.config.ts               # Drizzle Kit config for migrations
    .env.example
    package.json
  nat2022.csv                       # Source data (git-ignored, ~703k rows)
```

## Database Schema (Turso/SQLite)

### `name_stats` — single table
- Columns: `id` (autoincrement), `name` (TEXT), `gender` (INTEGER: 1=boy, 2=girl), `year` (INTEGER), `count` (INTEGER)
- Indexes: `name` (prefix search), `(gender, name)`, `(name, year)`
- Unique index: `(name, gender, year)` — prevents duplicate rows

## Common Development Commands

### Next.js App (from `web/`)
```bash
cd web
npm run dev          # Dev server → http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run seed         # Seed Turso from nat2022.csv (requires .env.local)
npx drizzle-kit push # Push schema to Turso
npx drizzle-kit generate  # Generate migration files
```

### Database Setup
1. Create a Turso database: `turso db create find-names`
2. Get credentials: `turso db tokens create find-names`
3. Copy `web/.env.example` to `web/.env.local` and fill in `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`
4. Push schema: `npx drizzle-kit push`
5. Seed data: `npm run seed`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `TURSO_DATABASE_URL` | Turso database URL (libsql://...) |
| `TURSO_AUTH_TOKEN` | Turso auth token (optional for local dev with file: URL) |

## Key Architecture Notes

- **URL as state**: Selected names are stored in `?names=Côme,Hugo` via nuqs. This makes any view shareable via copy-paste of the URL.
- **Server Actions** in `src/app/actions/search.ts`: `searchNames` (autocomplete, prefix LIKE), `getNameStats` (single name), `getMultipleNameStats` (chart data for multiple names)
- **Search flow**: User types in SearchBar → debounced Server Action (200ms) → dropdown results → click adds name to URL → NameChart fetches data
- **Data pivot in chart**: Raw DB rows `(name, year, count, gender)` are pivoted client-side into `{ year, NameA: count, NameB: count }` for Recharts. Counts are summed across genders.
- **Seed script** filters out `_PRENOMS_RARES` (aggregate placeholder for rare names <3 births/year) and batch-inserts in chunks of 500
- Gender encoding from INSEE: `1 = Garçon (boy)`, `2 = Fille (girl)`
- All UI text is in French
