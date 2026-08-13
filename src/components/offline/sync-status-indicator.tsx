"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CloudOff, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { discardAction, retryAction } from "@/lib/offline/sync-engine";
import { usePendingActions } from "@/lib/offline/use-pending-actions";
import { useUnacknowledgedConflicts } from "@/lib/queries/use-unacknowledged-conflicts";
import { cn } from "@/lib/utils";

function LocalStatusBadge({
  label,
  variant,
  clickable,
}: {
  label: React.ReactNode;
  variant: "destructive" | "secondary";
  clickable: boolean;
}) {
  return (
    <Badge variant={variant} className={cn("gap-1", clickable && "cursor-pointer")}>
      {label}
    </Badge>
  );
}

export function SyncStatusIndicator() {
  const pending = usePendingActions();
  const { data: serverConflicts } = useUnacknowledgedConflicts();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Browser-only values (navigator.onLine) can't be read during server
    // rendering without risking a hydration mismatch, so this is
    // deliberately set only after mount, once, here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setIsOnline(navigator.onLine);

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!mounted) return null;

  const serverConflictCount = serverConflicts?.length ?? 0;
  const waiting = pending?.filter((a) => a.status === "pending" || a.status === "syncing") ?? [];
  const failed = pending?.filter((a) => a.status === "failed") ?? [];
  const localConflicts = pending?.filter((a) => a.status === "conflict") ?? [];
  const hasActionable = failed.length > 0 || localConflicts.length > 0;

  let localBadge: React.ReactNode = null;
  if (failed.length > 0) {
    localBadge = (
      <LocalStatusBadge
        variant="destructive"
        clickable
        label={
          <>
            <AlertTriangle className="size-3.5" />
            {failed.length} failed
          </>
        }
      />
    );
  } else if (localConflicts.length > 0) {
    localBadge = (
      <LocalStatusBadge
        variant="destructive"
        clickable
        label={
          <>
            <AlertTriangle className="size-3.5" />
            {localConflicts.length} conflicted
          </>
        }
      />
    );
  } else if (!isOnline) {
    localBadge = (
      <LocalStatusBadge
        variant="secondary"
        clickable={false}
        label={
          <>
            <CloudOff className="size-3.5" />
            Offline{waiting.length > 0 ? ` · ${waiting.length} waiting` : ""}
          </>
        }
      />
    );
  } else if (waiting.length > 0) {
    localBadge = (
      <LocalStatusBadge
        variant="secondary"
        clickable={false}
        label={
          <>
            <RefreshCw className="size-3.5 animate-spin" />
            Syncing {waiting.length}
          </>
        }
      />
    );
  }

  return (
    <div className="flex items-center gap-2">
      {serverConflictCount > 0 && (
        <Link href="/needs-attention">
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="size-3.5" />
            {serverConflictCount} need{serverConflictCount === 1 ? "s" : ""} attention
          </Badge>
        </Link>
      )}

      {localBadge && hasActionable ? (
        <Popover>
          <PopoverTrigger className={cn(buttonVariants({ variant: "ghost" }), "h-auto p-0")}>
            {localBadge}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 max-h-96 overflow-y-auto">
            <p className="mb-2 text-sm font-medium">Sync status</p>
            <div className="flex flex-col gap-3">
              {failed.map((action) => (
                <div
                  key={action.id}
                  className="flex flex-col gap-1 rounded-md border border-destructive/30 p-2 text-sm"
                >
                  <p className="font-medium">
                    {action.netNumber} — {action.type}
                  </p>
                  <p className="text-xs text-muted-foreground">{action.error}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => retryAction(action.id, queryClient)}>
                      Retry
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => discardAction(action.id)}>
                      <X className="size-3.5" />
                      Discard
                    </Button>
                  </div>
                </div>
              ))}
              {localConflicts.map((action) => (
                <div
                  key={action.id}
                  className="flex flex-col gap-1 rounded-md border border-destructive/30 p-2 text-sm"
                >
                  <p className="font-medium">
                    {action.netNumber} — {action.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Conflicted with another sync. Review it on the{" "}
                    <Link href="/needs-attention" className="underline">
                      Needs Attention
                    </Link>{" "}
                    page, then discard it here.
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-fit"
                    onClick={() => discardAction(action.id)}
                  >
                    <X className="size-3.5" />
                    Discard
                  </Button>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        localBadge
      )}
    </div>
  );
}
