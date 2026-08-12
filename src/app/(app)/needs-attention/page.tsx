"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAcknowledgeConflict } from "@/lib/mutations/use-acknowledge-conflict";
import { useUnacknowledgedConflicts } from "@/lib/queries/use-unacknowledged-conflicts";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NeedsAttentionPage() {
  const { data: conflicts, isLoading } = useUnacknowledgedConflicts();
  const acknowledge = useAcknowledgeConflict();
  const [notes, setNotes] = useState<Record<string, string>>({});

  async function handleAcknowledge(eventId: string) {
    try {
      await acknowledge.mutateAsync({
        eventId,
        resolutionNotes: notes[eventId]?.trim() || null,
      });
      toast.success("Marked as reviewed");
    } catch (error) {
      toast.error("Couldn't acknowledge this", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Needs Attention</h1>
        <p className="text-muted-foreground">
          When two people install the same net (or the same cage slot) while offline,
          whoever syncs first wins automatically — this is where the other attempt shows
          up. Nothing is ever silently dropped or overwritten; a supervisor needs to
          check where the net actually is and clear it here.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !conflicts || conflicts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nothing needs attention right now.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {conflicts.map((conflict) => (
            <Card key={conflict.event_id} className="border-destructive/40">
              <CardHeader>
                <CardTitle>
                  Net {conflict.net_number} — install conflict
                </CardTitle>
                <CardDescription>
                  {conflict.user_full_name ?? "Someone"} tried to install this net
                  {conflict.cage_number ? ` into ${conflict.cage_number}` : ""} on{" "}
                  {formatTimestamp(conflict.event_timestamp)}, but it (or that cage slot)
                  had already been claimed by someone else&apos;s sync. Check the
                  net&apos;s current location in the register, then note what you did
                  and clear this.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="What did you find / do about it? (optional)"
                  rows={2}
                  value={notes[conflict.event_id] ?? ""}
                  onChange={(e) =>
                    setNotes((prev) => ({ ...prev, [conflict.event_id]: e.target.value }))
                  }
                />
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleAcknowledge(conflict.event_id)}
                  disabled={acknowledge.isPending}
                >
                  {acknowledge.isPending ? "Saving…" : "Mark as Reviewed"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
