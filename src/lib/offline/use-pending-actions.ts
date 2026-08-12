"use client";

import { useLiveQuery } from "dexie-react-hooks";

import { offlineDb } from "@/lib/offline/db";

/** Reactively reflects the local write queue — updates instantly as
 * actions are queued, synced, or run into a conflict. */
export function usePendingActions() {
  return useLiveQuery(() => offlineDb.pendingActions.orderBy("createdAt").toArray(), []);
}

export function usePendingActionsForNet(netId: string) {
  return useLiveQuery(
    () => offlineDb.pendingActions.where("netId").equals(netId).toArray(),
    [netId]
  );
}
