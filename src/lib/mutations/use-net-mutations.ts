"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { NetType } from "@/types/database";

export interface CreateNetInput {
  net_number: string;
  net_type: NetType;
  mesh_size_mm: number;
  dimensions: string | null;
  max_allowed_days_in_water: number;
  notes: string | null;
}

export function useCreateNet() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNetInput) => {
      const { data, error } = await supabase.rpc("create_net", {
        p_net_number: input.net_number,
        p_net_type: input.net_type,
        p_mesh_size_mm: input.mesh_size_mm,
        p_dimensions: input.dimensions,
        p_max_allowed_days_in_water: input.max_allowed_days_in_water,
        p_notes: input.notes,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["net-status"] });
    },
  });
}

export interface EditNetInput {
  net_id: string;
  net_number: string;
  mesh_size_mm: number;
  dimensions: string | null;
  max_allowed_days_in_water: number;
  notes: string | null;
  manually_flagged: boolean;
}

export function useEditNet() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditNetInput) => {
      const { error } = await supabase.rpc("edit_net", {
        p_net_id: input.net_id,
        p_net_number: input.net_number,
        p_mesh_size_mm: input.mesh_size_mm,
        p_dimensions: input.dimensions,
        p_max_allowed_days_in_water: input.max_allowed_days_in_water,
        p_notes: input.notes,
        p_manually_flagged: input.manually_flagged,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["net-status"] });
    },
  });
}
