# netlog — Setup Guide

This guide assumes you have never used Supabase before. Follow the steps in
order — each one says what you should see afterward, so you know it worked
before moving on.

This is the complete app: net register, install/remove actions, offline
support, dashboard, reports, exports, and notifications are all built and
working. This guide gets a **brand-new** Supabase project and deployment up
and running from nothing — if you already have one running (you do, if
you've been through this before), you don't need to repeat these steps.

---

## What you'll need before you start

- A web browser.
- [Node.js](https://nodejs.org) installed on the computer you'll run the app
  from (version 20 or later) — only needed if you want to run it on your own
  computer before deploying; not required just to deploy to Vercel. If
  you're not sure, open a terminal and run `node --version`.
- The project code on your computer (this repository).

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and click **Start your project**.
2. Sign up (or sign in) — a free account is all you need.
3. Click **New project**.
4. Fill in:
   - **Name**: `netlog` (or anything you'll recognize)
   - **Database password**: generate a strong one and **save it somewhere
     safe** — you may need it later, and Supabase won't show it to you again.
   - **Region**: pick the one closest to the farm for the best speed.
5. Click **Create new project**. Wait 1–2 minutes while Supabase sets it up.

**You'll know it worked when:** you land on your new project's dashboard,
with a sidebar showing Table Editor, SQL Editor, Authentication, etc.

---

## 2. Find your Project URL and anon key

1. In your Supabase project, click **Project Settings** (gear icon, bottom
   of the left sidebar).
2. Click **Data API** in the settings menu.
3. You'll see a **Project URL** — copy it exactly as shown, with nothing
   added before or after it (not the "REST URL" or any field with `/rest/v1`
   on the end — just the plain URL, e.g. `https://abcdefghijk.supabase.co`).
4. Click **API Keys** in the settings menu. Copy the key labeled **anon
   public** or **Publishable key** (older projects show a long `eyJ...`
   token; newer ones show `sb_publishable_...` — either is correct, use
   whichever one your project has). Do **not** copy a `service_role` or
   **Secret key** — that one is private and this project never needs it in
   the app.

**You'll know it worked when:** you have two values saved, copied straight
from Supabase (not retyped or passed through another app like Word, which
can silently corrupt them).

---

## 3. Run the database scripts

Run these two files, in this exact order, in the same place:

1. In your Supabase project, click **SQL Editor** in the left sidebar, then
   **New query**.
2. Open `supabase/schema.sql` from this project in a text editor, select
   all, copy, paste it into the SQL Editor, and click **Run**.
3. **You'll know it worked when:** you see a success message with no red
   error text. Click **Table Editor** in the sidebar — you should see
   tables named `nets`, `net_deployments`, `net_events`,
   `conflict_acknowledgements`, `cages`, `sites`, `mesh_size_options`, and
   `profiles`. Open `cages` and confirm you see 44 rows (`C01`–`C20` and
   `OC01`–`OC24`).
4. Click **New query** again. Open
   `supabase/migrations/0002_phase3_fixes.sql`, copy all of it, paste it in,
   and click **Run**.
5. **You'll know it worked when:** no red error text appears, and the
   `conflict_acknowledgements` table (from step 3) now exists.

> **If the SQL Editor shows "failed to get project's logs":** this is a
> harmless glitch in Supabase's dashboard, unrelated to whether your script
> actually ran. Don't trust that message either way — check Table Editor to
> see whether the tables/rows you expect are actually there.

> **If something goes wrong partway through `schema.sql`:** it isn't safe to
> re-run on the same project (it will say things already exist). The
> simplest fix is to create a fresh Supabase project (repeat step 1) and run
> both scripts, in order, start to finish, on the new one.

---

## 4. Create your first user account

The app has no public "Sign Up" page on purpose — accounts are created by
an administrator, not by anyone who finds the site. So the very first
account is created directly in Supabase:

1. In your Supabase project, click **Authentication** in the left sidebar.
2. Click **Users**, then **Add user** > **Create new user**.
3. Enter your email address and a password. Leave "Auto Confirm User"
   turned on (so you don't need to click an email confirmation link).
4. Click **Create user**.

**You'll know it worked when:** your email appears in the Users list.

This automatically created a matching row in the `profiles` table with the
role **viewer** (read-only) — new accounts always start this way, on
purpose, so nobody can grant themselves more access than that. Now promote
yourself to **admin**:

5. Go back to **SQL Editor** > **New query** and run this, replacing the
   email with the one you just used:

   ```sql
   update profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```

6. Click **Run**.

**You'll know it worked when:** running
`select full_name, role from profiles;` in the SQL Editor shows your
account with role `admin`.

> To add more staff accounts later, repeat this section for each person,
> setting their role to `admin`, `supervisor`, or `viewer` as appropriate
> (viewers can just be left alone after creation — that's already their
> default). There's no in-app screen for this yet — it's done here, in
> Supabase, by an admin.

---

## 5. Run the app on your own computer (optional)

You can skip straight to Step 6 (Deploy) if you don't need to run it
locally first.

1. Open a terminal in the project folder.
2. Copy the example environment file:
   - Windows (PowerShell): `Copy-Item .env.example .env.local`
   - Mac/Linux: `cp .env.example .env.local`
3. Open `.env.local` in a text editor and fill in the two values from
   Step 2:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

4. Install dependencies: `npm install`
5. Start the app: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

**You'll know it worked when:** you're redirected to a sign-in page titled
"netlog". Sign in with the email and password from Step 4. You should land
on a dashboard that greets you by name and shows your role.

---

## 6. Deploy so staff can use it from anywhere

This project deploys to **Vercel**'s free tier.

1. Push this project to your GitHub repository (already done if you're
   reading this from the repo).
2. Go to [vercel.com](https://vercel.com) and sign up/sign in — you can use
   your GitHub account.
3. Click **Add New** > **Project**, then find and import your
   `AI-Websites` repository.
4. Before deploying, open **Environment Variables** and add the same two
   values from Step 2:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Wait for the build to finish (a couple of minutes).

**You'll know it worked when:** Vercel shows a "Congratulations" screen
with a live URL (something like `netlog.vercel.app`). Open it — you should
see the same sign-in page, now reachable from any phone or computer with
internet. Vercel automatically redeploys this same URL every time new code
is pushed to GitHub — you generally don't need to repeat this step.

> **Install it like an app:** open the live URL on a phone, then use the
> browser's "Add to Home Screen" (iPhone: Share button → Add to Home
> Screen; Android: menu → Install app / Add to Home Screen). It'll open
> full-screen from a home-screen icon like a normal app, and continues to
> work with no signal once it's been opened at least once with a
> connection.

---

## Try it end to end

1. Sign in.
2. **Net Register** → **Add Net** → create a test net.
3. Open its **⋯** menu → **Install** → pick a cage → confirm. It should
   appear as "Installed" immediately.
4. Check the **Dashboard** — the summary cards and charts should reflect
   the new net.
5. Check **Cages** — the cage you installed into should show progress
   toward being fully stocked.
6. Turn on airplane mode on your phone, install/remove/update another net,
   confirm it shows a "queued" state, then turn airplane mode back off and
   watch the sync status indicator (top bar) clear automatically.
7. Open **Reports**, export one report as PDF/Excel/CSV.

You can delete any test nets afterward from Supabase's **Table Editor** >
`nets` table.

---

## What's included

Net register with full lifecycle actions (install, remove, hole count,
status change, scrap), per-net history, a cage-by-cage stocking view, a
live dashboard with charts, reports with CSV/Excel/PDF export, in-app
notifications, role-based permissions enforced by the database (not just
hidden buttons), and offline support — actions taken with no signal queue
locally and sync automatically once back online, with any real conflicts
surfaced on the **Needs Attention** page for a supervisor to review.
