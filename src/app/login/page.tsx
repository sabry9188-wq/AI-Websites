import { LoginForm } from "@/components/login-form";

// This page reads/writes the Supabase auth session on the client; nothing
// useful to prerender at build time.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm />;
}
