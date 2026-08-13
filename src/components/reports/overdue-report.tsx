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
import { useNetStatus } from "@/lib/queries/use-net-status";
import type { NetStatusView } from "@/types/database";

const columns: ReportColumn<NetStatusView>[] = [
  { header: "Net Number", accessor: (n) => n.net_number },
  { header: "Type", accessor: (n) => (n.net_type === "cage_net" ? "Cage Net" : "Guard Net") },
  { header: "Cage", accessor: (n) => n.cage_number ?? "" },
  { header: "Site", accessor: (n) => n.site_name ?? "" },
  { header: "Date In", accessor: (n) => formatDate(n.date_in) },
  { header: "Days in Water", accessor: (n) => n.days_in_water ?? "" },
  { header: "Max Allowed Days", accessor: (n) => n.max_allowed_days_in_water },
  { header: "Days Overdue", accessor: (n) => Math.abs(n.days_left ?? 0) },
];

export function OverdueReport() {
  const { data: nets, isLoading } = useNetStatus();

  const overdue = useMemo(
    () => (nets ?? []).filter((n) => n.overdue).sort((a, b) => (a.days_left ?? 0) - (b.days_left ?? 0)),
    [nets]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {overdue.length} net{overdue.length === 1 ? "" : "s"} currently overdue for a
          change.
        </p>
        <ExportButtons
          title="Overdue Nets"
          filename="overdue-nets"
          columns={columns}
          rows={overdue}
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
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.header}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : overdue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Nothing overdue right now.
                </TableCell>
              </TableRow>
            ) : (
              overdue.map((net) => (
                <TableRow key={net.net_id}>
                  {columns.map((c) => (
                    <TableCell key={c.header} className={c.header === "Days Overdue" ? "font-medium text-destructive" : undefined}>
                      {c.accessor(net)}
                    </TableCell>
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
