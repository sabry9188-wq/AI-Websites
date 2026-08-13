"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { createClient } from "@/lib/supabase/client";
import { useNetStatus } from "@/lib/queries/use-net-status";

const REPAIR_STUCK_DAYS = 14;

export type NotificationCategory = "overdue" | "due_soon" | "excessive_holes" | "stuck_in_repair";

export interface Notification {
  category: NotificationCategory;
  netId: string;
  netNumber: string;
  detail: string;
}

/** When a net most recently entered "repair" status, for nets currently in
 * repair — used to flag ones stuck there too long. */
function useRepairSince(repairNetIds: string[]) {
  const supabase = createClient();
  const key = [...repairNetIds].sort().join(",");

  return useQuery({
    queryKey: ["repair-since", key],
    enabled: repairNetIds.length > 0,
    queryFn: async (): Promise<Map<string, string>> => {
      const { data, error } = await supabase
        .from("net_events")
        .select("net_id, event_timestamp")
        .in("net_id", repairNetIds)
        .eq("to_status", "repair")
        .order("event_timestamp", { ascending: false });
      if (error) throw error;

      const latest = new Map<string, string>();
      for (const row of data) {
        if (!latest.has(row.net_id)) latest.set(row.net_id, row.event_timestamp);
      }
      return latest;
    },
  });
}

export function useNotifications() {
  const { data: nets, isLoading: netsLoading } = useNetStatus();

  const repairNetIds = useMemo(
    () => (nets ?? []).filter((n) => n.current_status === "repair").map((n) => n.net_id),
    [nets]
  );
  const { data: repairSince, isLoading: repairLoading } = useRepairSince(repairNetIds);

  // "Days since repair started" inherently needs wall-clock time — there's
  // no pure way to express it. Values simply refresh on the next render.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const notifications = useMemo<Notification[]>(() => {
    if (!nets) return [];
    const list: Notification[] = [];

    for (const net of nets) {
      if (net.overdue) {
        list.push({
          category: "overdue",
          netId: net.net_id,
          netNumber: net.net_number,
          detail: `${Math.abs(net.days_left ?? 0)} day(s) overdue`,
        });
      } else if (net.days_left !== null && net.days_left >= 0 && net.days_left <= 7) {
        list.push({
          category: "due_soon",
          netId: net.net_id,
          netNumber: net.net_number,
          detail: `${net.days_left} day(s) left`,
        });
      }

      if (net.hole_count > 10) {
        list.push({
          category: "excessive_holes",
          netId: net.net_id,
          netNumber: net.net_number,
          detail: `${net.hole_count} holes`,
        });
      }

      if (net.current_status === "repair") {
        const since = repairSince?.get(net.net_id);
        if (since) {
          const days = Math.floor((now - new Date(since).getTime()) / 86_400_000);
          if (days >= REPAIR_STUCK_DAYS) {
            list.push({
              category: "stuck_in_repair",
              netId: net.net_id,
              netNumber: net.net_number,
              detail: `${days} days in repair`,
            });
          }
        }
      }
    }

    return list;
  }, [nets, repairSince, now]);

  return { notifications, isLoading: netsLoading || repairLoading };
}
