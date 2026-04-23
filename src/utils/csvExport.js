// src/utils/csvExport.js
// Generic CSV export utility.
// Converts an array of flat objects to a downloadable CSV file.

/**
 * Convert an array of objects to CSV and trigger a browser download.
 * @param {Array<object>} data - Rows to export
 * @param {string[]} columns - Column keys to include (in order)
 * @param {object} headers - Map of column key → display label { prodcode: 'Product Code' }
 * @param {string} filename - Downloaded file name (e.g. 'product-report.csv')
 */
export function exportToCSV(data, columns, headers, filename) {
  if (!data || data.length === 0) return;

  // Build header row
  const headerRow = columns.map(col => headers[col] ?? col).join(',');

  // Build data rows — escape values containing commas, quotes, or newlines
  const dataRows = data.map(row =>
    columns.map(col => {
      const val = row[col] ?? '';
      const str = String(val);
      // Wrap in quotes if the value contains commas, quotes, or newlines
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );

  const csv = [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}