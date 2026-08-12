import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 5</CardTitle>
          <CardDescription>
            Daily, weekly, monthly, net history, overdue, and cage net
            reports, with Excel/PDF/CSV export, arrive in Phase 5.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
