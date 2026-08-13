"use client";

import { History, MoreHorizontal } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfile } from "@/lib/auth/use-profile";
import type { NetStatusView } from "@/types/database";

export type NetActionType =
  | "edit"
  | "install"
  | "remove"
  | "holeCount"
  | "changeStatus"
  | "scrap"
  | "history";

export function NetRowActions({
  net,
  onAction,
}: {
  net: NetStatusView;
  onAction: (type: NetActionType, net: NetStatusView) => void;
}) {
  const { data: profile } = useProfile();

  if (!profile || profile.role === "viewer") {
    return (
      <button
        type="button"
        className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
        aria-label={`History for ${net.net_number}`}
        onClick={() => onAction("history", net)}
      >
        <History className="size-4" />
      </button>
    );
  }

  const isInstalled = net.current_status === "installed";
  const isScrapped = net.current_status === "scrapped";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={buttonVariants({ variant: "ghost", size: "icon-lg" })}
        aria-label={`Actions for ${net.net_number}`}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction("edit", net)}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("history", net)}>History</DropdownMenuItem>

        {!isScrapped && <DropdownMenuSeparator />}

        {!isInstalled && !isScrapped && (
          <DropdownMenuItem onClick={() => onAction("install", net)}>Install</DropdownMenuItem>
        )}
        {isInstalled && (
          <DropdownMenuItem onClick={() => onAction("remove", net)}>Remove</DropdownMenuItem>
        )}
        {!isScrapped && (
          <DropdownMenuItem onClick={() => onAction("holeCount", net)}>
            Update Hole Count
          </DropdownMenuItem>
        )}
        {!isInstalled && !isScrapped && (
          <DropdownMenuItem onClick={() => onAction("changeStatus", net)}>
            Change Status
          </DropdownMenuItem>
        )}

        {profile.role === "admin" && !isInstalled && !isScrapped && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => onAction("scrap", net)}>
              Scrap
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
