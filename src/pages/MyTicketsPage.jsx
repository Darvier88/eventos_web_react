import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiService from '../services/apiService';
import TicketCard from '../components/TicketCard';
import QRCodeModal from '../components/QRCodeModal';
import './MyTicketsPage.css';

const MyTicketsPage = () => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);

  const userId = localStorage.getItem('user_id');

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

  const getPurchaseTimestamp = (ticket) => {
    const purchase = ticket?.purchase_ticket || {};
    const parsed = new Date(purchase.purchase_date || 0);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  };

  const filteredTickets = purchaseTickets.filter(
    (ticket) => ticket?.purchase_ticket?.purchase_date != null
  );

  const sortedTickets = [...filteredTickets].sort((a, b) =>
    getPurchaseTimestamp(b) - getPurchaseTimestamp(a)
  );

  const visibleTickets = showAllTickets
    ? sortedTickets
    : sortedTickets.filter((ticket) => {
        const eventDate = ticket?.event?.start_date;
        if (!eventDate) return true;
        return new Date(eventDate) >= now;
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
          <button className="refresh-btn" onClick={() => refetch()}>
            Actualizar
          </button>
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
            />
          ))}
        </div>
      )}

      {showQrModal && selectedTicket && (
        <QRCodeModal ticket={selectedTicket} onClose={handleCloseQr} />
      )}
    </div>
  );
};

export default MyTicketsPage;