"use client";

import { useState } from "react";

import { ChangeStatusDialog } from "@/components/nets/change-status-dialog";
import { HoleCountDialog } from "@/components/nets/hole-count-dialog";
import { InstallNetDialog } from "@/components/nets/install-net-dialog";
import { NetFormSheet } from "@/components/nets/net-form-sheet";
import { NetHistorySheet } from "@/components/nets/net-history-sheet";
import { NetRegisterTable } from "@/components/nets/net-register-table";
import type { NetActionType } from "@/components/nets/net-row-actions";
import { RemoveNetDialog } from "@/components/nets/remove-net-dialog";
import { ScrapNetDialog } from "@/components/nets/scrap-net-dialog";
import type { NetStatusView } from "@/types/database";

export default function NetRegisterPage() {
  const [activeAction, setActiveAction] = useState<NetActionType | null>(null);
  const [activeNet, setActiveNet] = useState<NetStatusView | null>(null);

  function handleAction(type: NetActionType, net: NetStatusView) {
    setActiveNet(net);
    setActiveAction(type);
  }

  function handleAddNet() {
    setActiveNet(null);
    setActiveAction("edit");
  }

  function closeAction() {
    setActiveAction(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Net Register</h1>
        <p className="text-muted-foreground">
          Every net in the system, with its live status and days in water.
        </p>
      </div>

      <NetRegisterTable onAddNet={handleAddNet} onAction={handleAction} />

      <NetFormSheet
        open={activeAction === "edit"}
        onOpenChange={(open) => !open && closeAction()}
        net={activeNet}
      />
      <InstallNetDialog
        net={activeNet}
        open={activeAction === "install"}
        onOpenChange={(open) => !open && closeAction()}
      />
      <RemoveNetDialog
        net={activeNet}
        open={activeAction === "remove"}
        onOpenChange={(open) => !open && closeAction()}
      />
      <HoleCountDialog
        net={activeNet}
        open={activeAction === "holeCount"}
        onOpenChange={(open) => !open && closeAction()}
      />
      <ChangeStatusDialog
        net={activeNet}
        open={activeAction === "changeStatus"}
        onOpenChange={(open) => !open && closeAction()}
      />
      <ScrapNetDialog
        net={activeNet}
        open={activeAction === "scrap"}
        onOpenChange={(open) => !open && closeAction()}
      />
      <NetHistorySheet
        net={activeNet}
        open={activeAction === "history"}
        onOpenChange={(open) => !open && closeAction()}
      />
    </div>
  );
}
