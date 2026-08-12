"use client";

import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { Cage, MeshSizeOption, Site } from "@/types/database";

/** Sites, cages, and mesh size options rarely change, so these are cached
 * longer than the live net data. */
const LOOKUP_STALE_TIME = 5 * 60_000;

export function useSites() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["sites"],
    staleTime: LOOKUP_STALE_TIME,
    queryFn: async (): Promise<Site[]> => {
      const { data, error } = await supabase.from("sites").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCages() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["cages"],
    staleTime: LOOKUP_STALE_TIME,
    queryFn: async (): Promise<Cage[]> => {
      const { data, error } = await supabase
        .from("cages")
        .select("*")
        .order("cage_number");
      if (error) throw error;
      return data;
    },
  });
}

export function useMeshSizeOptions() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["mesh-size-options"],
    staleTime: LOOKUP_STALE_TIME,
    queryFn: async (): Promise<MeshSizeOption[]> => {
      const { data, error } = await supabase
        .from("mesh_size_options")
        .select("*")
        .order("mesh_size_mm");
      if (error) throw error;
      return data;
    },
  });
}
