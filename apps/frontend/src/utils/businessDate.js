export const BUSINESS_TIME_ZONE = 'Asia/Jakarta';

export function formatDate(value) {
  if (!value) return '—';
  // A check_date is a calendar date, not an instant to convert to the device timezone.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00+07:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: BUSINESS_TIME_ZONE, day: '2-digit', month: 'short', year: 'numeric',
  }).format(date);
}

export function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const time = new Intl.DateTimeFormat('id-ID', {
    timeZone: BUSINESS_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(date).replace('.', ':');
  return `${time} WIB`;
}

export function formatDateTime(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return '—';
  return `${formatDate(value)}, ${formatTime(value)}`;
}
