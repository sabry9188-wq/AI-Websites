"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/** Resolves next-themes' theme (including "system") to a plain boolean for
 * picking chart colors. Defaults to light until mounted, to avoid a
 * server/client mismatch. */
export function useIsDark() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted && resolvedTheme === "dark";
}
