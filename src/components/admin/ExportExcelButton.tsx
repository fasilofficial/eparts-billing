import { Download } from "lucide-react";
import { downloadExcel } from "@/lib/excel";

export function ExportExcelButton({
  filename,
  headers,
  rows,
  disabled,
}: {
  filename: string;
  headers: string[];
  rows: string[][];
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled || rows.length === 0}
      onClick={() => downloadExcel(filename, headers, rows)}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Download className="size-4" />
      Export Excel
    </button>
  );
}
