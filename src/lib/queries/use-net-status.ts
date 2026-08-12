"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { NetStatusView } from "@/types/database";

/** Every net with its calculated fields, straight from `v_net_status`. The
 * register is small enough (a few hundred nets at most) to fetch in full
 * and sort/filter/paginate on the client — simpler than building
 * server-side pagination for a dataset this size. */
export function useNetStatus() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["net-status"],
    queryFn: async (): Promise<NetStatusView[]> => {
      const { data, error } = await supabase
        .from("v_net_status")
        .select("*")
        .order("net_number");

      if (error) throw error;
      return data;
    },
  });
}
