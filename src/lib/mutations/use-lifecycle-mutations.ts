"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queueAction } from "@/lib/offline/sync-engine";
import type { PendingActionType } from "@/lib/offline/db";
import type { NetStatusView } from "@/types/database";

export interface QueueNetActionInput {
  type: PendingActionType;
  net: NetStatusView;
  payload: Record<string, unknown>;
  optimisticPatch: Partial<NetStatusView>;
}

/** Every net lifecycle action (install/remove/hole count/status/scrap)
 * goes through this one hook. It never waits on the network — it queues
 * the action locally, applies an optimistic update to the UI, and returns
 * immediately, which is what makes it safe to call with no signal at all.
 * The actual sync (and any conflict) happens afterwards via the sync
 * engine. */
export function useQueueNetAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: QueueNetActionInput) => {
      await queueAction({
        queryClient,
        type: input.type,
        net: input.net,
        payload: input.payload,
        optimisticPatch: input.optimisticPatch,
      });
    },
  });
}
