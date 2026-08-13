"use client";

import { CagesSettings } from "@/components/settings/cages-settings";
import { MeshSettings } from "@/components/settings/mesh-settings";
import { SitesSettings } from "@/components/settings/sites-settings";
import { TeamSettings } from "@/components/settings/team-settings";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/lib/auth/use-profile";

export default function SettingsPage() {
  const { data: profile, isLoading } = useProfile();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-muted-foreground">
          Sites, cages, mesh sizes, and staff roles — administrators only.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : profile?.role !== "admin" ? (
        <Card>
          <CardHeader>
            <CardTitle>Admins only</CardTitle>
            <CardDescription>
              Ask an administrator if you need something changed here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Tabs defaultValue="team">
          <TabsList>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="cages">Cages</TabsTrigger>
            <TabsTrigger value="mesh">Mesh Sizes</TabsTrigger>
          </TabsList>
          <TabsContent value="team" className="mt-4">
            <TeamSettings />
          </TabsContent>
          <TabsContent value="sites" className="mt-4">
            <SitesSettings />
          </TabsContent>
          <TabsContent value="cages" className="mt-4">
            <CagesSettings />
          </TabsContent>
          <TabsContent value="mesh" className="mt-4">
            <MeshSettings />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
