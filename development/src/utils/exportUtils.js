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

/**
 * Downloads user's complete data dump table-wise in a multi-sheet Excel file (.xlsx)
 */
export async function downloadUserExcelExport(currentUser) {
  if (!currentUser) {
    throw new Error('Please sign in to export your data.');
  }

  const userId = currentUser.id || currentUser._id || '';
  const userEmail = currentUser.email || '';
  const userName = currentUser.name || '';
  const userRole = currentUser.role || '';

  const queryParams = new URLSearchParams({
    user_id: userId,
    user_email: userEmail,
    user_name: userName,
    user_role: userRole
  });

  const response = await fetch(`/api/user/export-excel?${queryParams.toString()}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to export Excel file (Status ${response.status})`);
  }

  const blob = await response.blob();
  const safeName = (userName || 'User').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const downloadFileName = `Orbita_UserData_${safeName}_${dateStr}.xlsx`;

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = downloadFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);

  return downloadFileName;
}
