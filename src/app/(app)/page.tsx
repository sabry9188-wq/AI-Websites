"use client";

import { MonthlyChangesChart } from "@/components/dashboard/monthly-changes-chart";
import { StatusChart } from "@/components/dashboard/status-chart";
import { StockingChart } from "@/components/dashboard/stocking-chart";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { useProfile } from "@/lib/auth/use-profile";
import { useDashboardSummary } from "@/lib/queries/use-dashboard-summary";

function formatUpdatedAt(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { dataUpdatedAt } = useDashboardSummary();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Welcome{profile ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-muted-foreground">
            You&apos;re signed in as{" "}
            <span className="font-medium capitalize">{profile?.role ?? "…"}</span>.
          </p>
        </div>
        {dataUpdatedAt > 0 && (
          <p className="text-xs text-muted-foreground">
            Data as of {formatUpdatedAt(dataUpdatedAt)}
          </p>
        )}
      </div>

      <SummaryCards />

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusChart />
        <StockingChart />
      </div>

      <MonthlyChangesChart />
    </div>
  );
}
