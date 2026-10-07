/**
 * Universal CSV Exporter for Hostel Asset Management System
 */
export const exportToCSV = (data, filename = 'report.csv') => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  // Get keys from first object
  const headers = Object.keys(data[0]);

  const csvRows = [
    // Header row
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    // Data rows
    ...data.map((row) =>
      headers
        .map((field) => {
          let val = row[field];
          if (val === null || val === undefined) val = '';
          else if (typeof val === 'object') val = JSON.stringify(val);
          else val = String(val);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',')
    ),
  ];

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\r\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
