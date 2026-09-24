export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getInitials(firstName = '', lastName = '') {
  const f = firstName?.[0]?.toUpperCase() || '';
  const l = lastName?.[0]?.toUpperCase() || '';
  return (f + l) || '?';
}

export function getFullName(student) {
  if (!student) return '—';
  return `${student.firstName || ''} ${student.lastName || ''}`.trim();
}

export function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}