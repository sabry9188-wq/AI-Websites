# netlog

Tracks every fish cage net at the farm through its entire life — store,
water, wash, repair, back into the water, possibly in a different cage —
and warns staff before a net is overdue for changing. Works fully offline
on the boat: actions queue locally and sync automatically once back online.

First time here? Start with **[SETUP.md](./SETUP.md)** — it walks through
creating the Supabase project, running the database scripts, creating your
first admin account, and deploying the app, step by step.

## Stack

- **Database / Auth / RLS**: [Supabase](https://supabase.com) (Postgres)
- **Frontend**: Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui
- **Offline**: Dexie (IndexedDB write queue), Serwist (PWA service worker),
  TanStack Query (persisted cache for offline viewing)
- **Charts**: Recharts · **Exports**: write-excel-file, jsPDF
- **Hosting**: Vercel

## Project layout

- `supabase/schema.sql` — the entire database from scratch: tables,
  constraints, views, RPCs, security policies, and starting reference data
  (sites/cages/mesh sizes). Paste-and-run in the Supabase SQL Editor on a
  **new** project only.
- `supabase/migrations/` — numbered scripts to bring an **existing**
  project up to date after `schema.sql` has already been run once. Run any
  you haven't already, in order.
- `src/app` — pages (App Router). `(app)` is the signed-in shell; `login`
  is the sign-in page; `sw.ts` is the service worker source.
- `src/components/nets` — the net lifecycle UI: register table, per-action
  dialogs (install/remove/hole count/status/scrap), history.
  `src/components/dashboard`, `.../reports`, `.../offline`,
  `.../notifications` follow the same one-folder-per-area pattern.
- `src/lib/offline` — the offline write queue (Dexie) and sync engine.
  Every lifecycle action goes through `queueAction()` in `sync-engine.ts`,
  never a direct network call.
- `src/lib/supabase` — the two Supabase client helpers (browser + server).
- `src/proxy.ts` — redirects signed-out visitors to `/login` and refreshes
  the session on every request.
- `src/types/database.ts` — TypeScript types matching the database schema.

## Local development

```
npm install
npm run dev
```

Requires a `.env.local` with your Supabase project's URL and anon key —
see `.env.example` and [SETUP.md](./SETUP.md). Note `dev`/`build` pass
`--webpack`: the PWA plugin (`@serwist/next`) doesn't yet support
Turbopack, which Next.js otherwise defaults to.

## Status

Feature-complete per the original plan: net register, install/remove/status
lifecycle actions, per-net history, cage stocking view, offline queue with
conflict handling, live dashboard with charts, reports with CSV/Excel/PDF
export, and in-app notifications. Settings (managing sites/cages/mesh
sizes/roles from the app, rather than the Supabase dashboard) remains a
placeholder — that's still done directly in Supabase per SETUP.md.
