"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useMeshSizeOptions } from "@/lib/queries/use-lookups";
import { useCreateNet, useEditNet } from "@/lib/mutations/use-net-mutations";
import type { NetStatusView, NetType } from "@/types/database";

const DEFAULT_MAX_DAYS = 60;

interface NetFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  net: NetStatusView | null;
}

export function NetFormSheet({ open, onOpenChange, net }: NetFormSheetProps) {
  const isEdit = net !== null;
  const { data: meshOptions } = useMeshSizeOptions();
  const createNet = useCreateNet();
  const editNet = useEditNet();

  const [netNumber, setNetNumber] = useState("");
  const [netType, setNetType] = useState<NetType>("cage_net");
  const [meshSize, setMeshSize] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [maxDays, setMaxDays] = useState(String(DEFAULT_MAX_DAYS));
  const [notes, setNotes] = useState("");
  const [manuallyFlagged, setManuallyFlagged] = useState(false);

  useEffect(() => {
    // Resets the form fields whenever the sheet opens (for a fresh "add"
    // or to load the net being edited) — the sheet itself stays mounted
    // between opens, so this can't be expressed as a plain state
    // initializer.
    if (!open) return;
    if (net) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNetNumber(net.net_number);
      setNetType(net.net_type);
      setMeshSize(String(net.mesh_size_mm));
      setDimensions(net.dimensions ?? "");
      setMaxDays(String(net.max_allowed_days_in_water));
      setNotes(net.notes ?? "");
      setManuallyFlagged(net.manually_flagged);
    } else {
      setNetNumber("");
      setNetType("cage_net");
      setMeshSize("");
      setDimensions("");
      setMaxDays(String(DEFAULT_MAX_DAYS));
      setNotes("");
      setManuallyFlagged(false);
    }
  }, [open, net]);

  const meshChoices = useMemo(() => {
    if (!meshOptions) return [];
    const sizes = meshOptions
      .filter((m) => m.net_type === netType)
      .map((m) => m.mesh_size_mm);
    return Array.from(new Set(sizes)).sort((a, b) => a - b);
  }, [meshOptions, netType]);

  function handleNetTypeChange(value: NetType) {
    setNetType(value);
    setMeshSize("");
  }

  const isPending = createNet.isPending || editNet.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!netNumber.trim()) {
      toast.error("Net number is required");
      return;
    }
    if (!meshSize) {
      toast.error("Choose a mesh size");
      return;
    }
    const days = Number(maxDays);
    if (!Number.isInteger(days) || days <= 0) {
      toast.error("Max allowed days must be a positive whole number");
      return;
    }

    try {
      if (isEdit && net) {
        await editNet.mutateAsync({
          net_id: net.net_id,
          net_number: netNumber.trim(),
          mesh_size_mm: Number(meshSize),
          dimensions: dimensions.trim() || null,
          max_allowed_days_in_water: days,
          notes: notes.trim() || null,
          manually_flagged: manuallyFlagged,
        });
        toast.success(`Updated ${netNumber.trim()}`);
      } else {
        await createNet.mutateAsync({
          net_number: netNumber.trim(),
          net_type: netType,
          mesh_size_mm: Number(meshSize),
          dimensions: dimensions.trim() || null,
          max_allowed_days_in_water: days,
          notes: notes.trim() || null,
        });
        toast.success(`Added ${netNumber.trim()} to the register`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(isEdit ? "Couldn't update net" : "Couldn't add net", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? `Edit ${net?.net_number}` : "Add a New Net"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this net's details. To install, remove, or change its status, use the register's actions instead."
              : "New nets start in the store. Install it into a cage once it's ready."}
          </SheetDescription>
        </SheetHeader>

        <form
          id="net-form"
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-2"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="net_number">Net Number</Label>
            <Input
              id="net_number"
              placeholder="e.g. N-014"
              value={netNumber}
              onChange={(e) => setNetNumber(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Net Type</Label>
            {isEdit ? (
              <p className="text-sm text-muted-foreground">
                {net?.net_type === "cage_net" ? "Cage Net" : "Guard Net"} (set when the
                net was created — can&apos;t be changed)
              </p>
            ) : (
              <Select value={netType} onValueChange={(v) => handleNetTypeChange(v as NetType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cage_net">Cage Net</SelectItem>
                  <SelectItem value="guard_net">Guard Net</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Mesh Size</Label>
            <Select
              value={meshSize}
              onValueChange={(v) => setMeshSize(v ?? "")}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a mesh size" />
              </SelectTrigger>
              <SelectContent>
                {meshChoices.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} mm
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dimensions">Dimensions</Label>
            <Input
              id="dimensions"
              placeholder="e.g. 20m x 5m"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="max_days">Max Allowed Days in Water</Label>
            <Input
              id="max_days"
              type="number"
              min={1}
              value={maxDays}
              onChange={(e) => setMaxDays(e.target.value)}
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Farm default is 60 days (2 months). Override for this net if needed.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
            />
          </div>

          {isEdit && (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={manuallyFlagged}
                onCheckedChange={(v) => setManuallyFlagged(v === true)}
                disabled={isPending}
              />
              <span>
                Manually flag as &quot;Change Required&quot;, regardless of days left or
                hole count
              </span>
            </label>
          )}
        </form>

        <SheetFooter>
          <Button type="submit" form="net-form" size="lg" disabled={isPending}>
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Net"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
