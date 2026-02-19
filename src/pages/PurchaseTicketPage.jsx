// src/pages/PurchaseTicketPage.jsx (VERSIÓN SIMPLIFICADA CON PAYPHONE)
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../services/apiService';
import PayphonePaymentBox from '../components/PayphonePaymentBox';
import TicketQuantitySelector from '../components/TicketQuantitySelector';
import secureStorage from '../services/secureStorage';
import './PurchaseTicketPage.css';

const PurchaseTicketsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const { eventId: eventIdFromState, event: eventFromState, tickets: ticketsFromState } = state || {};
  const resolvedEventId = eventIdFromState || eventFromState?._id || secureStorage.getEventId();

  // Estados principales
  const [event, setEvent] = useState(eventFromState || null);
  const [tickets, setTickets] = useState(ticketsFromState || []);
  const [loading, setLoading] = useState(!eventFromState || !ticketsFromState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentBox, setShowPaymentBox] = useState(false);
  const [purchaseCreated, setPurchaseCreated] = useState(null);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  // Campos del formulario
  const [observation, setObservation] = useState('');
  const [code, setCode] = useState('');
  const [quantities, setQuantities] = useState({});

  // Verificar si viene de confirmación de Payphone
  useEffect(() => {
    const paymentId = searchParams.get('id');
    const clientTxId = searchParams.get('clientTransactionId');

    if (paymentId && clientTxId) {
      // Confirmar el pago con el backend
      confirmPayment(paymentId, clientTxId);
    }
  }, [searchParams]);

  const confirmPayment = async (paymentId, clientTxId) => {
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('session_token'),
        },
        body: JSON.stringify({ paymentId, clientTxId }),
      });

      if (!response.ok) throw new Error('No se pudo confirmar el pago');

      const result = await response.json();
      
      // Construir mapa de TicketsAcomprar
      const ticketsAcomprar = {};
      visibleTickets.forEach((ticket) => {
        const qty = quantities[ticket._id] || 0;
        if (qty > 0) {
          const ticketKey = JSON.stringify({
            id: ticket._id,
            name: ticket.name,
            event_id: resolvedEventId,
          });
          ticketsAcomprar[ticketKey] = qty;
        }
      });
      
      navigate('/purchase-confirmation', {
        state: { 
          purchaseId: result.purchaseId, 
          transactionId: paymentId,
          ticketsAcomprar,
          event,
        },
      });
    } catch (err) {
      console.error('Error confirmando pago:', err);
      setError('Error al confirmar el pago. Por favor contacta a soporte.');
    }
  };

  // Cargar evento y tickets si no vienen en state
  useEffect(() => {
    if (event && tickets.length) return;
    if (!resolvedEventId) {
      setError('No se pudo identificar el evento');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [ev, tks] = await Promise.all([
          apiService.getEventById(resolvedEventId),
          apiService.getTicketsByEvent(resolvedEventId),
        ]);
        setEvent(ev);
        setTickets(tks);
        secureStorage.setEventId(resolvedEventId);
      } catch (err) {
        setError(err.message || 'No se pudo cargar el evento');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [resolvedEventId, event, tickets.length]);

  useEffect(() => {
    if (resolvedEventId) {
      secureStorage.setEventId(resolvedEventId);
    }
  }, [resolvedEventId]);

  useEffect(() => {
    if (!resolvedEventId) return;
    setImageError(false);
    setBannerImageUrl(apiService.getBannerImageUrl(resolvedEventId));
  }, [resolvedEventId]);

  // Inicializar cantidades
  useEffect(() => {
    const initial = {};
    tickets
      .filter((t) => !t.hidden)
      .forEach((t) => {
        const min = Number(t.minimum_to_buy ?? t.minimumToBuy ?? 0);
        const maxRaw = Number(t.max_to_buy ?? t.maximum_to_buy ?? t.maxToBuy ?? 0);
        const max = maxRaw > 0 ? maxRaw : 9999; // si no viene max, permitimos crecer
        const isFixed = min > 0 && min === maxRaw && maxRaw > 0;
        initial[t._id] = isFixed ? min : Math.max(0, min); // arranca en min si hay min
      });
    setQuantities(initial);
  }, [tickets]);

  // Tickets visibles y ordenados
  const visibleTickets = useMemo(
    () => tickets.filter((t) => !t.hidden).sort((a, b) => a.price - b.price),
    [tickets]
  );

  // Total de costo
  const totalCost = useMemo(
    () =>
      visibleTickets.reduce(
        (acc, t) => acc + (quantities[t._id] || 0) * t.price,
        0
      ),
    [visibleTickets, quantities]
  );

  // Validar mínimos
  const validateMinimums = () => {
    for (const ticket of visibleTickets) {
      const qty = quantities[ticket._id] || 0;
      const min = ticket.minimum_to_buy || ticket.minimumToBuy || 0;
      if (qty > 0 && qty < min) {
        return `Para ${ticket.name} debes comprar mínimo ${min} tickets`;
      }
    }
    return null;
  };

  // Cambiar cantidad
  const handleQtyChange = (ticketId, delta, ticket) => {
    setQuantities((prev) => {
      const current = prev[ticketId] || 0;
      const min = Number(ticket.minimum_to_buy ?? ticket.minimumToBuy ?? 0);
      const maxRaw = Number(ticket.max_to_buy ?? ticket.maximum_to_buy ?? ticket.maxToBuy ?? 0);
      const cap = maxRaw > 0 ? maxRaw : 9999;
      const isFixed = min > 0 && maxRaw > 0 && min === maxRaw;

      if (isFixed) return prev;

      const next = Math.max(0, Math.min(cap, current + delta));
      return next === current ? prev : { ...prev, [ticketId]: next };
    });
  };

  // Crear compra y mostrar Cajita de Payphone
  const handleBuyWithPayphone = async () => {
    if (!event) return;
    setError(null);

    // Validaciones
    if (event.observation_obligatory && !observation.trim()) {
      setError('La observación es obligatoria');
      return;
    }
    if (event.code && !code.trim()) {
      setError('El código es obligatorio');
      return;
    }

    const minError = validateMinimums();
    if (minError) {
      setError(minError);
      return;
    }

    const hasSelection = Object.values(quantities).some((q) => q > 0);
    if (!hasSelection) {
      setError('Selecciona al menos un ticket');
      return;
    }

    setSubmitting(true);
    try {
      if (event.code) {
        await apiService.validateEventCode(eventId, code.trim());
      }

      const userProfile = await apiService.getCurrentUserProfile();

      // Construir mapa de tickets a comprar
      const toBuyTickets = {};
      visibleTickets.forEach((ticket) => {
        const qty = quantities[ticket._id] || 0;
        if (qty > 0) {
          const ticketKey = JSON.stringify({
            id: ticket._id,
            name: ticket.name,
            event_id: resolvedEventId,
          });
          toBuyTickets[ticketKey] = qty;
        }
      });

      // Crear compra con todos los items
      const purchaseId = await apiService.createPurchaseTicket(
        resolvedEventId,
        userProfile._id,
        { 
          toBuyTickets,
          observation: observation.trim() || undefined 
        }
      );

      // Preparar items para el state (para mostrar en confirmación)
      const items = visibleTickets
        .map((t) => ({ ticket: t, qty: quantities[t._id] || 0 }))
        .filter((x) => x.qty > 0);

      // Guardar datos de la compra en localStorage para usar en el callback de Payphone
      localStorage.setItem('purchaseData', JSON.stringify({
        purchaseId,
        ticketsAcomprar: toBuyTickets,
        event,
      }));

      setPurchaseCreated({
        purchaseId,
        items,
        userProfile,
      });

      // Mostrar Cajita de Payphone
      setShowPaymentBox(true);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'No se pudo crear la compra');
    } finally {
      setSubmitting(false);
    }
  };

  // Render
  if (loading) {
    return (
      <div className="purchase-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="purchase-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || 'No se pudo cargar el evento'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="purchase-page">
      <div className="event-banner">
        {bannerImageUrl && !imageError ? (
          <img
            src={bannerImageUrl}
            alt={event.name}
            className="event-banner-image"
            onError={() => setImageError(true)}
          />
        ) : imageError ? (
          <div className="event-banner-placeholder"><p>Imagen no disponible</p></div>
        ) : (
          <div className="event-banner-placeholder"><div className="spinner" /><p>Cargando imagen...</p></div>
        )}
      </div>

      {!showPaymentBox && (
        <div className="purchase-container">
          <h1 className="purchase-title">Comprar Entradas</h1>
          <div className="purchase-step">
            <span className="step-badge">1</span>
            <span>Selecciona tus entradas</span>
          </div>
          <p className="purchase-event-name">{event.name}</p>

          <section className="purchase-card">
            <div className="purchase-table-header">
              <span>Localidad</span>
              <span>Precio</span>
              <span>Cantidad</span>
            </div>
            <div className="purchase-table">
              {visibleTickets.length === 0 ? (
                <div className="purchase-empty">No hay tickets disponibles para este evento.</div>
              ) : (
                visibleTickets.map((t) => {
                  const min = Number(t.minimum_to_buy ?? t.minimumToBuy ?? 0);
                  const maxRaw = Number(t.max_to_buy ?? t.maximum_to_buy ?? t.maxToBuy ?? 0);
                  const max = maxRaw > 0 ? maxRaw : 9999;
                  const isFixed = min > 0 && maxRaw > 0 && min === maxRaw;
                  const hint = isFixed
                    ? `Cantidad fija: ${min}`
                    : `Mín ${min} / Máx ${maxRaw > 0 ? maxRaw : '∞'}`;

                  return (
                    <div key={t._id} className="purchase-row">
                      <div className="purchase-locality">
                        <div className="locality-name">{t.name}</div>
                        {t.description && <div className="locality-desc">{t.description}</div>}
                        {(min > 0 || maxRaw > 0) && <div className="locality-hint">{hint}</div>}
                      </div>
                      <div className="purchase-price">
                        {t.price === 0 ? 'Gratis' : `$${t.price.toFixed(2)}`}
                      </div>
                      <div className="purchase-qty">
                        <TicketQuantitySelector
                          qty={quantities[t._id] || 0}
                          min={min}
                          max={max}
                          isFixed={isFixed}
                          onIncrement={() => handleQtyChange(t._id, 1, t)}
                          onDecrement={() => handleQtyChange(t._id, -1, t)}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {(event.observation_obligatory || event.code) && (
            <section className="purchase-card">
              {event.observation_obligatory && (
                <label className="form-field">
                  <span>Observación (Obligatoria)</span>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Ingresa observación..."
                  />
                </label>
              )}
              {event.code && (
                <label className="form-field">
                  <span>Código de Acceso (Obligatorio)</span>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ingresa código..."
                  />
                </label>
              )}
            </section>
          )}

          <section className="purchase-actions">
            <div className="purchase-subtotal">
              <span>SUBTOTAL:</span>
              <strong>${totalCost.toFixed(2)}</strong>
            </div>
            {error && <div className="purchase-error">{error}</div>}
            <button
              className="purchase-next-btn"
              onClick={handleBuyWithPayphone}
              disabled={submitting}
            >
              {submitting ? 'Procesando...' : 'Siguiente'}
            </button>
          </section>
        </div>
      )}

      {showPaymentBox && purchaseCreated && (
        <div className="purchase-container">
          <div className="payment-box-container">
            <h2>Completar Pago</h2>
            <p className="payment-info">Haz clic en el botón para pagar con Payphone</p>
            {console.debug('[Payphone] storeId', event?.store_id || event?.storeId || import.meta.env.VITE_PAYPHONE_STORE_ID)}

            <PayphonePaymentBox
              token={import.meta.env.VITE_PAYPHONE_PUBLIC_KEY}
              clientTransactionId={purchaseCreated.purchaseId}
              amount={totalCost}
              amountWithoutTax={Math.round(totalCost * 100)}
              amountWithTax={0}
              tax={0}
              service={0}
              tip={0}
              currency={import.meta.env.VITE_PAYPHONE_CURRENCY || 'USD'}
              storeId={event?.store_id || event?.storeId || import.meta.env.VITE_PAYPHONE_STORE_ID}
              reference={`Compra de tickets para ${event.name}`}
              phoneNumber={purchaseCreated.userProfile.phone}
              email={purchaseCreated.userProfile.email}
              documentId={purchaseCreated.userProfile.idDocument}
            />

            <button className="btn-back-to-form" onClick={() => setShowPaymentBox(false)}>
              Volver al formulario
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseTicketsPage;
