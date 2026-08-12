"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "@/lib/auth/use-profile";
import { createClient } from "@/lib/supabase/client";

const SUMMARY_PLACEHOLDERS = [
  "Total Nets",
  "Nets in Water",
  "Due for Change",
  "Overdue",
];

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const supabase = createClient();
  const [testing, setTesting] = useState(false);

  async function runRlsDemo() {
    setTesting(true);
    const testNumber = `DEMO-${Date.now().toString().slice(-6)}`;

    const { error } = await supabase.rpc("create_net", {
      p_net_number: testNumber,
      p_net_type: "cage_net",
      p_mesh_size_mm: 10,
      p_dimensions: null,
      p_max_allowed_days_in_water: 60,
      p_notes: "Created by the Phase 1 permissions check — safe to delete.",
    });

    setTesting(false);

    if (error) {
      toast.error("Blocked by the database", { description: error.message });
      return;
    }

    toast.success(`Created test net ${testNumber}`, {
      description:
        "Your role can write. You can delete this test net from the Supabase table editor.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome{profile ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          You&apos;re signed in as{" "}
          <span className="font-medium capitalize">{profile?.role ?? "…"}</span>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUMMARY_PLACEHOLDERS.map((label) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl text-muted-foreground">—</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Real numbers arrive in Phase 4 (Dashboard + charts). This page just proves sign-in and permissions work end to end.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Phase 1 check: role permissions</CardTitle>
          <CardDescription>
            This button calls the same database function every net-creating
            action in the app will use. Supervisors and admins will see it
            succeed; viewers will see the database itself refuse the write —
            proof this is enforced by Postgres, not just a hidden button.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runRlsDemo} disabled={testing}>
            {testing ? "Trying…" : "Try creating a test net"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
