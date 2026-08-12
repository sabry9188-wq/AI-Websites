<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## netlog project notes

This is the `netlog` net-lifecycle tracker for an offshore aquaculture farm.
The full phased plan (schema design, offline architecture, stack rationale)
lives in the approved plan file for this project. Key things to remember:

- All net mutations (install/remove/status/hole-count/scrap) go through the
  Postgres RPCs defined in `supabase/schema.sql`, never raw table
  writes — see that file's Section 7 comments before adding a new
  mutation.
- Date/time math for nets is always Gulf Standard Time (`Asia/Dubai` in
  Postgres), never browser or server-local time.
- Offline support (Phase 3+) is a core requirement, not a stretch goal —
  see the plan for the Dexie queue + conflict-handling design before
  building install/remove UI.
