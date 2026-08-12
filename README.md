# netlog

Tracks every fish cage net at the farm through its entire life — store,
water, wash, repair, back into the water, possibly in a different cage —
and warns staff before a net is overdue for changing.

First time here? Start with **[SETUP.md](./SETUP.md)** — it walks through
creating the Supabase project, running the database script, creating your
first admin account, and running or deploying the app, step by step.

## Stack

- **Database / Auth / RLS**: [Supabase](https://supabase.com) (Postgres)
- **Frontend**: Next.js (App Router, TypeScript), Tailwind CSS, shadcn/ui
- **Hosting**: Vercel

## Project layout

- `supabase/schema.sql` — the entire database: tables, constraints, views,
  security policies, and starting reference data (sites/cages/mesh sizes).
  Paste-and-run in the Supabase SQL Editor.
- `src/app` — pages (App Router). `(app)` is the signed-in shell; `login`
  is the sign-in page.
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
see `.env.example` and [SETUP.md](./SETUP.md).

## Status

Building in phases — see the project plan for the full roadmap. Phase 1
(this state): database schema, authentication, roles enforced via RLS, and
the app shell are in place. The Net Register, live dashboard numbers,
install/remove actions, offline support, and reports arrive in later
phases.
