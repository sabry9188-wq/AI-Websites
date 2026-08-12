"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDashboardSummary } from "@/lib/queries/use-dashboard-summary";

export function SummaryCards() {
  const { data, isLoading } = useDashboardSummary();

  const cards = [
    { label: "Total Nets", value: data?.total_nets, alert: false },
    { label: "Nets in Water", value: data?.nets_in_water, alert: false },
    { label: "Nets in Store", value: data?.nets_in_store, alert: false },
    {
      label: "Due for Change (7d)",
      value: data?.due_for_change_7d,
      alert: (data?.due_for_change_7d ?? 0) > 0,
    },
    { label: "Overdue", value: data?.overdue_count, alert: (data?.overdue_count ?? 0) > 0 },
    {
      label: "Nets with Holes",
      value: data?.nets_with_holes,
      alert: (data?.nets_with_holes ?? 0) > 0,
    },
    {
      label: "Avg Days in Water",
      value: data?.avg_days_in_water ?? "—",
      alert: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className={cn(card.alert && "border-destructive/40")}
        >
          <CardHeader className="pb-2">
            <CardDescription>{card.label}</CardDescription>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <CardTitle
                className={cn("text-3xl", card.alert && "text-destructive")}
              >
                {card.value}
              </CardTitle>
            )}
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
