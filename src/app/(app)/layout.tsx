import { AppShell } from "@/components/app-shell";

// Every page in this group depends on the signed-in user's session and role,
// so there's nothing useful to prerender at build time.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
