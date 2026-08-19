/**
 * Client-side Data Dump & Export Utilities (CSV & JSON)
 */

export function exportToCsv(filename, columns, data) {
  if (!data || !data.length) {
    alert('No data available to export');
    return;
  }

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = columns.map((c) => escapeCsv(c.header)).join(',');
  const rows = data.map((row) => {
    return columns
      .map((c) => {
        const val = typeof c.accessor === 'function' ? c.accessor(row) : row[c.accessor];
        return escapeCsv(val);
      })
      .join(',');
  });

  const csvContent = [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().substring(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJson(filename, data) {
  if (!data) {
    alert('No data available to export');
    return;
  }

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().substring(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
