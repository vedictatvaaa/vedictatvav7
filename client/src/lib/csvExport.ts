function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "object" ? JSON.stringify(v) : String(v);
  // Neutralize CSV formula-injection: cells beginning with = + - @ \t \r are
  // interpreted as formulas by Excel/Sheets. Prefix a single quote to defuse.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function sanitizeFilename(name: string): string {
  // Strip path separators, control chars, and other filesystem-unsafe bytes.
  const cleaned = name.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").trim();
  return cleaned || "export.csv";
}

export function downloadCsv(
  filename: string,
  columns: { key: string; label: string }[],
  rows: Record<string, unknown>[],
) {
  // RFC 4180 uses CRLF as the record separator.
  const CRLF = "\r\n";
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell(row[c.key])).join(","))
    .join(CRLF);
  // Prepend BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["\uFEFF", header, CRLF, body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = sanitizeFilename(filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
