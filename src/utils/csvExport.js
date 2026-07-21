/**
 * Excel/CSV dışa aktarma yardımcısı.
 *
 * Ayırıcı olarak noktalı virgül (;) kullanılır, çünkü Türkçe Excel'de
 * varsayılan liste ayıracı budur (virgül ondalık ayraç olarak kullanılır).
 *
 * UTF-8 BOM (\uFEFF) zorunludur — Excel'in dosyayı UTF-8 olarak açması
 * ve ÇĞİIÖŞÜ / çğıöşü karakterlerinin bozulmaması için.
 */

/** Excel'in UTF-8 tanıması için byte order mark */
export const CSV_UTF8_BOM = "\uFEFF";

function escapeCsvValue(value) {
  const str = String(value ?? "");

  if (/[";\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function exportToCsv(filename, rows, columns) {
  const header = columns.map((col) => escapeCsvValue(col.label)).join(";");

  const lines = rows.map((row) =>
    columns.map((col) => escapeCsvValue(row[col.key])).join(";")
  );

  const csvContent = [header, ...lines].join("\r\n");

  const blob = new Blob([CSV_UTF8_BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
