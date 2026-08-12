"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { DashboardSummaryView } from "@/types/database";

export function useDashboardSummary() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async (): Promise<DashboardSummaryView> => {
      const { data, error } = await supabase
        .from("v_dashboard_summary")
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
  });
}
