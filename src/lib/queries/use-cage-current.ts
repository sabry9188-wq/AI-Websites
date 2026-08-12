"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { CageCurrentView } from "@/types/database";

/** One row per cage showing whether its cage_net/guard_net slots are
 * currently filled — from `v_cage_current`. */
export function useCageCurrent() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["cage-current"],
    queryFn: async (): Promise<CageCurrentView[]> => {
      const { data, error } = await supabase
        .from("v_cage_current")
        .select("*")
        .order("cage_number");
      if (error) throw error;
      return data;
    },
  });
}
