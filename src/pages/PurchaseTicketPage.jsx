// src/pages/PurchaseTicketPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../services/apiService';
import PayphonePaymentBox from '../components/PayphonePaymentBox';
import TicketQuantitySelector from '../components/TicketQuantitySelector';
import secureStorage from '../services/secureStorage';
import './PurchaseTicketPage.css';

import COURSE_GROUPS from '../assets/aleman_courses.json';

const PurchaseTicketsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const { eventId: eventIdFromState, event: eventFromState, tickets: ticketsFromState } = state || {};
  const resolvedEventId = eventIdFromState || eventFromState?._id || secureStorage.getEventId();

  const [event, setEvent] = useState(eventFromState || null);
  const [tickets, setTickets] = useState(ticketsFromState || []);
  const [loading, setLoading] = useState(!eventFromState || !ticketsFromState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showPaymentBox, setShowPaymentBox] = useState(false);
  const [purchaseCreated, setPurchaseCreated] = useState(null);
  const [imageError, setImageError] = useState(false);

  const { data: bannerImageUrl } = useQuery({
    queryKey: ['bannerImage', resolvedEventId],
    queryFn: () => apiService.getImageFileByEvent(resolvedEventId, 'banner'),
    enabled: !!resolvedEventId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ── Campos del formulario ────────────────────────────────────────
  // observations: { [name]: value } para el nuevo sistema
  const [observationValues, setObservationValues] = useState({});
  const [selectedCourseGroup, setSelectedCourseGroup] = useState('');

  const handleObservationChange = (obsName, value) => {
    setObservationValues(prev => {
      const next = { ...prev, [obsName]: value };
      
      // Auto-fill student name if Ident. adicional is selected
      if (obsName.toLowerCase().includes('curso')) {
        const isAdicional = COURSE_GROUPS["Ident. adicional"].includes(value);
        const studentObsName = event?.observations?.find(o => 
          o.name.toLowerCase().includes('nombre') && o.name.toLowerCase().includes('estudiante')
        )?.name;
        
        if (studentObsName) {
          if (isAdicional) {
            next[studentObsName] = 'No aplica';
          } else if (prev[studentObsName] === 'No aplica') {
            next[studentObsName] = '';
          }
        }
      }
      
      return next;
    });
  };
  // observation: string para el legacy (observation_obligatory)
  const [observation, setObservation] = useState('');
  const [code, setCode] = useState('');
  const [quantities, setQuantities] = useState({});

  // Inicializar observationValues cuando cargue el evento
  useEffect(() => {
    if (event?.observations?.length > 0) {
      const initial = {};
      event.observations.forEach(obs => { initial[obs.name] = ''; });
      setObservationValues(initial);
    }
  }, [event]);

  // Verificar si viene de confirmación de Payphone
  useEffect(() => {
    const paymentId = searchParams.get('id');
    const clientTxId = searchParams.get('clientTransactionId');
    if (paymentId && clientTxId) {
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
        state: { purchaseId: result.purchaseId, transactionId: paymentId, ticketsAcomprar, event },
      });
    } catch (err) {
      console.error('Error confirmando pago:', err);
      setError('Error al confirmar el pago. Por favor contacta a soporte.');
    }
  };

  // Cargar evento y tickets
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
    if (resolvedEventId) secureStorage.setEventId(resolvedEventId);
  }, [resolvedEventId]);

  // Inicializar cantidades
  useEffect(() => {
    const visibles = tickets.filter((t) => !t.hidden);
    const initial = {};
    if (visibles.length > 1) {
      visibles.forEach((t) => { initial[t._id] = 0; });
    } else {
      visibles.forEach((t) => {
        const min = Number(t.minimum_to_buy ?? t.minimumToBuy ?? 0);
        const maxRaw = Number(t.max_to_buy ?? t.maximum_to_buy ?? t.maxToBuy ?? 0);
        const isFixed = min > 0 && min === maxRaw && maxRaw > 0;
        initial[t._id] = isFixed ? min : Math.max(0, min);
      });
    }
    setQuantities(initial);
  }, [tickets]);

  const visibleTickets = useMemo(
    () => tickets.filter((t) => !t.hidden).sort((a, b) => a.price - b.price),
    [tickets]
  );

  const totalCost = useMemo(
    () => visibleTickets.reduce((acc, t) => acc + (quantities[t._id] || 0) * t.price, 0),
    [visibleTickets, quantities]
  );

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

  // ── Validar observaciones ────────────────────────────────────────
  const validateObservations = () => {
    // Nuevo sistema
    if (event?.observations?.length > 0) {
      for (const obs of event.observations) {
        if (obs.required && !observationValues[obs.name]?.trim()) {
          const isStudentName = obs.name.toLowerCase().includes('nombre') && obs.name.toLowerCase().includes('estudiante');
          const displayName = isStudentName ? 'Nombre hijo menor' : obs.name;
          return `El campo "${displayName}" es obligatorio`;
        }
      }
      return null;
    }
    // Legacy
    if (event?.observation_obligatory && !observation.trim()) {
      return 'La observación es obligatoria';
    }
    return null;
  };

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

  // ── Crear compra ─────────────────────────────────────────────────
  const handleBuyWithPayphone = async () => {
    if (!event) return;
    setError(null);

    // Validar code
    if (event.code && !code.trim()) {
      setError('El código es obligatorio');
      return;
    }

    // Validar observaciones
    const obsError = validateObservations();
    if (obsError) { setError(obsError); return; }

    const minError = validateMinimums();
    if (minError) { setError(minError); return; }

    const hasSelection = Object.values(quantities).some((q) => q > 0);
    if (!hasSelection) { setError('Selecciona al menos un ticket'); return; }

    setSubmitting(true);
    try {
      if (event.code) {
        await apiService.validateEventCode(resolvedEventId, code.trim());
      }

      const userProfile = await apiService.getCurrentUserProfile();

      const toBuyTickets = {};
      visibleTickets.forEach((ticket) => {
        const qty = quantities[ticket._id] || 0;
        if (qty > 0) {
          const ticketKey = JSON.stringify({
            id: ticket._id, name: ticket.name, event_id: resolvedEventId,
          });
          toBuyTickets[ticketKey] = qty;
        }
      });

      // ── Construir payload de observaciones ──────────────────────
      let obsPayload = {};
      if (event?.observations?.length > 0) {
        // Nuevo sistema: array de { name, value }
        obsPayload = {
          observations: event.observations.map(obs => ({
            name: obs.name,
            value: observationValues[obs.name]?.trim() || '',
          })),
        };
      } else if (event?.observation_obligatory) {
        // Legacy
        obsPayload = { observation: observation.trim() || undefined };
      }

      const purchaseId = await apiService.createPurchaseTicket(
        resolvedEventId,
        userProfile._id,
        { toBuyTickets, ...obsPayload, status: 'pending' }
      );

      const items = visibleTickets
        .map((t) => ({ ticket: t, qty: quantities[t._id] || 0 }))
        .filter((x) => x.qty > 0);

      localStorage.setItem('purchaseData', JSON.stringify({
        purchaseId,
        ticketsAcomprar: toBuyTickets,
        event,
        attenderId: userProfile._id,               // ← agregar
        observations: obsPayload.observations || [], // ← agregar
        observation: obsPayload.observation || null, // ← agregar
      }));
      setPurchaseCreated({ purchaseId, items, userProfile });

      if (totalCost === 0) {
        navigate('/payment-callback', {
          state: {
            purchaseId,
            ticketsAcomprar: toBuyTickets,
            event,
            isFree: true,
            attenderId: userProfile._id,                 // ← agregar
            observations: obsPayload.observations || [],  // ← agregar
            observation: obsPayload.observation || null,  // ← agregar
          },
        });
        return;
      }

      setShowPaymentBox(true);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'No se pudo crear la compra');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="purchase-page">
        <div className="loading-container">
          <div className="spinner" /><p>Cargando...</p>
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
          <button className="btn btn-primary" onClick={() => navigate('/')}>Volver</button>
        </div>
      </div>
    );
  }

  // ── Determinar si mostrar sección de observaciones ───────────────
  const hasNewObservations = event?.observations?.length > 0;
  const hasLegacyObservation = event?.observation_obligatory;
  const showObservationsSection = hasNewObservations || hasLegacyObservation || event?.code;

  return (
    <div className="purchase-page">
      <div className="event-banner">
        {bannerImageUrl && !imageError ? (
          <img src={bannerImageUrl} alt={event.name} className="event-banner-image"
            onError={() => setImageError(true)} />
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
                  const mostrarCantidadFija = visibleTickets.length > 1 && min === maxRaw && min > 0;
                  const hint = mostrarCantidadFija
                    ? `Cantidad fija: ${min}`
                    : `Mín ${min} / Máx ${maxRaw > 0 ? maxRaw : '∞'}`;

                  return (
                    <div key={t._id} className="purchase-row">
                      <div className="purchase-locality">
                        <div className="locality-name">{t.name}</div>
                        {t.description && <div className="locality-desc">{t.description}</div>}
                        {!mostrarCantidadFija && (min > 0 || maxRaw > 0) && (
                          <div className="locality-hint">{hint}</div>
                        )}
                      </div>
                      <div className="purchase-price">
                        {t.price === 0 ? 'Gratis' : `$${t.price.toFixed(2)}`}
                      </div>
                      <div className="purchase-qty">
                        {mostrarCantidadFija ? (
                          <TicketQuantitySelector
                            qty={quantities[t._id] || 0} min={0} max={min} isFixed={false}
                            onIncrement={() => setQuantities((prev) => ({ ...prev, [t._id]: min }))}
                            onDecrement={() => setQuantities((prev) => ({ ...prev, [t._id]: 0 }))}
                          />
                        ) : (
                          <TicketQuantitySelector
                            qty={quantities[t._id] || 0} min={min} max={max} isFixed={false}
                            onIncrement={() => handleQtyChange(t._id, 1, t)}
                            onDecrement={() => handleQtyChange(t._id, -1, t)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* ── Sección de observaciones y código ── */}
          {showObservationsSection && (
            <section className="purchase-card">

              {/* Nuevo sistema: campos dinámicos */}
              {hasNewObservations && [...event.observations].sort((a, b) => {
                const isStudentA = a.name.toLowerCase().includes('nombre') && a.name.toLowerCase().includes('estudiante');
                const isStudentB = b.name.toLowerCase().includes('nombre') && b.name.toLowerCase().includes('estudiante');
                if (isStudentA) return 1;
                if (isStudentB) return -1;
                return 0;
              }).map((obs) => {
                const isCourse = obs.name.toLowerCase().includes('curso');
                const isStudentName = obs.name.toLowerCase().includes('nombre') && obs.name.toLowerCase().includes('estudiante');
                
                // Determinar si el curso seleccionado actualmente es "Ident. adicional"
                const currentCourseObsName = event.observations.find(o => o.name.toLowerCase().includes('curso'))?.name;
                const currentCourseValue = currentCourseObsName ? observationValues[currentCourseObsName] : '';
                const isAdicional = currentCourseValue && COURSE_GROUPS["Ident. adicional"].includes(currentCourseValue);
                const isDisabledStudentName = isStudentName && isAdicional && observationValues[obs.name] === 'No aplica';

                const displayName = isStudentName ? 'Nombre hijo menor' : obs.name;

                return (
                  <label key={obs.name} className="form-field">
                    <span>{displayName}{obs.required ? ' (Obligatorio)' : ' (Opcional)'}</span>
                    {isCourse ? (
                      <div className="course-selection-container">
                        <div className="course-group-buttons">
                          {Object.keys(COURSE_GROUPS).map(group => (
                            <button
                              key={group}
                              type="button"
                              className={`course-group-btn ${selectedCourseGroup === group ? 'active' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedCourseGroup(group);
                                handleObservationChange(obs.name, '');
                              }}
                            >
                              {group}
                            </button>
                          ))}
                        </div>
                        {selectedCourseGroup && (
                          <select
                            value={observationValues[obs.name] || ''}
                            onChange={(e) => handleObservationChange(obs.name, e.target.value)}
                          >
                            <option value="">Selecciona un curso en {selectedCourseGroup}...</option>
                            {COURSE_GROUPS[selectedCourseGroup].map(course => (
                              <option key={course} value={course}>{course}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      <textarea
                        value={observationValues[obs.name] || ''}
                        onChange={(e) => handleObservationChange(obs.name, e.target.value)}
                        placeholder={`Ingresa ${displayName.toLowerCase()}...`}
                        disabled={isDisabledStudentName}
                      />
                    )}
                  </label>
                );
              })}

              {/* Legacy: campo único */}
              {!hasNewObservations && hasLegacyObservation && (
                <label className="form-field">
                  <span>Observación (Obligatoria)</span>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Ingresa observación..."
                  />
                </label>
              )}

              {/* Código de acceso */}
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