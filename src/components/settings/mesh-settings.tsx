"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AddMeshOptionDialog } from "@/components/settings/add-mesh-option-dialog";
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
import { useDeleteMeshOption } from "@/lib/mutations/use-settings-mutations";
import { useMeshSizeOptions, useSites } from "@/lib/queries/use-lookups";
import type { MeshSizeOption, Site } from "@/types/database";

export function MeshSettings() {
  const { data: meshOptions, isLoading: meshLoading } = useMeshSizeOptions();
  const { data: sites, isLoading: sitesLoading } = useSites();
  const deleteMeshOption = useDeleteMeshOption();
  const [open, setOpen] = useState(false);

  const bySite = useMemo(() => {
    const map = new Map<string, MeshSizeOption[]>();
    for (const option of meshOptions ?? []) {
      const list = map.get(option.site_id) ?? [];
      list.push(option);
      map.set(option.site_id, list);
    }
    return map;
  }, [meshOptions]);

  async function handleDelete(option: MeshSizeOption) {
    const confirmed = window.confirm(
      `Remove ${option.mesh_size_mm} mm as a ${option.net_type === "cage_net" ? "cage net" : "guard net"} option? Existing nets already using this size are unaffected — this only changes what's offered when adding or installing a net.`
    );
    if (!confirmed) return;

    try {
      await deleteMeshOption.mutateAsync(option.id);
      toast.success("Removed");
    } catch (error) {
      toast.error("Couldn't remove mesh size", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const isLoading = meshLoading || sitesLoading;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Which mesh sizes staff can choose from, per site and net type.
        </p>
        <Button size="lg" onClick={() => setOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          Add Mesh Size
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
                    <TableHead>Net Type</TableHead>
                    <TableHead>Mesh Size</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(bySite.get(site.id) ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                        No mesh sizes configured yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bySite
                      .get(site.id)
                      ?.slice()
                      .sort((a, b) => a.net_type.localeCompare(b.net_type) || a.mesh_size_mm - b.mesh_size_mm)
                      .map((option) => (
                        <TableRow key={option.id}>
                          <TableCell>
                            {option.net_type === "cage_net" ? "Cage Net" : "Guard Net"}
                          </TableCell>
                          <TableCell className="font-medium">{option.mesh_size_mm} mm</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon-lg"
                              aria-label={`Remove ${option.mesh_size_mm} mm`}
                              onClick={() => handleDelete(option)}
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

      <AddMeshOptionDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
