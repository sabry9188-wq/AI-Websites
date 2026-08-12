"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { NetEvent } from "@/types/database";

export interface NetEventWithNames extends NetEvent {
  profiles: { full_name: string } | null;
  cages: { cage_number: string } | null;
}

/** Full event history for one net, newest first — the permanent audit
 * trail from `net_events`, with the user's name and cage number resolved
 * for display. */
export function useNetEvents(netId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["net-events", netId],
    enabled: netId !== null,
    queryFn: async (): Promise<NetEventWithNames[]> => {
      const { data, error } = await supabase
        .from("net_events")
        .select("*, profiles(full_name), cages(cage_number)")
        .eq("net_id", netId as string)
        .order("event_timestamp", { ascending: false });
      if (error) throw error;
      return data as unknown as NetEventWithNames[];
    },
  });
}
