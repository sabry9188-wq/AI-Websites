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
import { useCreateSite, useUpdateSite } from "@/lib/mutations/use-settings-mutations";
import type { Site } from "@/types/database";

export function SiteFormDialog({
  site,
  open,
  onOpenChange,
}: {
  site: Site | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = site !== null;
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const isPending = createSite.isPending || updateSite.isPending;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [diameter, setDiameter] = useState("15");

  useEffect(() => {
    // Resets the form each time the dialog opens — it stays mounted
    // between opens.
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(site?.name ?? "");
      setCode(site?.code ?? "");
      setDiameter(site ? String(site.diameter_m) : "15");
    }
  }, [open, site]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const diameterValue = Number(diameter);
    if (!name.trim() || !code.trim() || !Number.isFinite(diameterValue) || diameterValue <= 0) {
      toast.error("Fill in a name, code, and a positive diameter");
      return;
    }

    try {
      if (isEdit) {
        await updateSite.mutateAsync({
          id: site.id,
          name: name.trim(),
          code: code.trim(),
          diameter_m: diameterValue,
        });
        toast.success(`Updated ${name.trim()}`);
      } else {
        await createSite.mutateAsync({
          name: name.trim(),
          code: code.trim(),
          diameter_m: diameterValue,
        });
        toast.success(`Added ${name.trim()}`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? "Couldn't update site" : "Couldn't add site", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${site?.name}` : "Add a Site"}</DialogTitle>
        </DialogHeader>
        <form id="site-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="site_name">Name</Label>
            <Input id="site_name" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="site_code">Code</Label>
            <Input id="site_code" value={code} onChange={(e) => setCode(e.target.value)} disabled={isPending} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="site_diameter">Standard Cage Diameter (m)</Label>
            <Input
              id="site_diameter"
              type="number"
              min={1}
              step="0.5"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              disabled={isPending}
              required
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="site-form" size="lg" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Site"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
