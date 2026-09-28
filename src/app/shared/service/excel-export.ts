import * as XLSX from 'xlsx';

// Genera y descarga un .xlsx a partir de filas planas (las llaves del objeto son los encabezados).
export function exportarExcel(filas: Record<string, any>[], nombreHoja: string, nombreArchivo: string): void {
  const ws = XLSX.utils.json_to_sheet(filas);
  const encabezados = Object.keys(filas[0] ?? {});
  ws['!cols'] = encabezados.map(h => ({
    wch: Math.min(Math.max(h.length, ...filas.map(f => String(f[h] ?? '').length)) + 2, 50)
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja.slice(0, 31));
  const fecha = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${nombreArchivo}_${fecha}.xlsx`);
}
