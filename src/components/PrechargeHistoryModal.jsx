// src/components/PrechargeHistoryModal.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService from '../services/apiService';
import HistorySheet from './HistorySheet';
import HistoryIcon from './HistoryIcon';
import { formatDateTime, formatMoney, formatSignedMoney } from '../utils/format';
import './TransactionHistory.css';

const METHOD_LABELS = {
  cash: 'Efectivo',
  credit_card: 'Tarjeta',
};

/**
 * Historial de precarga de una orden (GET /precharge_transaction/ticket_history):
 *  - money_in:       dinero que entró a la orden.
 *  - token_recharge: recargas a las pulseras del asistente en ese evento.
 */
const PrechargeHistoryModal = ({ ticket, onClose }) => {
  const purchase = ticket?.purchase_ticket || {};
  const purchaseTicketId = purchase._id;
  const eventName = ticket?.event?.name || 'Evento';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['prechargeHistory', purchaseTicketId],
    queryFn: () => apiService.getPrechargeHistory(purchaseTicketId),
    enabled: !!purchaseTicketId,
  });

  const history = data?.history ?? [];
  const tokens = data?.tokens ?? [];
  const precharged = Number(data?.purchaseTicket?.precharge_amount ?? purchase.precharge_amount) || 0;
  const loadedToTokens = history
    .filter((item) => item.event_type === 'token_recharge' && !item.annulled)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <HistorySheet
      title="Historial de precarga"
      subtitle={`${eventName} · Orden-${String(purchaseTicketId || '').slice(-8)}`}
      onClose={onClose}
    >
      {isLoading && (
        <div className="th-state">
          <div className="th-spinner" />
          <p>Cargando historial...</p>
        </div>
      )}

      {isError && (
        <div className="th-state">
          <p>{error?.message || 'No se pudo obtener el historial de precargas'}</p>
          <button className="th-retry" onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="th-content">
          <div className="th-summary th-summary-2">
            <div className="th-tile">
              <span>Precargado en la orden</span>
              <strong className={precharged > 0 ? 'th-positive' : ''}>{formatMoney(precharged)}</strong>
            </div>
            <div className="th-tile">
              <span>Cargado a pulseras</span>
              <strong>{formatMoney(loadedToTokens)}</strong>
            </div>
          </div>

          {tokens.length > 0 && (
            <>
              <div className="th-section-title">Pulseras en este evento</div>
              <div className="th-chips">
                {tokens.map((token) => (
                  <span key={token._id} className="th-chip">
                    {token.code} · <strong>{formatMoney(token.balance)}</strong>
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="th-section-title">Movimientos</div>

          {history.length === 0 ? (
            <div className="th-empty">Esta orden todavía no tiene precargas.</div>
          ) : (
            <ul className="th-list">
              {history.map((item, index) => {
                const isMoneyIn = item.event_type === 'money_in';
                const annulled = Boolean(item.annulled);
                const label = isMoneyIn ? 'Precarga' : `Recarga a pulsera ${item.token_code || ''}`.trim();
                const meta = [formatDateTime(item.date), !isMoneyIn && METHOD_LABELS[item.payment_method]]
                  .filter(Boolean)
                  .join(' · ');

                let amountClass = '';
                if (annulled) amountClass = 'th-strike';
                else if (isMoneyIn) amountClass = 'th-positive';

                return (
                  <li
                    key={item._id || `${item.event_type}-${item.date}-${index}`}
                    className={`th-row ${annulled ? 'th-row-muted' : ''}`}
                  >
                    <span className={`th-icon th-icon-${item.event_type}`}>
                      <HistoryIcon kind={item.event_type} />
                    </span>
                    <div className="th-row-info">
                      <span className="th-row-label">{label}</span>
                      <span className="th-row-meta">{meta}</span>
                    </div>
                    <div className="th-row-amount">
                      <strong className={amountClass}>
                        {isMoneyIn ? formatSignedMoney(item.amount) : formatMoney(item.amount)}
                      </strong>
                      {annulled && <span className="th-badge">Anulada</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="th-footnote">
            "Precarga" es el dinero que entró a esta orden. "Recarga a pulsera" incluye todas las recargas
            de tus pulseras en este evento, también las hechas directamente a la pulsera.
          </p>
        </div>
      )}
    </HistorySheet>
  );
};

export default PrechargeHistoryModal;
