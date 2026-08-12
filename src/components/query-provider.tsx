"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState } from "react";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  );

  // Caches query results in localStorage so the app still has something to
  // show (the last data it saw) when opened with no signal at all. Only
  // available in the browser — server-side rendering falls back to a plain
  // provider with no persistence, which is harmless since there's nothing
  // to restore there anyway.
  const [persister] = useState(() =>
    typeof window !== "undefined"
      ? createSyncStoragePersister({ storage: window.localStorage, key: "netlog-query-cache" })
      : null
  );

  if (!persister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: ONE_DAY_MS }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
