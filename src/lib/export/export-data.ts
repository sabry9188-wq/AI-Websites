"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import writeXlsxFile from "write-excel-file/browser";

export interface ReportColumn<T> {
  header: string;
  width?: number;
  accessor: (row: T) => string | number;
}

function cellsToStrings<T>(columns: ReportColumn<T>[], rows: T[]) {
  return rows.map((row) => columns.map((c) => String(c.accessor(row) ?? "")));
}

export function exportCsv<T>(filename: string, columns: ReportColumn<T>[], rows: T[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const header = columns.map((c) => escape(c.header)).join(",");
  const lines = cellsToStrings(columns, rows).map((cells) =>
    cells.map(escape).join(",")
  );
  const csv = [header, ...lines].join("\r\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportExcel<T>(
  filename: string,
  sheetName: string,
  columns: ReportColumn<T>[],
  rows: T[]
) {
  await writeXlsxFile(rows, {
    sheet: sheetName,
    columns: columns.map((c) => ({
      header: c.header,
      width: c.width ?? 18,
      cell: c.accessor,
    })),
  }).toFile(`${filename}.xlsx`);
}

export function exportPdf<T>(
  title: string,
  filename: string,
  columns: ReportColumn<T>[],
  rows: T[]
) {
  const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(new Date().toLocaleString(), 14, 21);

  autoTable(doc, {
    startY: 26,
    head: [columns.map((c) => c.header)],
    body: cellsToStrings(columns, rows),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`${filename}.pdf`);
}
