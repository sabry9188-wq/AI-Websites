"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useNetEvents } from "@/lib/queries/use-net-events";
import type { NetEventAction, NetStatusView } from "@/types/database";

const ACTION_LABEL: Record<NetEventAction, string> = {
  created: "Added to register",
  installed: "Installed",
  removed: "Removed",
  status_changed: "Status changed",
  hole_count_updated: "Hole count updated",
  edited: "Details edited",
  scrapped: "Scrapped",
  install_rejected_conflict: "Install attempt conflicted",
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NetHistorySheet({
  net,
  open,
  onOpenChange,
}: {
  net: NetStatusView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: events, isLoading } = useNetEvents(open ? net?.net_id ?? null : null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>History — {net?.net_number}</SheetTitle>
          <SheetDescription>
            The complete, permanent record for this net. Nothing here can be edited or
            deleted.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))
          ) : !events || events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <ol className="flex flex-col gap-4 border-l pl-4">
              {events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-primary" />
                  <p className="text-sm font-medium">
                    {ACTION_LABEL[event.action]}
                    {event.action === "install_rejected_conflict" && (
                      <span className="ml-2 text-xs font-normal text-destructive">
                        needs supervisor review
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(event.event_timestamp)}
                    {event.profiles?.full_name ? ` · ${event.profiles.full_name}` : ""}
                    {event.cages?.cage_number ? ` · ${event.cages.cage_number}` : ""}
                  </p>
                  {event.from_status && event.to_status && (
                    <p className="text-xs text-muted-foreground">
                      {event.from_status.replace("_", " ")} → {event.to_status.replace("_", " ")}
                    </p>
                  )}
                  {event.hole_count !== null && (
                    <p className="text-xs text-muted-foreground">
                      Hole count: {event.hole_count}
                    </p>
                  )}
                  {event.comments && <p className="text-sm">{event.comments}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
