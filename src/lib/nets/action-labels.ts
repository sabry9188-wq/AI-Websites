import type { NetEventAction } from "@/types/database";

export const ACTION_LABEL: Record<NetEventAction, string> = {
  created: "Added to register",
  installed: "Installed",
  removed: "Removed",
  status_changed: "Status changed",
  hole_count_updated: "Hole count updated",
  edited: "Details edited",
  scrapped: "Scrapped",
  install_rejected_conflict: "Install attempt conflicted",
};
