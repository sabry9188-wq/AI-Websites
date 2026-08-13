"use client";

import { Waves } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast.error("Couldn't sign in", { description: error.message });
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-col items-center gap-5 bg-primary px-6 py-16 text-center text-primary-foreground sm:py-20">
        <span className="flex size-14 items-center justify-center rounded-full border-2 border-white/70">
          <Waves className="size-7" />
        </span>
        <h1 className="max-w-md text-4xl font-extrabold tracking-tight sm:text-5xl">
          netlog
        </h1>
        <p className="max-w-sm text-base text-primary-foreground/85 sm:text-lg">
          Track every net&apos;s life from store to sea and back — install, remove,
          and change dates, all in one place.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-muted/40 p-4 py-10">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6">
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Sign in with the account your administrator set up for you.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
