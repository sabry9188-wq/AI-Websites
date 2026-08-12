"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { syncPendingActions } from "@/lib/offline/sync-engine";

const SYNC_INTERVAL_MS = 30_000;

/** Drains the offline queue whenever there's a real chance of success:
 * on load, when the browser regains a connection, when the app is brought
 * back to the foreground, and periodically while it's open. This — not any
 * background-sync magic — is what makes syncing reliable across both
 * Android and iPhone. */
export function SyncEngineProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    void syncPendingActions(queryClient);

    function handleOnline() {
      void syncPendingActions(queryClient);
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        void syncPendingActions(queryClient);
      }
    }

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibility);
    const interval = setInterval(() => void syncPendingActions(queryClient), SYNC_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [queryClient]);

  return <>{children}</>;
}
