// src/components/TokenTransactions.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService from '../services/apiService';
import HistoryIcon from './HistoryIcon';
import { formatDateTime, formatMoney, formatSignedMoney } from '../utils/format';
import './TransactionHistory.css';

const PAGE_LIMIT = 100;

const METHOD_LABELS = {
  cash: 'Efectivo',
  credit_card: 'Tarjeta',
};

/**
 * Traduce una transacción de /dashboard/token a algo legible.
 *
 * Las transferencias no se pueden identificar por el tipo: el backend guarda la
 * salida como type "recharge" y la entrada como type "order"
 * (TokenController.transfer_balance). Se detectan por payment_method "transfer"
 * y el sentido lo da el cambio de saldo.
 */
function describeTransaction(tx) {
  const last = Number(tx.token_last_balance);
  const next = Number(tx.token_new_balance);
  const delta = Number.isFinite(last) && Number.isFinite(next) ? next - last : 0;
  const applied = tx.status === 'success';

  let kind;
  let label;
  if (tx.type === 'activation') {
    kind = 'activation';
    label = 'Activación de pulsera';
  } else if (tx.payment_method === 'transfer') {
    kind = delta < 0 ? 'transfer-out' : 'transfer-in';
    label = tx.description || (delta < 0 ? 'Transferencia enviada' : 'Transferencia recibida');
  } else if (tx.type === 'order') {
    kind = 'order';
    label = 'Compra';
  } else if (tx.type === 'recharge') {
    kind = 'recharge';
    label = 'Recarga';
  } else {
    kind = 'other';
    label = tx.description || 'Movimiento';
  }

  const details = [];
  if (kind === 'recharge' && METHOD_LABELS[tx.payment_method]) {
    details.push(METHOD_LABELS[tx.payment_method]);
  }
  if (tx.username && (kind === 'recharge' || kind === 'order')) {
    details.push(`Por ${tx.username}`);
  }

  return { kind, label, delta, applied, details };
}

/**
 * Resumen y lista de movimientos de una pulsera (GET /dashboard/token).
 * El backend excluye las anuladas y ordena de la más reciente a la más antigua.
 */
const TokenTransactions = ({ tokenId }) => {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tokenTransactions', tokenId],
    queryFn: () => apiService.getTokenTransactions(tokenId, { page: 0, limit: PAGE_LIMIT }),
    enabled: !!tokenId,
  });

  if (isLoading) {
    return (
      <div className="th-state">
        <div className="th-spinner" />
        <p>Cargando movimientos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="th-state">
        <p>{error?.message || 'No se pudieron obtener los movimientos de la pulsera'}</p>
        <button className="th-retry" onClick={() => refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const transactions = data?.transactions ?? [];
  const rows = transactions.map((tx) => ({ tx, ...describeTransaction(tx) }));

  // Solo cuentan las transacciones que se aplicaron de verdad
  const received = rows
    .filter((row) => row.applied && row.delta > 0)
    .reduce((sum, row) => sum + row.delta, 0);
  const spent = rows
    .filter((row) => row.applied && row.delta < 0)
    .reduce((sum, row) => sum - row.delta, 0);

  return (
    <div className="th-content">
      <div className="th-summary">
        <div className="th-tile">
          <span>Saldo actual</span>
          <strong>{formatMoney(data?.token?.balance)}</strong>
        </div>
        <div className="th-tile">
          <span>Recibido</span>
          <strong className="th-positive">{formatMoney(received)}</strong>
        </div>
        <div className="th-tile">
          <span>Gastado</span>
          <strong className="th-negative">{formatMoney(spent)}</strong>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="th-empty">Esta pulsera todavía no tiene movimientos.</div>
      ) : (
        <ul className="th-list">
          {rows.map(({ tx, kind, label, delta, applied, details }) => {
            let amountClass = 'th-strike';
            if (applied) amountClass = delta > 0 ? 'th-positive' : delta < 0 ? 'th-negative' : '';

            return (
              <li key={tx._id} className={`th-row ${applied ? '' : 'th-row-muted'}`}>
                <span className={`th-icon th-icon-${kind}`}>
                  <HistoryIcon kind={kind} />
                </span>
                <div className="th-row-info">
                  <span className="th-row-label">{label}</span>
                  <span className="th-row-meta">
                    {[formatDateTime(tx.__createdtime__), ...details].filter(Boolean).join(' · ')}
                  </span>
                </div>
                <div className="th-row-amount">
                  <strong className={amountClass}>
                    {kind === 'activation' ? '—' : formatSignedMoney(delta)}
                  </strong>
                  {!applied && (
                    <span className="th-badge">{tx.status === 'pending' ? 'Pendiente' : 'No aplicada'}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {transactions.length >= PAGE_LIMIT && (
        <p className="th-footnote">Mostrando los últimos {PAGE_LIMIT} movimientos.</p>
      )}
      <p className="th-footnote">Las transacciones anuladas no se muestran.</p>
    </div>
  );
};

export default TokenTransactions;
