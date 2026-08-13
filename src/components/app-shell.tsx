"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { NavLinks } from "@/components/nav-links";
import { NavUser } from "@/components/nav-user";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SyncEngineProvider } from "@/components/offline/sync-engine-provider";
import { SyncStatusIndicator } from "@/components/offline/sync-status-indicator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <SyncEngineProvider>
      <div className="flex min-h-full flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
          <div className="flex h-16 items-center border-b border-sidebar-border px-5">
            <span className="text-lg font-semibold text-primary">netlog</span>
          </div>
          <NavLinks />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-64 bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-16 items-center border-b border-sidebar-border px-5">
              <span className="text-lg font-semibold text-primary">netlog</span>
            </div>
            <NavLinks onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <span className="text-lg font-semibold text-primary md:hidden">
              netlog
            </span>
            <div className="ml-auto flex items-center gap-2">
              <SyncStatusIndicator />
              <NotificationBell />
              <ThemeToggle />
              <NavUser />
            </div>
          </header>
          <main className="flex-1 bg-muted/30 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </SyncEngineProvider>
  );
}
