"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { ColorDot } from "@/components/nets/color-dot";
import { NetRowActions, type NetActionType } from "@/components/nets/net-row-actions";
import { StatusBadge } from "@/components/nets/status-badge";
import { formatDate } from "@/lib/format";
import type { NetStatusView } from "@/types/database";

export function buildNetColumns(
  onAction: (type: NetActionType, net: NetStatusView) => void
): ColumnDef<NetStatusView>[] {
  return [
    {
      accessorKey: "net_number",
      header: "Net Number",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.net_number}</span>
      ),
    },
    {
      accessorKey: "net_type",
      header: "Type",
      cell: ({ row }) =>
        row.original.net_type === "cage_net" ? "Cage Net" : "Guard Net",
    },
    {
      accessorKey: "mesh_size_mm",
      header: "Mesh",
      cell: ({ row }) => `${row.original.mesh_size_mm} mm`,
    },
    {
      id: "location",
      header: "Cage",
      accessorFn: (row) =>
        row.cage_number ? `${row.site_name} · ${row.cage_number}` : "",
      cell: ({ row }) =>
        row.original.cage_number ? (
          <span>
            {row.original.cage_number}
            <span className="text-muted-foreground"> ({row.original.site_name})</span>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "current_status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.current_status} />,
    },
    {
      accessorKey: "date_in",
      header: "Date In",
      cell: ({ row }) => formatDate(row.original.date_in),
    },
    {
      accessorKey: "days_in_water",
      header: "Days in Water",
      cell: ({ row }) => row.original.days_in_water ?? "—",
    },
    {
      accessorKey: "days_left",
      header: "Days Left",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ColorDot color={row.original.color_code} />
          <span>{row.original.days_left ?? "—"}</span>
        </div>
      ),
    },
    {
      accessorKey: "hole_count",
      header: "Holes",
      cell: ({ row }) => (
        <span
          className={
            row.original.hole_count > 10
              ? "font-medium text-destructive"
              : undefined
          }
        >
          {row.original.hole_count}
        </span>
      ),
    },
    {
      accessorKey: "change_required",
      header: "Change Required",
      cell: ({ row }) =>
        row.original.change_required ? (
          <span className="text-sm font-medium text-destructive">Yes</span>
        ) : (
          <span className="text-sm text-muted-foreground">No</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <NetRowActions net={row.original} onAction={onAction} />,
    },
  ];
}
