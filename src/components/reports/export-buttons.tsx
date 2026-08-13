"use client";

import { FileSpreadsheet, FileText, Table2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { exportCsv, exportExcel, exportPdf, type ReportColumn } from "@/lib/export/export-data";

export function ExportButtons<T>({
  title,
  filename,
  columns,
  rows,
}: {
  title: string;
  filename: string;
  columns: ReportColumn<T>[];
  rows: T[];
}) {
  const disabled = rows.length === 0;

  async function handleExcel() {
    try {
      await exportExcel(filename, title, columns, rows);
    } catch (error) {
      toast.error("Couldn't export Excel file", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => exportCsv(filename, columns, rows)}
      >
        <Table2 className="size-4" />
        CSV
      </Button>
      <Button variant="outline" size="sm" disabled={disabled} onClick={handleExcel}>
        <FileSpreadsheet className="size-4" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => exportPdf(title, filename, columns, rows)}
      >
        <FileText className="size-4" />
        PDF
      </Button>
    </div>
  );
}
