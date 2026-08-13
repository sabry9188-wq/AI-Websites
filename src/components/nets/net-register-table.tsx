"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { buildNetColumns } from "@/components/nets/net-columns";
import type { NetActionType } from "@/components/nets/net-row-actions";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCages } from "@/lib/queries/use-lookups";
import { useNetStatus } from "@/lib/queries/use-net-status";
import type { NetStatus, NetStatusView, NetType } from "@/types/database";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "active", label: "All (excl. scrapped)" },
  { value: "in_store", label: "In Store" },
  { value: "installed", label: "Installed" },
  { value: "washing", label: "Washing" },
  { value: "repair", label: "Repair" },
  { value: "ready", label: "Ready" },
  { value: "scrapped", label: "Scrapped" },
  { value: "all", label: "All (incl. scrapped)" },
];

export function NetRegisterTable({
  onAddNet,
  onAction,
}: {
  onAddNet: () => void;
  onAction: (type: NetActionType, net: NetStatusView) => void;
}) {
  const { data: nets, isLoading } = useNetStatus();
  const { data: cages } = useCages();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [netTypeFilter, setNetTypeFilter] = useState<"all" | NetType>("all");
  const [cageFilter, setCageFilter] = useState("all");
  const [minHoles, setMinHoles] = useState("");
  const [dueForChangeOnly, setDueForChangeOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [dateInFrom, setDateInFrom] = useState("");
  const [dateInTo, setDateInTo] = useState("");

  const filtered = useMemo(() => {
    if (!nets) return [];
    return nets.filter((net) => {
      if (statusFilter === "active" && net.current_status === "scrapped") return false;
      if (
        statusFilter !== "active" &&
        statusFilter !== "all" &&
        net.current_status !== (statusFilter as NetStatus)
      )
        return false;
      if (netTypeFilter !== "all" && net.net_type !== netTypeFilter) return false;
      if (cageFilter !== "all" && net.cage_id !== cageFilter) return false;
      if (minHoles && net.hole_count < Number(minHoles)) return false;
      if (dueForChangeOnly && !net.change_required) return false;
      if (overdueOnly && !net.overdue) return false;
      if (dateInFrom && (!net.date_in || net.date_in < dateInFrom)) return false;
      if (dateInTo && (!net.date_in || net.date_in > dateInTo)) return false;
      return true;
    });
  }, [
    nets,
    statusFilter,
    netTypeFilter,
    cageFilter,
    minHoles,
    dueForChangeOnly,
    overdueOnly,
    dateInFrom,
    dateInTo,
  ]);

  const columns = useMemo(() => buildNetColumns(onAction), [onAction]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
    globalFilterFn: (row, _columnId, filterValue) => {
      const net = row.original as NetStatusView;
      const haystack = `${net.net_number} ${net.cage_number ?? ""} ${net.notes ?? ""}`.toLowerCase();
      return haystack.includes(String(filterValue).toLowerCase());
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search net number, cage, notes…"
              className="pl-8"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
          <Button onClick={onAddNet} size="lg" className="gap-1.5">
            <Plus className="size-4" />
            Add Net
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "active")}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Net Type</Label>
            <Select
              value={netTypeFilter}
              onValueChange={(v) => setNetTypeFilter(v as "all" | NetType)}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="cage_net">Cage Net</SelectItem>
                <SelectItem value="guard_net">Guard Net</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Cage</Label>
            <Select value={cageFilter} onValueChange={(v) => setCageFilter(v ?? "all")}>
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cages</SelectItem>
                {cages?.map((cage) => (
                  <SelectItem key={cage.id} value={cage.id}>
                    {cage.cage_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Min holes</Label>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={minHoles}
              onChange={(e) => setMinHoles(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Installed from</Label>
            <Input
              type="date"
              value={dateInFrom}
              onChange={(e) => setDateInFrom(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Installed to</Label>
            <Input
              type="date"
              value={dateInTo}
              onChange={(e) => setDateInTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={dueForChangeOnly}
              onCheckedChange={(v) => setDueForChangeOnly(v === true)}
            />
            Due for change only
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={overdueOnly}
              onCheckedChange={(v) => setOverdueOnly(v === true)}
            />
            Overdue only
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortState = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="flex items-center gap-1 select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortState === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sortState === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No nets match these filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filtered.length} net{filtered.length === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
