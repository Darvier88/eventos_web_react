
import React, { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { hoursUntilEvent } from '../utils/eventTime';
import './QRCodeModal.css';

const QRCodeModal = ({ ticket, onClose }) => {
  const [index, setIndex] = useState(0);

  const items = Array.isArray(ticket.purchase_ticket?.purchase_ticket_items)
    ? ticket.purchase_ticket.purchase_ticket_items
    : [];
  const purchaseId = ticket.purchase_ticket?._id || ticket.purchase_ticket?.id;


  // El QR se tapa hasta 24 horas antes de que empiece el evento.
  const hoursLeft = hoursUntilEvent(ticket.event);
  const isMasked = hoursLeft !== null && hoursLeft > 24;

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

  // QR masking: si faltan más de 24 horas, mostrar QR enmascarado
  const maskedQrValue = 'QR DISPONIBLE 24H ANTES DEL EVENTO';

  return (
    <div className="qr-modal-backdrop" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h2>Códigos QR</h2>
          <button className="qr-close" onClick={onClose}>×</button>
        </div>

        <div className="qr-modal-body">
          <div className={`qr-box ${current.isRead ? 'used' : ''}`}> 
            {isMasked ? (
              <div className="qr-blur-container">
                <QRCodeCanvas value={maskedQrValue} size={200} includeMargin={true} level="H" />
                <div className="qr-blur-overlay" />
                <span className="qr-masked-msg">
                  El QR real estará disponible <br />24 horas antes del inicio del evento.
                </span>
              </div>
            ) : (
              <>
                <QRCodeCanvas value={current.qrData} size={200} includeMargin={true} level="H" />
                {current.isRead && <span className="qr-used">Usado</span>}
              </>
            )}
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
