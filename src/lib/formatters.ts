// src/lib/formatters.ts

/**
 * Formats a currency amount into Indian Rupee (INR) format (e.g. ₹18,00,000)
 */
export function formatCurrencyINR(amount?: number | string | null): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formats a percentage value (e.g. 70.00%)
 */
export function formatPercentage(pct?: number | string | null): string {
  if (pct === null || pct === undefined || pct === '') return '—';
  const num = typeof pct === 'string' ? parseFloat(pct) : pct;
  if (isNaN(num)) return '—';
  return `${num.toFixed(1)}%`;
}

/**
 * Formats a date into Asia/Kolkata timezone standard display string.
 */
export function formatDateTimeIST(dateInput?: Date | string | null): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d) + ' IST';
}

/**
 * Formats a date-only string (e.g. 15 Nov 2026)
 */
export function formatDateOnly(dateInput?: Date | string | null): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
}
