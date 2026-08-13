"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueueNetAction } from "@/lib/mutations/use-lifecycle-mutations";
import type { NetStatus, NetStatusView } from "@/types/database";

const STATUS_OPTIONS: { value: NetStatus; label: string }[] = [
  { value: "in_store", label: "In Store" },
  { value: "washing", label: "Washing" },
  { value: "repair", label: "Repair" },
  { value: "ready", label: "Ready" },
];

export function ChangeStatusDialog({
  net,
  open,
  onOpenChange,
}: {
  net: NetStatusView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queueAction = useQueueNetAction();
  const [toStatus, setToStatus] = useState<NetStatus>("washing");
  const [comments, setComments] = useState("");

  useEffect(() => {
    // Resets the form each time the dialog opens — it stays mounted
    // between opens.
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToStatus("washing");
      setComments("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!net) return;

    await queueAction.mutateAsync({
      type: "changeStatus",
      net,
      payload: {
        p_net_id: net.net_id,
        p_to_status: toStatus,
        p_comments: comments.trim() || null,
      },
      optimisticPatch: { current_status: toStatus },
    });

    toast.success(`Status change queued for ${net.net_number}`, {
      description: "Syncs automatically — instantly if you're online.",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Status — {net?.net_number}</DialogTitle>
          <DialogDescription>Currently: {net?.current_status.replace("_", " ")}</DialogDescription>
        </DialogHeader>

        <form
          id="change-status-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label>New Status</Label>
            <Select
              items={STATUS_OPTIONS}
              value={toStatus}
              onValueChange={(v) => setToStatus((v as NetStatus) ?? "washing")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.filter((opt) => opt.value !== net?.current_status).map(
                  (opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status_comments">Comments</Label>
            <Textarea
              id="status_comments"
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form="change-status-form" size="lg" disabled={queueAction.isPending}>
            {queueAction.isPending ? "Queuing…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
