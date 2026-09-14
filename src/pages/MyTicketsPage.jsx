import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/apiService';
import prechargeStore from '../services/prechargeStore';
import TicketCard from '../components/TicketCard';
import QRCodeModal from '../components/QRCodeModal';
import './MyTicketsPage.css';

const MyTicketsPage = () => {
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [blockedMsg, setBlockedMsg] = useState('');
  const handleBlockedAction = (msg) => {
    setBlockedMsg(msg);
  };
  const handleCloseBlockedModal = () => {
    setBlockedMsg('');
  };

  const userId = localStorage.getItem('user_id');

  // ── Reconciliación de precargas al cargar ─────────────────────────
  useEffect(() => {
    const records = prechargeStore.list();
    const now = Date.now();
    const FIVE_MIN = 5 * 60 * 1000;

    records.forEach(async (rec) => {
      // pending de más de 5 minutos: PayPhone lo revó. Descartar.
      if (rec.status === 'pending' && (now - rec.createdAt) > FIVE_MIN) {
        prechargeStore.update(rec.clientTxId, { status: 'cancelled' });
        return;
      }

      // registering: el pago se confirmó pero no se sabe si se registró.
      // Comparar precharge_amount actual vs prechargeBefore + amount.
      if (rec.status === 'registering') {
        try {
          const orders = await apiService.getPurchaseTicketsByAttender(userId);
          const order = Array.isArray(orders)
            ? orders.find(o => o?.purchase_ticket?._id === rec.purchaseTicketId)
            : null;
          const currentPrecharge = order?.purchase_ticket?.precharge_amount ?? null;

          if (currentPrecharge !== null &&
              currentPrecharge >= (rec.prechargeBefore + rec.amount - 0.01)) {
            // Ya se refleja: marcar como done
            prechargeStore.update(rec.clientTxId, { status: 'done' });
            queryClient.invalidateQueries({ queryKey: ['myTickets', userId] });
          } else {
            // Reintentar el POST
            try {
              await apiService.createPrechargeTransaction(rec.purchaseTicketId, rec.amount);
              prechargeStore.update(rec.clientTxId, { status: 'done' });
              queryClient.invalidateQueries({ queryKey: ['myTickets', userId] });
            } catch (retryErr) {
              console.warn('[Reconciliación] Reintento fallido:', retryErr.message);
            }
          }
        } catch (e) {
          console.warn('[Reconciliación] Error al verificar orden:', e.message);
        }
      }

      // confirming sin respuesta: caso ambiguo → avisar
      if (rec.status === 'confirming') {
        prechargeStore.update(rec.clientTxId, { status: 'ambiguous' });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['myTickets', userId],
    queryFn: async () => {
      const [orders, pending] = await Promise.all([
        apiService.getPurchaseTicketsByAttender(userId),
        apiService.getPayphoneTransactionsByAttender(userId),
      ]);
      return {
        purchaseTickets: Array.isArray(orders) ? orders : [],
        pendingCount: Array.isArray(pending) ? pending.length : Number(pending) || 0,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });

  const purchaseTickets = data?.purchaseTickets ?? [];
  const pendingCount    = data?.pendingCount    ?? 0;

  const handleShowQr = (ticket) => {
    setSelectedTicket(ticket);
    setShowQrModal(true);
  };

  const handleCloseQr = () => {
    setShowQrModal(false);
    setSelectedTicket(null);
  };

  const handleDownloadPdf = async (ticket) => {
    const purchaseTicketId = ticket?.purchase_ticket?._id;
    if (!purchaseTicketId) {
      alert('Error: No se encontró el ID del ticket');
      return;
    }
    try {
      const message = await apiService.downloadTicketPdf(purchaseTicketId);
      console.log(message);
    } catch (err) {
      alert(err.message || 'Error al descargar el PDF');
    }
  };

  if (!userId) {
    return (
      <div className="my-tickets-page">
        <div className="error-banner">Usuario no autenticado</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="my-tickets-page">
        <div className="loading-state">
          <div className="spinner" />
          <p>Cargando tickets...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  // Restar 5 horas a now para comparación local
  const nowMinus5h = new Date(now.getTime() - 5 * 60 * 60 * 1000);

  const getPurchaseTimestamp = (ticket) => {
    const purchase = ticket?.purchase_ticket || {};
    const parsed = new Date(purchase.purchase_date || 0);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };

  const filteredTickets = purchaseTickets.filter(
    (ticket) =>
      ticket?.purchase_ticket?.purchase_date != null &&
      ticket?.purchase_ticket?.status === 'completed'
  );

  // Loguear solo los tickets filtrados (los que se muestran en pantalla)
  if (filteredTickets && filteredTickets.length > 0) {
    filteredTickets.forEach((ticket, idx) => {
      console.log(`Ticket filtrado #${idx + 1}:`, ticket);
    });
  }

  const sortedTickets = [...filteredTickets].sort((a, b) =>
    getPurchaseTimestamp(b) - getPurchaseTimestamp(a)
  );

  const visibleTickets = showAllTickets
    ? sortedTickets
    : sortedTickets.filter((ticket) => {
        const eventDate = ticket?.event?.start_date;
        if (!eventDate) return true;
        return new Date(eventDate) >= nowMinus5h;
      });


  return (
    <div className="my-tickets-page">
      <div className="tickets-header">
        <h1>Mis tickets</h1>
        <div className="tickets-actions">
          <div className="view-toggle" role="group" aria-label="Cambiar vista de tickets">
            <button
              type="button"
              className={`toggle-btn ${!showAllTickets ? 'active' : ''}`}
              onClick={() => setShowAllTickets(false)}
            >
              Proximamente
            </button>
            <button
              type="button"
              className={`toggle-btn ${showAllTickets ? 'active' : ''}`}
              onClick={() => setShowAllTickets(true)}
            >
              Todos
            </button>
          </div>
            {/* Botón de actualizar eliminado */}
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="pending-banner">
          Tienes {pendingCount} transacción{pendingCount > 1 ? 'es' : ''} pendiente
          {pendingCount > 1 ? 's' : ''}.
        </div>
      )}

      {isError && <div className="error-banner">{error?.message || 'Error al cargar los tickets'}</div>}

      {visibleTickets.length === 0 ? (
        <div className="empty-state">
          <p>No tienes tickets adquiridos.</p>
        </div>
      ) : (
        <div className="tickets-list">
          {visibleTickets.map((ticket, index) => (
            <TicketCard
              key={ticket?.purchase_ticket?._id || ticket?.purchase_ticket?.id || `ticket-${index}`}
              ticket={ticket}
              onShowQr={() => handleShowQr(ticket)}
              onDownloadPdf={() => handleDownloadPdf(ticket)}
              onBlockedAction={handleBlockedAction}
              onPrecharge={() => navigate('/precharge', { state: { ticket } })}
            />
          ))}
              {/* Modal global para mensaje de acción bloqueada */}
              {blockedMsg && (
                <div className="blocked-modal-backdrop" onClick={handleCloseBlockedModal}>
                  <div className="blocked-modal" onClick={e => e.stopPropagation()}>
                    <div className="blocked-modal-content">
                      <span>{blockedMsg}</span>
                      <button className="blocked-modal-close" onClick={handleCloseBlockedModal} aria-label="Cerrar">&times;</button>
                    </div>
                  </div>
                </div>
              )}
        </div>
      )}

      {showQrModal && selectedTicket && (
        <QRCodeModal ticket={selectedTicket} onClose={handleCloseQr} />
      )}
    </div>
  );
};

export default MyTicketsPage;