"use client";

import { AlertTriangle, Bell, Clock, Droplets, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  type Notification,
  type NotificationCategory,
} from "@/lib/queries/use-notifications";

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: typeof AlertTriangle; className: string }
> = {
  overdue: { label: "Overdue", icon: AlertTriangle, className: "text-destructive" },
  due_soon: { label: "Due within 7 days", icon: Clock, className: "text-amber-600 dark:text-amber-400" },
  excessive_holes: { label: "Excessive holes", icon: Droplets, className: "text-amber-600 dark:text-amber-400" },
  stuck_in_repair: { label: "Stuck in repair", icon: Wrench, className: "text-amber-600 dark:text-amber-400" },
};

function groupByCategory(notifications: Notification[]) {
  const groups = new Map<NotificationCategory, Notification[]>();
  for (const n of notifications) {
    const list = groups.get(n.category) ?? [];
    list.push(n);
    groups.set(n.category, list);
  }
  return groups;
}

export function NotificationBell() {
  const { notifications, isLoading } = useNotifications();
  const groups = groupByCategory(notifications);

  return (
    <Popover>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: "ghost", size: "icon-lg" }), "relative")}
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {notifications.length > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
          >
            {notifications.length}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <p className="mb-2 text-sm font-medium">Notifications</p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing needs attention.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Array.from(groups.entries()).map(([category, items]) => {
              const meta = CATEGORY_META[category];
              return (
                <div key={category} className="flex flex-col gap-1">
                  <p className={cn("flex items-center gap-1.5 text-xs font-medium", meta.className)}>
                    <meta.icon className="size-3.5" />
                    {meta.label} ({items.length})
                  </p>
                  <ul className="flex flex-col gap-0.5 pl-5 text-sm">
                    {items.map((item) => (
                      <li key={`${item.category}-${item.netId}`} className="flex justify-between gap-2">
                        <span className="font-medium">{item.netNumber}</span>
                        <span className="text-muted-foreground">{item.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
