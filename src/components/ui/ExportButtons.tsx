import { FileDown, FileSpreadsheet } from 'lucide-react';
import { exportToExcel, exportToPdf, type ExportColumn } from '@/shared/lib/export';

export function ExportButtons<T>({
  rows,
  columns,
  filename,
  title,
}: {
  rows: T[];
  columns: ExportColumn<T>[];
  filename: string;
  title: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="admin-btn-secondary"
        onClick={() => exportToExcel(rows, columns, filename)}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export Excel
      </button>
      <button
        type="button"
        className="admin-btn-secondary"
        onClick={() => exportToPdf(rows, columns, filename, title)}
      >
        <FileDown className="h-4 w-4" />
        Export PDF
      </button>
    </div>
  );
}
