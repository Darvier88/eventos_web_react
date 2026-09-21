// src/utils/format.js
// Formato de montos y fechas compartido por las vistas de recargas e historiales.

export const formatMoney = (value) => `$${(Number(value) || 0).toFixed(2)}`;

/** Monto con signo: +$5.00 / −$3.50. El cero se muestra sin signo. */
export const formatSignedMoney = (value) => {
  const amount = Number(value) || 0;
  if (amount === 0) return formatMoney(0);
  return `${amount > 0 ? '+' : '−'}${formatMoney(Math.abs(amount))}`;
};

const pad = (n) => String(n).padStart(2, '0');

const toDate = (timestamp) => {
  if (timestamp === null || timestamp === undefined || timestamp === '') return null;
  const date = new Date(Number(timestamp));
  return Number.isNaN(date.getTime()) ? null : date;
};

/** dd/MM/yyyy a partir de un timestamp en milisegundos. */
export const formatDate = (timestamp) => {
  const date = toDate(timestamp);
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : null;
};

/** dd/MM/yyyy HH:mm a partir de un timestamp en milisegundos. */
export const formatDateTime = (timestamp) => {
  const date = toDate(timestamp);
  return date ? `${formatDate(timestamp)} ${pad(date.getHours())}:${pad(date.getMinutes())}` : null;
};
