"use client";

import { Pencil, Plus } from "lucide-react";
import { useState } from "react";

import { SiteFormDialog } from "@/components/settings/site-form-dialog";
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
import { useSites } from "@/lib/queries/use-lookups";
import type { Site } from "@/types/database";

export function SitesSettings() {
  const { data: sites, isLoading } = useSites();
  const [open, setOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  function handleAdd() {
    setEditingSite(null);
    setOpen(true);
  }

  function handleEdit(site: Site) {
    setEditingSite(site);
    setOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          The farm locations nets and cages belong to.
        </p>
        <Button size="lg" onClick={handleAdd} className="gap-1.5">
          <Plus className="size-4" />
          Add Site
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Cage Diameter</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !sites || sites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No sites yet.
                </TableCell>
              </TableRow>
            ) : (
              sites.map((site) => (
                <TableRow key={site.id}>
                  <TableCell className="font-medium">{site.name}</TableCell>
                  <TableCell>{site.code}</TableCell>
                  <TableCell>{site.diameter_m} m</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-lg"
                      aria-label={`Edit ${site.name}`}
                      onClick={() => handleEdit(site)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SiteFormDialog site={editingSite} open={open} onOpenChange={setOpen} />
    </div>
  );
}
