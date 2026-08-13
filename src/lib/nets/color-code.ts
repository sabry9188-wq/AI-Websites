import type { ColorCode } from "@/types/database";

/** Mirrors the color thresholds in `v_net_status` (supabase/schema.sql) —
 * used only for the brief optimistic-UI window before a real refetch
 * replaces it with the server's own computed value. */
export function colorCodeFromDaysLeft(daysLeft: number): ColorCode {
  if (daysLeft < 0) return "red";
  if (daysLeft <= 6) return "orange";
  if (daysLeft <= 15) return "yellow";
  return "green";
}
