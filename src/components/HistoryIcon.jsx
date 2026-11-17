// src/components/HistoryIcon.jsx
import React from 'react';

const ICONS = {
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  bag: (
    <>
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  arrowIn: (
    <>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  arrowOut: (
    <>
      <path d="M12 15V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 20h14" />
    </>
  ),
  band: (
    <>
      <path d="M8.5 8.5a5 5 0 0 1 0 7" />
      <path d="M12 6a8.5 8.5 0 0 1 0 12" />
      <path d="M15.5 3.5a12 12 0 0 1 0 17" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="3" />,
};

const KIND_ICON = {
  recharge: 'plus',
  money_in: 'plus',
  order: 'bag',
  'transfer-in': 'arrowIn',
  'transfer-out': 'arrowOut',
  token_recharge: 'band',
  activation: 'band',
};

/** Ícono de un movimiento según su tipo (historial de pulseras y de precargas). */
const HistoryIcon = ({ kind, size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICONS[KIND_ICON[kind] || 'dot']}
  </svg>
);

export default HistoryIcon;
