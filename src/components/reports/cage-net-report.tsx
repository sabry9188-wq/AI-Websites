"use client";

import { useMemo } from "react";

import { ExportButtons } from "@/components/reports/export-buttons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { ReportColumn } from "@/lib/export/export-data";
import { useCageCurrent } from "@/lib/queries/use-cage-current";
import { useNetStatus } from "@/lib/queries/use-net-status";

interface CageNetRow {
  cage_number: string;
  site_name: string;
  cage_net_number: string | null;
  cage_net_mesh: number | null;
  cage_net_date_in: string | null;
  guard_net_number: string | null;
  guard_net_mesh: number | null;
  guard_net_date_in: string | null;
  fully_stocked: boolean;
}

const columns: ReportColumn<CageNetRow>[] = [
  { header: "Cage", accessor: (r) => r.cage_number },
  { header: "Site", accessor: (r) => r.site_name },
  { header: "Cage Net", accessor: (r) => r.cage_net_number ?? "—" },
  { header: "Cage Net Mesh", accessor: (r) => r.cage_net_mesh ?? "" },
  { header: "Cage Net Date In", accessor: (r) => formatDate(r.cage_net_date_in) },
  { header: "Guard Net", accessor: (r) => r.guard_net_number ?? "—" },
  { header: "Guard Net Mesh", accessor: (r) => r.guard_net_mesh ?? "" },
  { header: "Guard Net Date In", accessor: (r) => formatDate(r.guard_net_date_in) },
  { header: "Fully Stocked", accessor: (r) => (r.fully_stocked ? "Yes" : "No") },
];

export function CageNetReport() {
  const { data: cages, isLoading: cagesLoading } = useCageCurrent();
  const { data: nets, isLoading: netsLoading } = useNetStatus();
  const isLoading = cagesLoading || netsLoading;

  const rows = useMemo<CageNetRow[]>(() => {
    const meshByNetId = new Map((nets ?? []).map((n) => [n.net_id, n.mesh_size_mm]));
    return (cages ?? []).map((cage) => ({
      cage_number: cage.cage_number,
      site_name: cage.site_name,
      cage_net_number: cage.cage_net_number,
      cage_net_mesh: cage.cage_net_id ? meshByNetId.get(cage.cage_net_id) ?? null : null,
      cage_net_date_in: cage.cage_net_date_in,
      guard_net_number: cage.guard_net_number,
      guard_net_mesh: cage.guard_net_id ? meshByNetId.get(cage.guard_net_id) ?? null : null,
      guard_net_date_in: cage.guard_net_date_in,
      fully_stocked: cage.has_cage_net && cage.has_guard_net,
    }));
  }, [cages, nets]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Every cage and the nets currently installed in it.
        </p>
        <ExportButtons
          title="Cage Net Report"
          filename="cage-net-report"
          columns={columns}
          rows={rows}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.header}>{c.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.header}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No cages found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.cage_number}>
                  {columns.map((c) => (
                    <TableCell key={c.header}>{c.accessor(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
