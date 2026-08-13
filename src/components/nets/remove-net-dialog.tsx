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
import { Input } from "@/components/ui/input";
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

const DESTINATION_OPTIONS: { value: NetStatus; label: string }[] = [
  { value: "washing", label: "Washing" },
  { value: "repair", label: "Repair" },
  { value: "ready", label: "Ready" },
  { value: "in_store", label: "In Store" },
];

export function RemoveNetDialog({
  net,
  open,
  onOpenChange,
}: {
  net: NetStatusView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queueAction = useQueueNetAction();

  const [holeCount, setHoleCount] = useState("0");
  const [destination, setDestination] = useState<NetStatus>("washing");
  const [comments, setComments] = useState("");

  useEffect(() => {
    // Resets the form each time the dialog opens for a (possibly
    // different) net — the dialog stays mounted between opens.
    if (open && net) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHoleCount(String(net.hole_count));
      setDestination("washing");
      setComments("");
    }
  }, [open, net]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!net?.active_deployment_id) return;

    const count = Number(holeCount);
    if (!Number.isInteger(count) || count < 0) {
      toast.error("Hole count must be zero or a positive whole number");
      return;
    }
    if (net.active_deployment_id.startsWith("pending-")) {
      toast.error("This install hasn't finished syncing yet", {
        description: "Wait for it to sync (or get back online) before removing it.",
      });
      return;
    }

    await queueAction.mutateAsync({
      type: "remove",
      net,
      payload: {
        p_deployment_id: net.active_deployment_id,
        p_hole_count_at_removal: count,
        p_destination_status: destination,
        p_comments: comments.trim() || null,
      },
      optimisticPatch: {
        current_status: destination,
        active_deployment_id: null,
        cage_id: null,
        cage_number: null,
        site_id: null,
        site_name: null,
        date_in: null,
        days_in_water: null,
        days_left: null,
        overdue: false,
        hole_count: count,
        change_required: count > 10 || net.manually_flagged,
        color_code: null,
      },
    });

    toast.success(`Remove queued for ${net.net_number}`, {
      description: "Syncs automatically — instantly if you're online.",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove {net?.net_number}</DialogTitle>
          <DialogDescription>
            Currently in cage {net?.cage_number}. Record its hole count and where
            it&apos;s going next.
          </DialogDescription>
        </DialogHeader>

        <form
          id="remove-net-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hole_count">Hole Count</Label>
            <Input
              id="hole_count"
              type="number"
              min={0}
              inputMode="numeric"
              value={holeCount}
              onChange={(e) => setHoleCount(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Destination Status</Label>
            <Select
              value={destination}
              onValueChange={(v) => setDestination((v as NetStatus) ?? "washing")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DESTINATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="remove_comments">Comments</Label>
            <Textarea
              id="remove_comments"
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form="remove-net-form" size="lg" disabled={queueAction.isPending}>
            {queueAction.isPending ? "Queuing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
