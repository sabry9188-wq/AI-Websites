"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { NetType, UserRole } from "@/types/database";

function invalidateLookups(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["sites"] });
  queryClient.invalidateQueries({ queryKey: ["cages"] });
  queryClient.invalidateQueries({ queryKey: ["mesh-size-options"] });
  queryClient.invalidateQueries({ queryKey: ["net-status"] });
  queryClient.invalidateQueries({ queryKey: ["cage-current"] });
}

function friendlyDeleteError(error: { code?: string; message: string }): string {
  if (error.code === "23503") {
    return "This is still in use elsewhere (e.g. nets or history reference it) and can't be deleted.";
  }
  return error.message;
}

// ---------------------------------------------------------------------------
// Team / roles — profiles_admin_update policy already allows this directly.
// ---------------------------------------------------------------------------

export function useUpdateProfileRole() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { profileId: string; role: UserRole }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ role: input.role })
        .eq("id", input.profileId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profiles"] }),
  });
}

// ---------------------------------------------------------------------------
// Sites — sites_admin_write policy already allows this directly.
// ---------------------------------------------------------------------------

export function useCreateSite() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; code: string; diameter_m: number }) => {
      const { error } = await supabase.from("sites").insert(input);
      if (error) throw error;
    },
    onSuccess: () => invalidateLookups(queryClient),
  });
}

export function useUpdateSite() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; name: string; code: string; diameter_m: number }) => {
      const { error } = await supabase
        .from("sites")
        .update({ name: input.name, code: input.code, diameter_m: input.diameter_m })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => invalidateLookups(queryClient),
  });
}

// ---------------------------------------------------------------------------
// Cages — cages_admin_write policy already allows this directly.
// ---------------------------------------------------------------------------

export function useCreateCage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { site_id: string; cage_number: string; diameter_m: number }) => {
      const { error } = await supabase.from("cages").insert(input);
      if (error) throw error;
    },
    onSuccess: () => invalidateLookups(queryClient),
  });
}

export function useDeleteCage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cages").delete().eq("id", id);
      if (error) throw new Error(friendlyDeleteError(error));
    },
    onSuccess: () => invalidateLookups(queryClient),
  });
}

// ---------------------------------------------------------------------------
// Mesh size options — mesh_options_admin_write policy already allows this
// directly. Safe to delete anytime: nets store their own mesh_size_mm value
// (not a foreign key), so removing an option only affects future choices.
// ---------------------------------------------------------------------------

export function useCreateMeshOption() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { site_id: string; net_type: NetType; mesh_size_mm: number }) => {
      const { error } = await supabase.from("mesh_size_options").insert(input);
      if (error) throw error;
    },
    onSuccess: () => invalidateLookups(queryClient),
  });
}

export function useDeleteMeshOption() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mesh_size_options").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateLookups(queryClient),
  });
}
