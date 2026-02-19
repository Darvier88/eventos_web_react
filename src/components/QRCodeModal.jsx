import React, { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './QRCodeModal.css';

const QRCodeModal = ({ ticket, onClose }) => {
  const [index, setIndex] = useState(0);

  const items = Array.isArray(ticket.purchase_ticket?.purchase_ticket_items)
    ? ticket.purchase_ticket.purchase_ticket_items
    : [];
  const purchaseId = ticket.purchase_ticket?._id || ticket.purchase_ticket?.id;

  const qrList = useMemo(() => {
    return items.map((item, i) => ({
      name: item.ticket_name || item.ticketName || item.name || `Ticket ${i + 1}`,
      qrData: `${item._id || item.id}^${purchaseId}`,
      isRead: !!(item.isRead ?? item.is_read),
    }));
  }, [items, purchaseId]);

  if (!qrList.length) return null;

  const current = qrList[index];

  const goPrev = () => setIndex((i) => (i === 0 ? qrList.length - 1 : i - 1));
  const goNext = () => setIndex((i) => (i === qrList.length - 1 ? 0 : i + 1));

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h2>Códigos QR</h2>
          <button className="qr-close" onClick={onClose}>×</button>
        </div>

        <div className="qr-modal-body">
          <div className={`qr-box ${current.isRead ? 'used' : ''}`}>
            <QRCodeCanvas value={current.qrData} size={200} includeMargin={true} level="H" />
            {current.isRead && <span className="qr-used">Usado</span>}
          </div>
          <div className="qr-info">
            <strong>{current.name}</strong>
            <span>
              {index + 1} de {qrList.length}
            </span>
          </div>

          {qrList.length > 1 && (
            <div className="qr-nav">
              <button onClick={goPrev} className="qr-nav-btn">Anterior</button>
              <button onClick={goNext} className="qr-nav-btn">Siguiente</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;
