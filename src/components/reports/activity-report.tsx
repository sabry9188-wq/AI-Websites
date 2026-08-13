"use client";

import { useMemo, useState } from "react";

import { ExportButtons } from "@/components/reports/export-buttons";
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
import { formatDateTime } from "@/lib/format";
import { gstToday } from "@/lib/gst-date";
import { ACTION_LABEL } from "@/lib/nets/action-labels";
import { useActivityEvents, type ActivityEvent } from "@/lib/queries/use-activity-events";
import type { ReportColumn } from "@/lib/export/export-data";

type Period = "daily" | "weekly" | "monthly";

const PERIOD_ITEMS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function getRange(period: Period, refDate: string) {
  const from = new Date(refDate + "T00:00:00");
  const to = new Date(from);

  if (period === "daily") {
    to.setDate(to.getDate() + 1);
  } else if (period === "weekly") {
    from.setDate(from.getDate() - from.getDay());
    to.setTime(from.getTime());
    to.setDate(to.getDate() + 7);
  } else {
    from.setDate(1);
    to.setTime(from.getTime());
    to.setMonth(to.getMonth() + 1);
  }

  return { from, to };
}

function formatRangeLabel(period: Period, from: Date, to: Date) {
  const toDisplay = new Date(to.getTime() - 1);
  if (period === "daily") {
    return from.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }
  return `${from.toLocaleDateString(undefined, { day: "2-digit", month: "short" })} – ${toDisplay.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}`;
}

const columns: ReportColumn<ActivityEvent>[] = [
  { header: "Date/Time", accessor: (e) => formatDateTime(e.event_timestamp) },
  { header: "Net", accessor: (e) => e.nets?.net_number ?? "" },
  { header: "Action", accessor: (e) => ACTION_LABEL[e.action] },
  { header: "Cage", accessor: (e) => e.cages?.cage_number ?? "" },
  { header: "From", accessor: (e) => e.from_status?.replace("_", " ") ?? "" },
  { header: "To", accessor: (e) => e.to_status?.replace("_", " ") ?? "" },
  { header: "Hole Count", accessor: (e) => e.hole_count ?? "" },
  { header: "User", accessor: (e) => e.profiles?.full_name ?? "" },
  { header: "Comments", accessor: (e) => e.comments ?? "" },
];

export function ActivityReport() {
  const [period, setPeriod] = useState<Period>("daily");
  const [refDate, setRefDate] = useState(gstToday());

  const { from, to } = useMemo(() => getRange(period, refDate), [period, refDate]);
  const { data: events, isLoading } = useActivityEvents(from.toISOString(), to.toISOString());

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Period</Label>
          <Select
            items={PERIOD_ITEMS}
            value={period}
            onValueChange={(v) => setPeriod((v as Period) ?? "daily")}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Reference date</Label>
          <Input
            type="date"
            className="w-40"
            value={refDate}
            onChange={(e) => setRefDate(e.target.value)}
          />
        </div>
        <p className="pb-1.5 text-sm text-muted-foreground">
          {formatRangeLabel(period, from, to)}
        </p>
        <div className="ml-auto">
          <ExportButtons
            title={`${period[0].toUpperCase()}${period.slice(1)} Activity`}
            filename={`activity-${period}-${refDate}`}
            columns={columns}
            rows={events ?? []}
          />
        </div>
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
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((c) => (
                    <TableCell key={c.header}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !events || events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No activity in this period.
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  {columns.map((c) => (
                    <TableCell key={c.header}>{c.accessor(event)}</TableCell>
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
