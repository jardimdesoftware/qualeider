/**
 * Gera e baixa um arquivo CSV a partir de linhas já formatadas como texto.
 * Sem dependência nova - Blob + link temporário, abre normalmente no Excel.
 */
export function downloadCSV(filename: string, rows: string[][]): void {
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell ?? "";
          // Escapa aspas duplas e envolve em aspas se tiver vírgula, aspas ou quebra de linha
          if (/[",\n]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(","),
    )
    .join("\n");

  // BOM (﻿) garante acentuação correta ao abrir no Excel
  const blob = new Blob(["﻿" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
