"use client";

import { AlertTriangle, CloudOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { usePendingActions } from "@/lib/offline/use-pending-actions";
import { useUnacknowledgedConflicts } from "@/lib/queries/use-unacknowledged-conflicts";

export function SyncStatusIndicator() {
  const pending = usePendingActions();
  const { data: conflicts } = useUnacknowledgedConflicts();
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

  const conflictCount = conflicts?.length ?? 0;
  const queuedCount =
    pending?.filter((a) => a.status === "pending" || a.status === "syncing" || a.status === "failed")
      .length ?? 0;

  if (conflictCount > 0) {
    return (
      <Link href="/needs-attention">
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="size-3.5" />
          {conflictCount} need{conflictCount === 1 ? "s" : ""} attention
        </Badge>
      </Link>
    );
  }

  if (!isOnline) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CloudOff className="size-3.5" />
        Offline{queuedCount > 0 ? ` · ${queuedCount} waiting` : ""}
      </Badge>
    );
  }

  if (queuedCount > 0) {
    return (
      <Badge variant="secondary" className="gap-1">
        <RefreshCw className="size-3.5 animate-spin" />
        Syncing {queuedCount}
      </Badge>
    );
  }

  return null;
}
