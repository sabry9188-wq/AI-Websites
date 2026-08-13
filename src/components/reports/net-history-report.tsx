"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { ExportButtons } from "@/components/reports/export-buttons";
import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { ACTION_LABEL } from "@/lib/nets/action-labels";
import type { ReportColumn } from "@/lib/export/export-data";
import { useNetEvents, type NetEventWithNames } from "@/lib/queries/use-net-events";
import { useNetStatus } from "@/lib/queries/use-net-status";

const columns: ReportColumn<NetEventWithNames>[] = [
  { header: "Date/Time", accessor: (e) => formatDateTime(e.event_timestamp) },
  { header: "Action", accessor: (e) => ACTION_LABEL[e.action] },
  { header: "Cage", accessor: (e) => e.cages?.cage_number ?? "" },
  { header: "From", accessor: (e) => e.from_status?.replace("_", " ") ?? "" },
  { header: "To", accessor: (e) => e.to_status?.replace("_", " ") ?? "" },
  { header: "Hole Count", accessor: (e) => e.hole_count ?? "" },
  { header: "User", accessor: (e) => e.profiles?.full_name ?? "" },
  { header: "Comments", accessor: (e) => e.comments ?? "" },
];

export function NetHistoryReport() {
  const { data: nets } = useNetStatus();
  const [netId, setNetId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const { data: events, isLoading } = useNetEvents(netId);
  const selectedNet = nets?.find((n) => n.net_id === netId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            className={cn(buttonVariants({ variant: "outline" }), "w-56 justify-between")}
          >
            {selectedNet ? selectedNet.net_number : "Choose a net…"}
            <ChevronsUpDown className="size-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0">
            <Command>
              <CommandInput placeholder="Search net number…" />
              <CommandList>
                <CommandEmpty>No nets found.</CommandEmpty>
                <CommandGroup>
                  {nets?.map((net) => (
                    <CommandItem
                      key={net.net_id}
                      value={net.net_number}
                      onSelect={() => {
                        setNetId(net.net_id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-1",
                          net.net_id === netId ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {net.net_number}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {netId && (
          <ExportButtons
            title={`Net History — ${selectedNet?.net_number ?? ""}`}
            filename={`net-history-${selectedNet?.net_number ?? netId}`}
            columns={columns}
            rows={events ?? []}
          />
        )}
      </div>

      {!netId ? (
        <p className="text-sm text-muted-foreground">
          Pick a net above to see its full permanent history.
        </p>
      ) : (
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
              ) : !events || events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No history for this net yet.
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
      )}
    </div>
  );
}
