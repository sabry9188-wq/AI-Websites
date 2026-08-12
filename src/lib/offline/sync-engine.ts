"use client";

import type { QueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import type { NetStatusView, RpcResult } from "@/types/database";
import { offlineDb, type PendingAction, type PendingActionType } from "@/lib/offline/db";

type RpcName =
  | "install_net"
  | "remove_net"
  | "update_hole_count"
  | "change_status"
  | "scrap_net";

const ACTION_RPC: Record<PendingActionType, RpcName> = {
  install: "install_net",
  remove: "remove_net",
  holeCount: "update_hole_count",
  changeStatus: "change_status",
  scrap: "scrap_net",
};

/** Applies an immediate, best-effort local update to the cached net list so
 * the UI reflects an action right away — even with no signal. This is
 * deliberately approximate (it doesn't recompute GST day-boundary math);
 * the authoritative numbers come from Postgres and overwrite this the
 * moment the action actually syncs. */
function applyOptimisticPatch(
  queryClient: QueryClient,
  netId: string,
  patch: Partial<NetStatusView>
) {
  queryClient.setQueryData<NetStatusView[]>(["net-status"], (old) =>
    old?.map((net) => (net.net_id === netId ? { ...net, ...patch } : net))
  );
}

export interface QueueActionParams {
  queryClient: QueryClient;
  type: PendingActionType;
  net: NetStatusView;
  payload: Record<string, unknown>;
  optimisticPatch: Partial<NetStatusView>;
}

/** Queues a write locally, applies it optimistically to the UI, and kicks
 * off a sync attempt. Returns immediately — it never waits on the network,
 * which is what makes this safe to call while offline. */
export async function queueAction({
  queryClient,
  type,
  net,
  payload,
  optimisticPatch,
}: QueueActionParams): Promise<void> {
  const id = crypto.randomUUID();

  const action: PendingAction = {
    id,
    type,
    netId: net.net_id,
    netNumber: net.net_number,
    payload: { ...payload, p_client_generated_id: id },
    createdAt: new Date().toISOString(),
    status: "pending",
    retryCount: 0,
  };

  await offlineDb.pendingActions.add(action);
  applyOptimisticPatch(queryClient, net.net_id, optimisticPatch);

  void syncPendingActions(queryClient);
}

let syncInFlight = false;

/** Drains the queue in the order actions were created. Safe to call as
 * often as you like — re-entrant calls are ignored while one is already
 * running, and it quietly no-ops when there's no connectivity. */
export async function syncPendingActions(queryClient: QueryClient): Promise<void> {
  if (syncInFlight) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  syncInFlight = true;
  try {
    const supabase = createClient();
    const actions = await offlineDb.pendingActions
      .where("status")
      .anyOf("pending", "failed")
      .sortBy("createdAt");

    let touchedNetStatus = false;
    let touchedConflicts = false;

    for (const action of actions) {
      await offlineDb.pendingActions.update(action.id, { status: "syncing" });

      try {
        const rpcName = ACTION_RPC[action.type];
        const { data, error } = await supabase.rpc(rpcName, action.payload);
        if (error) throw error;

        const result = data as RpcResult;
        touchedNetStatus = true;

        if (result.status === "conflict") {
          await offlineDb.pendingActions.update(action.id, {
            status: "conflict",
            error: result.message,
          });
          touchedConflicts = true;
        } else {
          await offlineDb.pendingActions.delete(action.id);
        }
      } catch (err: unknown) {
        const isServerRejection =
          typeof err === "object" && err !== null && "code" in err;

        if (isServerRejection) {
          // The database actually rejected this — retrying the exact same
          // request will just fail again. Leave it visible as failed
          // rather than silently retrying forever.
          await offlineDb.pendingActions.update(action.id, {
            status: "failed",
            retryCount: action.retryCount + 1,
            error: err instanceof Error ? err.message : "The database rejected this action.",
          });
        } else {
          // Most likely a dropped connection. Put it back as pending and
          // stop for this pass — we're probably offline again.
          await offlineDb.pendingActions.update(action.id, {
            status: "pending",
            retryCount: action.retryCount + 1,
          });
          break;
        }
      }
    }

    if (touchedNetStatus) {
      queryClient.invalidateQueries({ queryKey: ["net-status"] });
      queryClient.invalidateQueries({ queryKey: ["cage-current"] });
      queryClient.invalidateQueries({ queryKey: ["net-events"] });
    }
    if (touchedConflicts) {
      queryClient.invalidateQueries({ queryKey: ["unacknowledged-conflicts"] });
    }
  } finally {
    syncInFlight = false;
  }
}
