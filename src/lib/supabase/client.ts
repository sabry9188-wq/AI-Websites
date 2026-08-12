import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for use in Client Components ("use client"). Session is
 * stored in cookies (not just localStorage) so the server (proxy.ts) can
 * read the same session. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
