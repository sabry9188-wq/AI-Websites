"use client";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { useProfile } from "@/lib/auth/use-profile";
import { useUpdateProfileRole } from "@/lib/mutations/use-settings-mutations";
import { useProfiles } from "@/lib/queries/use-profiles";
import type { UserRole } from "@/types/database";

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "supervisor", label: "Supervisor" },
  { value: "viewer", label: "Viewer" },
];

export function TeamSettings() {
  const { data: currentProfile } = useProfile();
  const { data: profiles, isLoading } = useProfiles();
  const updateRole = useUpdateProfileRole();

  async function handleRoleChange(profileId: string, role: UserRole) {
    if (profileId === currentProfile?.id && role !== "admin") {
      const confirmed = window.confirm(
        "This changes your own account. If you're the only admin, you could lose access to admin-only actions like this one. Continue?"
      );
      if (!confirmed) return;
    }

    try {
      await updateRole.mutateAsync({ profileId, role });
      toast.success("Role updated");
    } catch (error) {
      toast.error("Couldn't update role", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Roles control what someone can do — Admin (full access, including scrap),
        Supervisor (day-to-day actions and reports), Viewer (read-only). New accounts
        are created in Supabase (see SETUP.md) and start as Viewer.
      </p>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={2}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !profiles || profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                  No accounts found.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    {profile.full_name}
                    {profile.id === currentProfile?.id && (
                      <Badge variant="secondary" className="ml-2">
                        You
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      items={ROLE_OPTIONS}
                      value={profile.role}
                      onValueChange={(v) => v && handleRoleChange(profile.id, v as UserRole)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
