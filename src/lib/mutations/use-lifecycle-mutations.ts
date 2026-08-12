"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { NetStatus, RpcResult } from "@/types/database";

function invalidateNetQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["net-status"] });
  queryClient.invalidateQueries({ queryKey: ["cage-current"] });
  queryClient.invalidateQueries({ queryKey: ["net-events"] });
}

export interface InstallNetInput {
  net_id: string;
  cage_id: string;
  date_in: string;
  comments: string | null;
  client_generated_id?: string;
}

export function useInstallNet() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: InstallNetInput): Promise<RpcResult> => {
      const { data, error } = await supabase.rpc("install_net", {
        p_net_id: input.net_id,
        p_cage_id: input.cage_id,
        p_date_in: input.date_in,
        p_comments: input.comments,
        p_client_generated_id: input.client_generated_id ?? null,
      });
      if (error) throw error;
      return data as RpcResult;
    },
    onSuccess: () => invalidateNetQueries(queryClient),
  });
}

export interface RemoveNetInput {
  deployment_id: string;
  hole_count_at_removal: number;
  destination_status: NetStatus;
  comments: string | null;
  client_generated_id?: string;
}

export function useRemoveNet() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemoveNetInput): Promise<RpcResult> => {
      const { data, error } = await supabase.rpc("remove_net", {
        p_deployment_id: input.deployment_id,
        p_hole_count_at_removal: input.hole_count_at_removal,
        p_destination_status: input.destination_status,
        p_comments: input.comments,
        p_client_generated_id: input.client_generated_id ?? null,
      });
      if (error) throw error;
      return data as RpcResult;
    },
    onSuccess: () => invalidateNetQueries(queryClient),
  });
}

export interface UpdateHoleCountInput {
  net_id: string;
  hole_count: number;
  comments: string | null;
  client_generated_id?: string;
}

export function useUpdateHoleCount() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateHoleCountInput): Promise<RpcResult> => {
      const { data, error } = await supabase.rpc("update_hole_count", {
        p_net_id: input.net_id,
        p_hole_count: input.hole_count,
        p_comments: input.comments,
        p_client_generated_id: input.client_generated_id ?? null,
      });
      if (error) throw error;
      return data as RpcResult;
    },
    onSuccess: () => invalidateNetQueries(queryClient),
  });
}

export interface ChangeStatusInput {
  net_id: string;
  to_status: NetStatus;
  comments: string | null;
  client_generated_id?: string;
}

export function useChangeStatus() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ChangeStatusInput): Promise<RpcResult> => {
      const { data, error } = await supabase.rpc("change_status", {
        p_net_id: input.net_id,
        p_to_status: input.to_status,
        p_comments: input.comments,
        p_client_generated_id: input.client_generated_id ?? null,
      });
      if (error) throw error;
      return data as RpcResult;
    },
    onSuccess: () => invalidateNetQueries(queryClient),
  });
}

export interface ScrapNetInput {
  net_id: string;
  comments: string | null;
  client_generated_id?: string;
}

export function useScrapNet() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ScrapNetInput): Promise<RpcResult> => {
      const { data, error } = await supabase.rpc("scrap_net", {
        p_net_id: input.net_id,
        p_comments: input.comments,
        p_client_generated_id: input.client_generated_id ?? null,
      });
      if (error) throw error;
      return data as RpcResult;
    },
    onSuccess: () => invalidateNetQueries(queryClient),
  });
}
