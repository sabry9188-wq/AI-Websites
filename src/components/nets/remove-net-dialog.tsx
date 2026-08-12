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
import { useRemoveNet } from "@/lib/mutations/use-lifecycle-mutations";
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
  const removeNet = useRemoveNet();

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

    try {
      await removeNet.mutateAsync({
        deployment_id: net.active_deployment_id,
        hole_count_at_removal: count,
        destination_status: destination,
        comments: comments.trim() || null,
      });
      toast.success(`Removed ${net.net_number} from ${net.cage_number}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't remove net", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
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
          <Button type="submit" form="remove-net-form" disabled={removeNet.isPending}>
            {removeNet.isPending ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
