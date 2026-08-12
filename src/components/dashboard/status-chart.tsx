"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { categoricalColors, chartChrome } from "@/lib/charts/palette";
import { useIsDark } from "@/lib/charts/use-is-dark";
import { useNetStatus } from "@/lib/queries/use-net-status";
import type { NetStatus } from "@/types/database";

const STATUS_ORDER: { key: NetStatus; label: string }[] = [
  { key: "in_store", label: "In Store" },
  { key: "installed", label: "Installed" },
  { key: "washing", label: "Washing" },
  { key: "repair", label: "Repair" },
  { key: "ready", label: "Ready" },
  { key: "scrapped", label: "Scrapped" },
];

export function StatusChart() {
  const { data: nets, isLoading } = useNetStatus();
  const isDark = useIsDark();
  const colors = categoricalColors(isDark);
  const chrome = chartChrome(isDark);

  const data = useMemo(() => {
    const counts = new Map<NetStatus, number>();
    for (const net of nets ?? []) {
      counts.set(net.current_status, (counts.get(net.current_status) ?? 0) + 1);
    }
    return STATUS_ORDER.map((s) => ({ label: s.label, count: counts.get(s.key) ?? 0 }));
  }, [nets]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nets by Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: chrome.mutedText, fontSize: 12 }}
                axisLine={{ stroke: chrome.axis }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: chrome.mutedText, fontSize: 12 }}
                axisLine={false}
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
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {data.map((entry, index) => (
                  <Cell key={entry.label} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
