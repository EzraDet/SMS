export function exportToCSV(rows, filename, columns) {
  if (!rows || rows.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = columns || Object.keys(rows[0]);

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map((h) => escape(h)).join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];

  const csv = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}