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
import { useChangeStatus } from "@/lib/mutations/use-lifecycle-mutations";
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
  const changeStatus = useChangeStatus();
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

    try {
      await changeStatus.mutateAsync({
        net_id: net.net_id,
        to_status: toStatus,
        comments: comments.trim() || null,
      });
      toast.success(`${net.net_number} is now ${toStatus.replace("_", " ")}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't change status", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
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
          <Button type="submit" form="change-status-form" disabled={changeStatus.isPending}>
            {changeStatus.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
