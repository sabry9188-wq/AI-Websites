# netlog — Setup Guide

This guide assumes you have never used Supabase before. Follow the steps in
order — each one says what you should see afterward, so you know it worked
before moving on.

This is **Phase 1** of the project: the database, sign-in, and the basic
app shell exist, but the Net Register, Dashboard numbers, and Reports are
still placeholders ("Coming in Phase 2/4/5"). What you're checking at the
end of this guide is that you can sign in and that permissions are enforced
by the database — not the full feature set yet.

---

## What you'll need before you start

- A web browser.
- [Node.js](https://nodejs.org) installed on the computer you'll run the app
  from (version 20 or later). If you're not sure, open a terminal and run
  `node --version` — if you see a version number, you're set.
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
3. You'll see a **Project URL** — copy it somewhere you can paste from
   later. It looks like `https://abcdefghijk.supabase.co`.
4. Click **API Keys** in the settings menu. Copy the key labeled **anon
   public** (a long string starting with `eyJ...`). Do **not** copy the
   `service_role` key — that one is secret and this project never needs it
   in the app.

**You'll know it worked when:** you have two values saved — a URL and a
long key starting with `eyJ`.

---

## 3. Run the database script

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Click **New query**.
3. Open the file `supabase/schema.sql` from this project in a text editor,
   select all of its contents, and copy it.
4. Paste the entire script into the Supabase SQL Editor.
5. Click **Run** (or press Ctrl+Enter).

**You'll know it worked when:** you see "Success. No rows returned" (or
similar) at the bottom, with no red error text. Then click **Table Editor**
in the sidebar — you should see tables named `nets`, `net_deployments`,
`net_events`, `cages`, `sites`, `mesh_size_options`, and `profiles`. Open
`cages` and confirm you see 44 rows (`C01`–`C20` and `OC01`–`OC24`).

> **If something goes wrong partway through:** the script isn't safe to
> re-run on the same project (it will say things already exist). The
> simplest fix is to create a fresh Supabase project (repeat step 1) and
> run the script once, start to finish, on the new one.

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
> default).

---

## 5. Run the app on your own computer

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

4. Install dependencies:

   ```
   npm install
   ```

5. Start the app:

   ```
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

**You'll know it worked when:** you're redirected to a sign-in page titled
"netlog". Sign in with the email and password from Step 4. You should land
on a dashboard that greets you by name and shows your role.

### Try the permissions check

On the dashboard, click **Try creating a test net**.

- Signed in as **admin** or **supervisor**: you'll see a green success
  message — a real (test) net was created in your database.
- Signed in as **viewer**: you'll see a red error message from the
  database itself refusing the write. This is the point — permissions are
  enforced by Postgres, not just by hiding the button.

You can delete the test net afterward from Supabase's **Table Editor** >
`nets` table (find the row with a note starting "Created by the Phase 1
permissions check" and delete it).

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
see the same sign-in page as on your computer, now reachable from any
phone or computer with internet.

> Bookmark this URL, or add it to phone home screens, so staff on the boat
> can open it like an app.

---

## What's next

This is Phase 1 — the foundation. The Net Register, working Dashboard
numbers, install/remove actions, offline support, reports, and exports
arrive in the phases that follow, each with its own update to this
repository. You don't need to do anything further for those; you'll be
notified as each phase is ready to try.
