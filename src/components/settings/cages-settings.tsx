"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AddCageDialog } from "@/components/settings/add-cage-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeleteCage } from "@/lib/mutations/use-settings-mutations";
import { useCages, useSites } from "@/lib/queries/use-lookups";
import type { Cage, Site } from "@/types/database";

export function CagesSettings() {
  const { data: cages, isLoading: cagesLoading } = useCages();
  const { data: sites, isLoading: sitesLoading } = useSites();
  const deleteCage = useDeleteCage();
  const [open, setOpen] = useState(false);

  const bySite = useMemo(() => {
    const map = new Map<string, Cage[]>();
    for (const cage of cages ?? []) {
      const list = map.get(cage.site_id) ?? [];
      list.push(cage);
      map.set(cage.site_id, list);
    }
    return map;
  }, [cages]);

  async function handleDelete(cage: Cage) {
    const confirmed = window.confirm(
      `Delete cage ${cage.cage_number}? This only works if it has never had a net installed in it.`
    );
    if (!confirmed) return;

    try {
      await deleteCage.mutateAsync(cage.id);
      toast.success(`Deleted ${cage.cage_number}`);
    } catch (error) {
      toast.error("Couldn't delete cage", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const isLoading = cagesLoading || sitesLoading;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Every cage staff can pick from.</p>
        <Button size="lg" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          Add Cage
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        (sites ?? []).map((site: Site) => (
          <div key={site.id} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{site.name}</h3>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cage Number</TableHead>
                    <TableHead>Diameter</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(bySite.get(site.id) ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                        No cages at this site yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bySite.get(site.id)?.map((cage) => (
                      <TableRow key={cage.id}>
                        <TableCell className="font-medium">{cage.cage_number}</TableCell>
                        <TableCell>{cage.diameter_m} m</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon-lg"
                            aria-label={`Delete ${cage.cage_number}`}
                            onClick={() => handleDelete(cage)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ))
      )}

      <AddCageDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
