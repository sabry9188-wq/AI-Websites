"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { categoricalColors, chartChrome } from "@/lib/charts/palette";
import { useIsDark } from "@/lib/charts/use-is-dark";
import { useMonthlyNetChanges } from "@/lib/queries/use-monthly-net-changes";

export function MonthlyChangesChart() {
  const { data, isLoading } = useMonthlyNetChanges();
  const isDark = useIsDark();
  const colors = categoricalColors(isDark);
  const chrome = chartChrome(isDark);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Net Changes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chrome.grid} vertical={false} />
              <XAxis
                dataKey="month"
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
              <Legend wrapperStyle={{ fontSize: 13, color: chrome.mutedText }} />
              <Bar
                dataKey="installed"
                name="Installed"
                fill={colors[0]}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                dataKey="removed"
                name="Removed"
                fill={colors[1]}
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
