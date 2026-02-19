// src/pages/PurchaseConfirmationPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './PurchaseConfirmationPage.css';

const PurchaseConfirmationPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const purchaseId = state?.purchaseId;
  const transactionId = state?.transactionId;
  const ticketsAcomprar = state?.ticketsAcomprar || {};
  const event = state?.event;

  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  // Usar ref para evitar múltiples ejecuciones
  const emailSentRef = useRef(false);

  // Parsear el mapa de tickets para mostrarlos
  const ticketsArray = Object.entries(ticketsAcomprar).map(([ticketKeyStr, qty]) => {
    try {
      const ticketData = JSON.parse(ticketKeyStr);
      return { ...ticketData, quantity: qty };
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Enviar ticket por email al confirmarse el pago (solo una vez)
  useEffect(() => {
    if (purchaseId && !emailSentRef.current) {
      emailSentRef.current = true;
      
      const sendEmail = async () => {
        setSendingEmail(true);
        try {
          await apiService.sendTicketEmail(purchaseId);
          setEmailSent(true);
          setEmailError(null);
        } catch (err) {
          console.error('Error al enviar ticket por email:', err);
          setEmailError(err.message || 'Error al enviar ticket por correo');
          setEmailSent(true); // Marcar como intentado aunque falle
        } finally {
          setSendingEmail(false);
        }
      };

      sendEmail();
    }
  }, [purchaseId]);

  return (
    <div className="purchase-confirmation-page">
      <div className="confirmation-card">
        <div className="icon success">✓</div>
        <h2>¡Compra confirmada!</h2>
        <p>Tu pago fue procesado correctamente.</p>

        {emailSent && (
          <div className="email-status success">
            <p>✓ Ticket enviado por correo exitosamente</p>
          </div>
        )}
        {emailError && (
          <div className="email-status error">
            <p>⚠ {emailError}</p>
          </div>
        )}
        {sendingEmail && (
          <div className="email-status loading">
            <p>Enviando ticket por correo...</p>
          </div>
        )}

        <div className="details">
          {event && (
            <p><strong>Evento:</strong> {event.name}</p>
          )}
          {purchaseId && (
            <p><strong>ID de compra:</strong> {purchaseId}</p>
          )}
          {transactionId && (
            <p><strong>ID de transacción:</strong> {transactionId}</p>
          )}
          
          {ticketsArray.length > 0 && (
            <div className="tickets-summary">
              <h3>Tickets comprados:</h3>
              <ul>
                {ticketsArray.map((ticket, idx) => (
                  <li key={idx}>
                    <strong>{ticket.name}</strong> - Cantidad: {ticket.quantity}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {!purchaseId && !transactionId && (
            <p>No encontramos detalles de la confirmación. Puedes volver al inicio.</p>
          )}
        </div>

        <div className="actions">
          <button className="btn" onClick={() => navigate('/')}>Volver al inicio</button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseConfirmationPage;
