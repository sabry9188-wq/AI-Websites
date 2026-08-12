"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCageCurrent } from "@/lib/queries/use-cage-current";
import type { CageCurrentView } from "@/types/database";

function SlotRow({
  label,
  filled,
  netNumber,
}: {
  label: string;
  filled: boolean;
  netNumber: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      {filled ? (
        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" />
          {netNumber}
        </span>
      ) : (
        <span className="flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-3.5" />
          Empty
        </span>
      )}
    </div>
  );
}

export default function CagesPage() {
  const { data: cages, isLoading } = useCageCurrent();

  const bySite = useMemo(() => {
    const map = new Map<string, CageCurrentView[]>();
    for (const cage of cages ?? []) {
      const list = map.get(cage.site_name) ?? [];
      list.push(cage);
      map.set(cage.site_name, list);
    }
    return map;
  }, [cages]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Cages</h1>
        <p className="text-muted-foreground">
          Every cage needs both a cage net and a guard net installed at all times.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        Array.from(bySite.entries()).map(([siteName, siteCages]) => (
          <div key={siteName} className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">{siteName}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {siteCages.map((cage) => (
                <Card
                  key={cage.cage_id}
                  className={
                    !cage.has_cage_net || !cage.has_guard_net
                      ? "border-amber-300 dark:border-amber-800"
                      : undefined
                  }
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{cage.cage_number}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1.5 text-sm">
                    <SlotRow
                      label="Cage Net"
                      filled={cage.has_cage_net}
                      netNumber={cage.cage_net_number}
                    />
                    <SlotRow
                      label="Guard Net"
                      filled={cage.has_guard_net}
                      netNumber={cage.guard_net_number}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
