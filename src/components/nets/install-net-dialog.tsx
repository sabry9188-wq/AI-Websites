"use client";

import { useMemo, useState } from "react";
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
import { useCageCurrent } from "@/lib/queries/use-cage-current";
import { useCages, useMeshSizeOptions, useSites } from "@/lib/queries/use-lookups";
import type { NetStatusView } from "@/types/database";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function InstallNetDialog({
  net,
  open,
  onOpenChange,
}: {
  net: NetStatusView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: cages } = useCages();
  const { data: sites } = useSites();
  const { data: meshOptions } = useMeshSizeOptions();
  const { data: cageCurrent } = useCageCurrent();
  const queueAction = useQueueNetAction();

  const [cageId, setCageId] = useState("");
  const [dateIn, setDateIn] = useState(today);
  const [comments, setComments] = useState("");

  const eligibleCages = useMemo(() => {
    if (!cages || !meshOptions || !cageCurrent || !net) return [];
    const validSiteIds = new Set(
      meshOptions
        .filter((m) => m.net_type === net.net_type && m.mesh_size_mm === net.mesh_size_mm)
        .map((m) => m.site_id)
    );
    const currentByCage = new Map(cageCurrent.map((c) => [c.cage_id, c]));
    return cages.filter((cage) => {
      if (!validSiteIds.has(cage.site_id)) return false;
      const current = currentByCage.get(cage.id);
      if (!current) return true;
      return net.net_type === "cage_net" ? !current.has_cage_net : !current.has_guard_net;
    });
  }, [cages, meshOptions, cageCurrent, net]);

  function reset() {
    setCageId("");
    setDateIn(today());
    setComments("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!net) return;
    if (!cageId) {
      toast.error("Choose a cage");
      return;
    }

    const cage = cages?.find((c) => c.id === cageId);
    const site = sites?.find((s) => s.id === cage?.site_id);
    if (!cage || !site) return;

    await queueAction.mutateAsync({
      type: "install",
      net,
      payload: {
        p_net_id: net.net_id,
        p_cage_id: cageId,
        p_date_in: dateIn,
        p_comments: comments.trim() || null,
      },
      optimisticPatch: {
        current_status: "installed",
        active_deployment_id: `pending-${net.net_id}`,
        cage_id: cageId,
        cage_number: cage.cage_number,
        site_id: site.id,
        site_name: site.name,
        date_in: dateIn,
        days_in_water: 0,
        days_left: net.max_allowed_days_in_water,
        overdue: false,
        change_required: net.hole_count > 10 || net.manually_flagged,
        color_code: "green",
      },
    });

    toast.success(`Install queued for ${net.net_number}`, {
      description: "Syncs automatically — instantly if you're online.",
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install {net?.net_number}</DialogTitle>
          <DialogDescription>
            Only cages with a compatible, empty {net?.net_type === "guard_net" ? "guard net" : "cage net"} slot are
            listed.
          </DialogDescription>
        </DialogHeader>

        <form
          id="install-net-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label>Cage</Label>
            <Select value={cageId} onValueChange={(v) => setCageId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a cage" />
              </SelectTrigger>
              <SelectContent>
                {eligibleCages.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No eligible cages right now
                  </div>
                ) : (
                  eligibleCages.map((cage) => (
                    <SelectItem key={cage.id} value={cage.id}>
                      {cage.cage_number}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date_in">Date In</Label>
            <Input
              id="date_in"
              type="date"
              max={today()}
              value={dateIn}
              onChange={(e) => setDateIn(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="install_comments">Comments</Label>
            <Textarea
              id="install_comments"
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="install-net-form"
            disabled={queueAction.isPending || eligibleCages.length === 0}
          >
            {queueAction.isPending ? "Queuing…" : "Install"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
