"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { useCreateMeshOption } from "@/lib/mutations/use-settings-mutations";
import { useSites } from "@/lib/queries/use-lookups";
import type { NetType } from "@/types/database";

export function AddMeshOptionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: sites } = useSites();
  const createMeshOption = useCreateMeshOption();

  const [siteId, setSiteId] = useState("");
  const [netType, setNetType] = useState<NetType>("cage_net");
  const [meshSize, setMeshSize] = useState("");

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSiteId("");
      setNetType("cage_net");
      setMeshSize("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const meshValue = Number(meshSize);
    if (!siteId || !Number.isFinite(meshValue) || meshValue <= 0) {
      toast.error("Choose a site and enter a positive mesh size");
      return;
    }

    try {
      await createMeshOption.mutateAsync({ site_id: siteId, net_type: netType, mesh_size_mm: meshValue });
      toast.success(`Added ${meshValue} mm`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't add mesh size", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Mesh Size</DialogTitle>
        </DialogHeader>
        <form id="add-mesh-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Site</Label>
            <Select value={siteId} onValueChange={(v) => setSiteId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a site" />
              </SelectTrigger>
              <SelectContent>
                {sites?.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Net Type</Label>
            <Select value={netType} onValueChange={(v) => setNetType((v as NetType) ?? "cage_net")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cage_net">Cage Net</SelectItem>
                <SelectItem value="guard_net">Guard Net</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mesh_size">Mesh Size (mm)</Label>
            <Input
              id="mesh_size"
              type="number"
              min={1}
              step="0.5"
              value={meshSize}
              onChange={(e) => setMeshSize(e.target.value)}
              disabled={createMeshOption.isPending}
              required
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="add-mesh-form" size="lg" disabled={createMeshOption.isPending}>
            {createMeshOption.isPending ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
