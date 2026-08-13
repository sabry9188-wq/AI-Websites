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
import { useCreateCage } from "@/lib/mutations/use-settings-mutations";
import { useSites } from "@/lib/queries/use-lookups";

export function AddCageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: sites } = useSites();
  const createCage = useCreateCage();

  const [siteId, setSiteId] = useState("");
  const [cageNumber, setCageNumber] = useState("");
  const [diameter, setDiameter] = useState("");

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSiteId("");
      setCageNumber("");
      setDiameter("");
    }
  }, [open]);

  function handleSiteChange(value: string) {
    setSiteId(value);
    const site = sites?.find((s) => s.id === value);
    if (site) setDiameter(String(site.diameter_m));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const diameterValue = Number(diameter);
    if (!siteId || !cageNumber.trim() || !Number.isFinite(diameterValue) || diameterValue <= 0) {
      toast.error("Choose a site, enter a cage number, and a positive diameter");
      return;
    }

    try {
      await createCage.mutateAsync({
        site_id: siteId,
        cage_number: cageNumber.trim(),
        diameter_m: diameterValue,
      });
      toast.success(`Added cage ${cageNumber.trim()}`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't add cage", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Cage</DialogTitle>
        </DialogHeader>
        <form id="add-cage-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Site</Label>
            <Select value={siteId} onValueChange={(v) => v && handleSiteChange(v)}>
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
            <Label htmlFor="cage_number">Cage Number</Label>
            <Input
              id="cage_number"
              placeholder="e.g. C21"
              value={cageNumber}
              onChange={(e) => setCageNumber(e.target.value)}
              disabled={createCage.isPending}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cage_diameter">Diameter (m)</Label>
            <Input
              id="cage_diameter"
              type="number"
              min={1}
              step="0.5"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              disabled={createCage.isPending}
              required
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="add-cage-form" size="lg" disabled={createCage.isPending}>
            {createCage.isPending ? "Adding…" : "Add Cage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
