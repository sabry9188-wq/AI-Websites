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
import { Textarea } from "@/components/ui/textarea";
import { useUpdateHoleCount } from "@/lib/mutations/use-lifecycle-mutations";
import type { NetStatusView } from "@/types/database";

export function HoleCountDialog({
  net,
  open,
  onOpenChange,
}: {
  net: NetStatusView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const updateHoleCount = useUpdateHoleCount();
  const [holeCount, setHoleCount] = useState("0");
  const [comments, setComments] = useState("");

  useEffect(() => {
    // Resets the form each time the dialog opens — it stays mounted
    // between opens.
    if (open && net) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHoleCount(String(net.hole_count));
      setComments("");
    }
  }, [open, net]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!net) return;

    const count = Number(holeCount);
    if (!Number.isInteger(count) || count < 0) {
      toast.error("Hole count must be zero or a positive whole number");
      return;
    }

    try {
      await updateHoleCount.mutateAsync({
        net_id: net.net_id,
        hole_count: count,
        comments: comments.trim() || null,
      });
      toast.success(`Updated hole count for ${net.net_number}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't update hole count", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Hole Count — {net?.net_number}</DialogTitle>
          <DialogDescription>
            Nets with more than 10 holes automatically show as needing a change.
          </DialogDescription>
        </DialogHeader>

        <form
          id="hole-count-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new_hole_count">Hole Count</Label>
            <Input
              id="new_hole_count"
              type="number"
              min={0}
              inputMode="numeric"
              value={holeCount}
              onChange={(e) => setHoleCount(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hole_count_comments">Comments</Label>
            <Textarea
              id="hole_count_comments"
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form="hole-count-form" disabled={updateHoleCount.isPending}>
            {updateHoleCount.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
