import Dexie, { type EntityTable } from "dexie";

export type PendingActionType =
  | "install"
  | "remove"
  | "holeCount"
  | "changeStatus"
  | "scrap";

export type PendingActionStatus = "pending" | "syncing" | "conflict" | "failed";

/** One queued write, waiting to reach the server. `id` doubles as the
 * idempotency key sent to the RPC (`p_client_generated_id`), so a retried
 * sync after a dropped connection can never be applied twice. */
export interface PendingAction {
  id: string;
  type: PendingActionType;
  netId: string;
  netNumber: string;
  payload: Record<string, unknown>;
  createdAt: string;
  status: PendingActionStatus;
  retryCount: number;
  error?: string;
}

export const offlineDb = new Dexie("netlog-offline") as Dexie & {
  pendingActions: EntityTable<PendingAction, "id">;
};

offlineDb.version(1).stores({
  pendingActions: "id, status, netId, createdAt",
});
