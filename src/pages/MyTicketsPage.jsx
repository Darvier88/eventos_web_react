import React, { useCallback, useEffect, useState } from 'react';
import apiService from '../services/apiService';
import TicketCard from '../components/TicketCard';
import QRCodeModal from '../components/QRCodeModal';
import './MyTicketsPage.css';

const MyTicketsPage = () => {
  const [purchaseTickets, setPurchaseTickets] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);

  const userId = localStorage.getItem('user_id');

  const loadData = useCallback(async () => {
    if (!userId) {
      setError('Usuario no autenticado');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const [orders, pending] = await Promise.all([
        apiService.getPurchaseTicketsByAttender(userId),
        apiService.getPayphoneTransactionsByAttender(userId),
      ]);
      setPurchaseTickets(Array.isArray(orders) ? orders : []);
      setPendingCount(Array.isArray(pending) ? pending.length : Number(pending) || 0);
    } catch (err) {
      setError(err.message || 'Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!purchaseTickets.length) {
      return;
    }

    console.log('[MyTickets] sample ticket:', purchaseTickets[purchaseTickets.length - 1]);
    console.log('[MyTickets] purchase_ticket date fields:', purchaseTickets.map((ticket) => {
      const purchase = ticket?.purchase_ticket || {};
      return {
        id: purchase._id || purchase.id,
        created_at: purchase.created_at,
        createdAt: purchase.createdAt,
        purchase_date: purchase.purchase_date,
        purchaseDate: purchase.purchaseDate,
        date: purchase.date,
        created: purchase.created,
      };
    }));
  }, [purchaseTickets]);

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

  if (loading) {
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

  // Filtrar tickets con purchase_date null
  const filteredTickets = purchaseTickets.filter(
    (ticket) => ticket?.purchase_ticket?.purchase_date != null
  );

  const sortedTickets = [...filteredTickets].sort((a, b) => (
    getPurchaseTimestamp(b) - getPurchaseTimestamp(a)
  ));

  const visibleTickets = showAllTickets
    ? sortedTickets
    : sortedTickets.filter((ticket) => {
        const eventDate = ticket?.event?.start_date;
        if (!eventDate) {
          return true;
        }
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
          <button className="refresh-btn" onClick={loadData}>
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

      {error && <div className="error-banner">{error}</div>}

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
