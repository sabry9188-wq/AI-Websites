import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NetStatus } from "@/types/database";

const STATUS_LABEL: Record<NetStatus, string> = {
  in_store: "In Store",
  installed: "Installed",
  washing: "Washing",
  repair: "Repair",
  ready: "Ready",
  scrapped: "Scrapped",
};

const STATUS_CLASSES: Record<NetStatus, string> = {
  in_store: "bg-muted text-muted-foreground border-transparent",
  installed:
    "bg-blue-100 text-blue-800 border-transparent dark:bg-blue-500/15 dark:text-blue-300",
  washing:
    "bg-cyan-100 text-cyan-800 border-transparent dark:bg-cyan-500/15 dark:text-cyan-300",
  repair:
    "bg-amber-100 text-amber-800 border-transparent dark:bg-amber-500/15 dark:text-amber-300",
  ready:
    "bg-emerald-100 text-emerald-800 border-transparent dark:bg-emerald-500/15 dark:text-emerald-300",
  scrapped:
    "bg-neutral-200 text-neutral-600 border-transparent dark:bg-neutral-800 dark:text-neutral-400",
};

export function StatusBadge({ status }: { status: NetStatus }) {
  return (
    <Badge className={cn("font-normal", STATUS_CLASSES[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
