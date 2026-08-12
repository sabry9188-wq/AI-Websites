"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export interface MonthlyChange {
  month: string;
  installed: number;
  removed: number;
}

const MONTHS_BACK = 6;

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
}

/** Install/removal counts per month for the last 6 months, from the
 * permanent net_events log. */
export function useMonthlyNetChanges() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["monthly-net-changes"],
    queryFn: async (): Promise<MonthlyChange[]> => {
      const since = new Date();
      since.setMonth(since.getMonth() - (MONTHS_BACK - 1));
      since.setDate(1);
      since.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("net_events")
        .select("action, event_timestamp")
        .in("action", ["installed", "removed"])
        .gte("event_timestamp", since.toISOString())
        .order("event_timestamp");
      if (error) throw error;

      const buckets = new Map<string, MonthlyChange>();
      const cursor = new Date(since);
      for (let i = 0; i < MONTHS_BACK; i++) {
        buckets.set(monthKey(cursor), {
          month: monthLabel(cursor),
          installed: 0,
          removed: 0,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }

      for (const event of data) {
        const key = monthKey(new Date(event.event_timestamp));
        const bucket = buckets.get(key);
        if (!bucket) continue;
        if (event.action === "installed") bucket.installed += 1;
        if (event.action === "removed") bucket.removed += 1;
      }

      return Array.from(buckets.values());
    },
  });
}
