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
import { useScrapNet } from "@/lib/mutations/use-lifecycle-mutations";
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
  const scrapNet = useScrapNet();
  const [comments, setComments] = useState("");

  async function handleConfirm() {
    if (!net) return;
    try {
      await scrapNet.mutateAsync({ net_id: net.net_id, comments: comments.trim() || null });
      toast.success(`Scrapped ${net.net_number}`);
      setComments("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't scrap net", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
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
            disabled={scrapNet.isPending}
          >
            {scrapNet.isPending ? "Scrapping…" : "Scrap Net"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
