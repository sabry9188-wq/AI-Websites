import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in a later phase</CardTitle>
          <CardDescription>
            Managing sites, cages, mesh sizes, and user roles from the app
            (instead of the Supabase dashboard) will live here.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
