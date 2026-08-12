import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NetRegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Net Register</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in Phase 2</CardTitle>
          <CardDescription>
            The sortable, filterable, color-coded net register — plus adding
            and editing nets — is built in the next phase.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
