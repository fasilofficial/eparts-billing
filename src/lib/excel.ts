import * as XLSX from "xlsx";

/** Downloads a genuine .xlsx Excel file (not CSV). */
export function downloadExcel(filename: string, headers: string[], rows: string[][]) {
  // Build worksheet data: headers as first row, then data rows
  const worksheetData = [headers, ...rows];

  // Create worksheet from array of arrays
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-size columns based on longest content in each column
  const colWidths = headers.map((header, colIndex) => {
    const maxLen = Math.max(
      header.length,
      ...rows.map((row) => String(row[colIndex] ?? "").length),
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  worksheet["!cols"] = colWidths;

  // Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  // Write and trigger download as .xlsx
  const xlsxFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, xlsxFilename);
}
