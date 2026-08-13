"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { NetEvent } from "@/types/database";

export interface ActivityEvent extends NetEvent {
  profiles: { full_name: string } | null;
  cages: { cage_number: string } | null;
  nets: { net_number: string } | null;
}

/** All net_events in a date range (inclusive start, exclusive end), for the
 * Daily/Weekly/Monthly activity reports — same permanent log Net History
 * reads from, just filtered by time instead of by net. */
export function useActivityEvents(fromIso: string, toIso: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["activity-events", fromIso, toIso],
    queryFn: async (): Promise<ActivityEvent[]> => {
      const { data, error } = await supabase
        .from("net_events")
        .select("*, profiles(full_name), cages(cage_number), nets(net_number)")
        .gte("event_timestamp", fromIso)
        .lt("event_timestamp", toIso)
        .order("event_timestamp", { ascending: false });
      if (error) throw error;
      return data as unknown as ActivityEvent[];
    },
  });
}
