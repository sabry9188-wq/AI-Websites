"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export interface UnacknowledgedConflict {
  event_id: string;
  net_id: string;
  net_number: string;
  cage_id: string | null;
  cage_number: string | null;
  event_timestamp: string;
  user_id: string | null;
  user_full_name: string | null;
  comments: string | null;
  metadata: Record<string, unknown>;
}

/** Offline-sync conflicts nobody has reviewed yet, from
 * `v_unacknowledged_conflicts`. This is what the Needs Attention screen
 * shows. */
export function useUnacknowledgedConflicts() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["unacknowledged-conflicts"],
    queryFn: async (): Promise<UnacknowledgedConflict[]> => {
      const { data, error } = await supabase
        .from("v_unacknowledged_conflicts")
        .select("*")
        .order("event_timestamp", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
