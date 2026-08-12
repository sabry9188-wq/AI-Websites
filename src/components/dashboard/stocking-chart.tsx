"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { chartChrome, STATUS_COLORS } from "@/lib/charts/palette";
import { useIsDark } from "@/lib/charts/use-is-dark";
import { useCageCurrent } from "@/lib/queries/use-cage-current";

const BUCKETS = [
  { key: "full", label: "Fully stocked", color: STATUS_COLORS.good, icon: CheckCircle2 },
  { key: "partial", label: "Partially stocked", color: STATUS_COLORS.warning, icon: AlertTriangle },
  { key: "empty", label: "Empty", color: STATUS_COLORS.critical, icon: XCircle },
] as const;

export function StockingChart() {
  const { data: cages, isLoading } = useCageCurrent();
  const isDark = useIsDark();
  const chrome = chartChrome(isDark);

  const data = useMemo(() => {
    let full = 0;
    let partial = 0;
    let empty = 0;
    for (const cage of cages ?? []) {
      const filled = Number(cage.has_cage_net) + Number(cage.has_guard_net);
      if (filled === 2) full += 1;
      else if (filled === 1) partial += 1;
      else empty += 1;
    }
    const counts = { full, partial, empty };
    return BUCKETS.map((b) => ({ ...b, count: counts[b.key as keyof typeof counts] }));
  }, [cages]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nets by Cage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: chrome.mutedText, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={110}
                  tick={{ fill: chrome.mutedText, fontSize: 12 }}
                  axisLine={{ stroke: chrome.axis }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: chrome.grid, opacity: 0.4 }}
                  contentStyle={{
                    background: chrome.tooltipBg,
                    color: chrome.tooltipText,
                    border: `1px solid ${chrome.grid}`,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {data.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {BUCKETS.map((b) => (
                <span key={b.key} className="flex items-center gap-1">
                  <b.icon className="size-3.5" style={{ color: b.color }} />
                  {b.label}: cage needs {b.key === "full" ? "nothing" : b.key === "partial" ? "one more net" : "both nets"}
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
