// src/pages/PrechargePage.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiService from '../services/apiService';
import prechargeStore from '../services/prechargeStore';
import PayphonePaymentBox from '../components/PayphonePaymentBox';
import './PrechargePage.css';

/**
 * Genera un clientTransactionId único con prefijo "PRE-".
 * Payphone limita a 50 caracteres.
 */
function generateClientTxId() {
  const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 30);
  return `PRE-${uuid}`;
}

const PrechargePage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // El ticket completo puede venir del estado de navegación
  const ticketFromState = state?.ticket || null;

  const userId = localStorage.getItem('user_id');

  // Cargar órdenes del usuario si no vino el ticket por state
  const {
    data: ordersData,
    isLoading: ordersLoading,
  } = useQuery({
    queryKey: ['myTickets', userId],
    queryFn: () => apiService.getPurchaseTicketsByAttender(userId),
    enabled: !!userId && !ticketFromState,
    staleTime: 60 * 1000,
  });

  // Si llegó por state, usamos ese ticket; si no, el primero completado
  const ticket = useMemo(() => {
    if (ticketFromState) return ticketFromState;
    const orders = Array.isArray(ordersData) ? ordersData : [];
    return orders.find(t => t?.purchase_ticket?.status === 'completed') || null;
  }, [ticketFromState, ordersData]);

  const purchase   = ticket?.purchase_ticket || {};
  const event      = ticket?.event || {};
  const eventId    = event._id || event.id || '';
  const purchaseId = purchase._id || '';

  // Mínimo a precargar: el piso de $1.00 que ya existía, o el mínimo propio del
  // evento si es mayor. Se valida aquí, antes de abrir PayPhone: el backend no
  // participa antes del cobro, así que no puede rechazar un monto sin dejar a
  // la persona cobrada y sin precarga. Backends anteriores no envían el campo.
  const minPrecharge = Math.max(1, Number(event.min_precharge) || 0);

  // Determinar si el evento ya terminó
  const isEventOver = useMemo(() => {
    const endDate = event.end_date || event.start_date;
    return endDate ? new Date() > new Date(endDate) : false;
  }, [event]);

  const totalAmount     = purchase.total_amount || 0;
  const prechargeAmount = purchase.precharge_amount || 0;

  // ── Estado del formulario ────────────────────────────────────────
  const [amount, setAmount]         = useState('');
  const [error, setError]           = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentBox, setShowPaymentBox]   = useState(false);
  const [clientTxId, setClientTxId]           = useState('');
  const [noDocument, setNoDocument]           = useState(false);

  // Verificar si el usuario tiene cédula vinculada
  useEffect(() => {
    if (!userId) return;
    apiService.getCurrentUserProfile()
      .then(profile => {
        // El backend guarda la cédula en id_document
        const doc = profile?.id_document || profile?.idDocument || null;
        if (!doc) setNoDocument(true);
      })
      .catch(() => {}); // no bloqueante
  }, [userId]);

  const handleAmountChange = (e) => {
    // Permitir solo números y punto decimal, máx 2 decimales
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setAmount(val);
      setError(null);
    }
  };

  const handlePrecharge = async () => {
    setError(null);

    if (isEventOver) {
      setError('El evento ya terminó. No se puede realizar precargas.');
      return;
    }
    if (noDocument) {
      navigate('/link-document', {
        state: { returnTo: '/my-tickets' },
      });
      return;
    }
    if (!purchaseId) {
      setError('No se encontró una orden válida para precargar.');
      return;
    }

    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Ingresa un monto mayor a $0.00');
      return;
    }
    if (parsed < minPrecharge) {
      setError(`El monto mínimo para este evento es $${minPrecharge.toFixed(2)}`);
      return;
    }

    setSubmitting(true);
    try {
      // Generar clientTxId único (prefijo PRE-)
      const txId = generateClientTxId();
      setClientTxId(txId);

      // Guardar en localStorage antes de abrir Payphone
      prechargeStore.create({
        clientTxId: txId,
        purchaseTicketId: purchaseId,
        eventId,
        amount: parsed,
        prechargeBefore: prechargeAmount,
      });

      setShowPaymentBox(true);
    } catch (err) {
      setError(err.message || 'Error al iniciar el pago');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render: sin orden ────────────────────────────────────────────
  if (!userId) {
    return (
      <div className="precharge-page">
        <div className="precharge-error-box">
          <p>Debes iniciar sesión para realizar precargas.</p>
          <button className="btn-precharge-primary" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  if (ordersLoading && !ticketFromState) {
    return (
      <div className="precharge-page">
        <div className="precharge-loading">
          <div className="spinner" />
          <p>Cargando tus órdenes...</p>
        </div>
      </div>
    );
  }

  if (!ticket || !purchaseId) {
    return (
      <div className="precharge-page">
        <div className="precharge-error-box">
          <h2>Sin órdenes disponibles</h2>
          <p>No tienes órdenes completadas para realizar una precarga.</p>
          <button className="btn-precharge-secondary" onClick={() => navigate('/')}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="precharge-page">
      <div className="precharge-container">
        {/* ── Encabezado ── */}
        <div className="precharge-header">
          <button className="precharge-back-btn" onClick={() => navigate(-1)} aria-label="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="precharge-title">Precarga de Saldo</h1>
        </div>

        {/* ── Advertencia: sin cédula ── */}
        {noDocument && (
          <div className="precharge-warning-banner">
            <span>⚠ Sin cédula vinculada.</span>
            <button onClick={() => navigate('/link-document')}>Vincular ahora →</button>
          </div>
        )}

        {/* ── Advertencia: evento terminado ── */}
        {isEventOver && (
          <div className="precharge-warning-banner precharge-warning-error">
            El evento ya terminó. No se pueden hacer precargas.
          </div>
        )}

        {/* ── Resumen de la orden ── */}
        <div className="precharge-card">
          <div className="precharge-event-name">{event.name || 'Evento'}</div>
          <div className="precharge-order-id">Orden {purchaseId.slice(-8)}</div>

          <div className="precharge-amounts">
            <div className="precharge-amount-row">
              <span>Total de la orden</span>
              <strong>${totalAmount.toFixed(2)}</strong>
            </div>
            <div className="precharge-amount-row precharge-green">
              <span>Precargado hasta ahora</span>
              <strong>${prechargeAmount.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* ── Formulario / Cajita ── */}
        {!showPaymentBox ? (
          <div className="precharge-form-card">
            <h2 className="precharge-form-title">¿Cuánto quieres precargar?</h2>

            <div className="precharge-input-group">
              <span className="precharge-currency">$</span>
              <input
                id="precharge-amount-input"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                className="precharge-amount-input"
                disabled={isEventOver || submitting}
                aria-label="Monto a precargar"
                aria-describedby="precharge-min-hint"
                autoFocus
              />
            </div>

            <p id="precharge-min-hint" className="precharge-min-hint">
              Monto mínimo: ${minPrecharge.toFixed(2)}
            </p>

            {error && <div className="precharge-error">{error}</div>}

            <div className="precharge-actions">
              <button
                id="btn-precharge-submit"
                className="btn-precharge-primary"
                onClick={handlePrecharge}
                disabled={isEventOver || submitting || !amount || noDocument}
              >
                {submitting ? 'Preparando pago...' : 'Precargar con Payphone'}
              </button>
              <button
                className="btn-precharge-secondary"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="precharge-form-card">
            <h2 className="precharge-form-title">Completar Pago</h2>
            <p className="precharge-form-subtitle">
              Monto a precargar: <strong>${parseFloat(amount).toFixed(2)}</strong>
            </p>

            <PayphonePaymentBox
              token={import.meta.env.VITE_PAYPHONE_PUBLIC_KEY}
              clientTransactionId={clientTxId}
              amount={parseFloat(amount)}
              amountWithoutTax={Math.round(parseFloat(amount) * 100)}
              amountWithTax={0}
              tax={0}
              service={0}
              tip={0}
              currency={import.meta.env.VITE_PAYPHONE_CURRENCY || 'USD'}
              storeId={event?.store_id || event?.storeId || import.meta.env.VITE_PAYPHONE_STORE_ID}
              reference={`Precarga ${event.name || 'evento'}`.slice(0, 100)}
            />

            <button
              className="btn-precharge-secondary"
              onClick={() => {
                setShowPaymentBox(false);
                setClientTxId('');
              }}
            >
              Volver al formulario
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrechargePage;
