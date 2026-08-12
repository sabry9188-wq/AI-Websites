"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";

export function useAcknowledgeConflict() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { eventId: string; resolutionNotes: string | null }) => {
      const { error } = await supabase.rpc("acknowledge_conflict", {
        p_net_event_id: input.eventId,
        p_resolution_notes: input.resolutionNotes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unacknowledged-conflicts"] });
    },
  });
}
