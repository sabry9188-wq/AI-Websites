"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQueueNetAction } from "@/lib/mutations/use-lifecycle-mutations";
import type { NetStatusView } from "@/types/database";

export function ScrapNetDialog({
  net,
  open,
  onOpenChange,
}: {
  net: NetStatusView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queueAction = useQueueNetAction();
  const [comments, setComments] = useState("");

  async function handleConfirm() {
    if (!net) return;

    await queueAction.mutateAsync({
      type: "scrap",
      net,
      payload: {
        p_net_id: net.net_id,
        p_comments: comments.trim() || null,
      },
      optimisticPatch: { current_status: "scrapped" },
    });

    toast.success(`Scrap queued for ${net.net_number}`, {
      description: "Syncs automatically — instantly if you're online.",
    });
    setComments("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scrap {net?.net_number}?</DialogTitle>
          <DialogDescription>
            This permanently retires the net from service. It stays visible in reports
            and history, but hidden from the register by default. This can&apos;t be
            undone from the app.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="scrap_comments">Reason (optional)</Label>
          <Textarea
            id="scrap_comments"
            rows={2}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={queueAction.isPending}
          >
            {queueAction.isPending ? "Queuing…" : "Scrap Net"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
