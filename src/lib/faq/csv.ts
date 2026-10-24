/**
 * Minimal RFC 4180 CSV parser: quoted fields, escaped quotes (""),
 * commas and newlines inside quotes, CRLF line endings, and a UTF-8 BOM.
 * Kept dependency-free because the FAQ file is small and trusted.
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (inQuotes) throw new Error("CSV parse error: unterminated quoted field");

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Parses CSV text into objects keyed by trimmed header names. */
export function parseCsvRecords(input: string): Record<string, string>[] {
  const [header, ...body] = parseCsv(input);
  if (!header) return [];
  const keys = header.map((h) => h.trim());
  return body.map((cells) =>
    Object.fromEntries(keys.map((key, i) => [key, (cells[i] ?? "").trim()])),
  );
}
