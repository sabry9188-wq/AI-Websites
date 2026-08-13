"use client";

import { ActivityReport } from "@/components/reports/activity-report";
import { CageNetReport } from "@/components/reports/cage-net-report";
import { NetHistoryReport } from "@/components/reports/net-history-report";
import { OverdueReport } from "@/components/reports/overdue-report";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground">
          Export any report to Excel, PDF, or CSV.
        </p>
      </div>

      <Tabs defaultValue="activity">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="cage-net">Cage Net Report</TabsTrigger>
          <TabsTrigger value="net-history">Net History</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="mt-4">
          <ActivityReport />
        </TabsContent>
        <TabsContent value="overdue" className="mt-4">
          <OverdueReport />
        </TabsContent>
        <TabsContent value="cage-net" className="mt-4">
          <CageNetReport />
        </TabsContent>
        <TabsContent value="net-history" className="mt-4">
          <NetHistoryReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
