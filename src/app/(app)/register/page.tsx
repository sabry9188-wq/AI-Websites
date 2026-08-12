"use client";

import { useState } from "react";

import { NetFormSheet } from "@/components/nets/net-form-sheet";
import { NetRegisterTable } from "@/components/nets/net-register-table";
import type { NetStatusView } from "@/types/database";

export default function NetRegisterPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingNet, setEditingNet] = useState<NetStatusView | null>(null);

  function handleAddNet() {
    setEditingNet(null);
    setFormOpen(true);
  }

  function handleEditNet(net: NetStatusView) {
    setEditingNet(net);
    setFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Net Register</h1>
        <p className="text-muted-foreground">
          Every net in the system, with its live status and days in water.
        </p>
      </div>

      <NetRegisterTable onAddNet={handleAddNet} onEditNet={handleEditNet} />

      <NetFormSheet open={formOpen} onOpenChange={setFormOpen} net={editingNet} />
    </div>
  );
}
