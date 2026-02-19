import React, { useState } from 'react';
import './TicketCard.css';

const TicketCard = ({ ticket, onShowQr, onDownloadPdf }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const eventName = ticket.event?.name || 'Evento';
  const createdAt = ticket.event?.start_date;
  const purchase = ticket.purchase_ticket || {};
  const items = Array.isArray(purchase.purchase_ticket_items)
    ? purchase.purchase_ticket_items
    : [];

  // Contar tickets sin usar
  const unusedCount = items.filter(item => !item.isRead && !item.is_read).length;
  
  // Agrupar tickets por nombre
  const groupedTickets = items.reduce((acc, item) => {
    const name = item.ticket_name || 'Ticket';
    if (!acc[name]) {
      acc[name] = 0;
    }
    acc[name]++;
    return acc;
  }, {});

  const totalAmount = purchase.total_amount || 0;
  const orderId = purchase._id || 'N/A';

  return (
    <div className="ticket-card">
      <div className="ticket-card-header">
        <div className="ticket-header-content">
          <h3 className="event-name">{eventName}</h3>
          <p className="order-id">Orden-{orderId.slice(-8)}</p>
          <div className="ticket-list">
            {Object.entries(groupedTickets).map(([name, count], idx) => (
              <span key={idx} className="ticket-item">
                {name.toLowerCase()} x ({count})
              </span>
            ))}
          </div>
        </div>
        <div className="ticket-menu">
          <button 
            className="menu-btn" 
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Más opciones"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="6" r="2" fill="currentColor"/>
              <circle cx="12" cy="12" r="2" fill="currentColor"/>
              <circle cx="12" cy="18" r="2" fill="currentColor"/>
            </svg>
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              <button onClick={() => { onShowQr(); setShowMenu(false); }}>
                Ver QR
              </button>
              <button onClick={() => { onDownloadPdf(); setShowMenu(false); }}>
                Descargar PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {unusedCount > 0 && (
        <div className="unused-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {unusedCount} sin usar
        </div>
      )}

      <div className="ticket-divider"></div>

      <div className="ticket-footer">
        <span className="total-label">total de la orden</span>
        <span className="total-amount">${totalAmount.toFixed(2)}</span>
      </div>

      {purchase.observation && 
       purchase.observation.trim() !== '' && 
       purchase.observation.trim().toUpperCase() !== 'NA' &&
       purchase.observation.trim().toUpperCase() !== 'N/A' && (
        <div className="ticket-note">{purchase.observation}</div>
      )}
    </div>
  );
};

export default TicketCard;
