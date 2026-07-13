// src/pages/PaymentCallbackPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import './PaymentCallbackPage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://biodynamics.tech/macak_dev';

const createPayphoneTransaction = async ({
  attenderId,
  eventId,
  tickets,
  clientTransactionId,
  observations,
  observation,
  payphoneId,   // ← NUEVO
  statusCode = 3,
}) => {
  try {
    const body = {
      attender_id:          attenderId,
      event_id:             eventId,
      tickets:              tickets.map(t => ({ ticket_id: t.id, quantity: t.quantity })),
      clientTransaction_id: clientTransactionId,
      statusCode,
      payphone_id:          payphoneId ?? null, // ← NUEVO
    };

    if (observations && observations.length > 0) body.observations = observations;
    if (observation) body.observation = observation;

    const response = await fetch(`${BACKEND_URL}/payphone_transaction`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': localStorage.getItem('session_token') || '',
      },
      body: JSON.stringify(body),
    });

    console.log('[payphone_transaction] status:', response.status);
    const text = await response.text();
    console.log('[payphone_transaction] response:', text);

    if (!response.ok) {
      console.error('❌ Error al crear payphone_transaction:', text);
    } else {
      console.log('✅ payphone_transaction creada correctamente');
    }
  } catch (err) {
    console.error('❌ Error al crear payphone_transaction:', err);
  }
};

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando pago...');
  const [transactionId, setTransactionId] = useState(null);
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('user_id');

  const payphoneCreatedRef = useRef(false);

  useEffect(() => {
    if (payphoneCreatedRef.current) return;
    payphoneCreatedRef.current = true;

    const verifyPayment = async () => {
      try {
        // ── FLUJO COMPRA GRATUITA ────────────────────────────────────
        if (state && state.isFree) {
          console.log('[PaymentCallback] Flujo de compra gratuita (state.isFree)');
          const { purchaseId, ticketsAcomprar, event, attenderId, observations, observation } = state;

          setTransactionId(purchaseId);

          let response;
          try {
            response = await fetch(`${BACKEND_URL}/payments/confirm-free`, {
              method: 'POST',
              headers: {
                'Content-Type':  'application/json',
                'Authorization': localStorage.getItem('session_token'),
              },
              body: JSON.stringify({ purchaseId, clientTxId: purchaseId }),
            });
          } catch (fetchError) {
            throw new Error('No se pudo conectar con el servidor.');
          }

          if (!response.ok) {
            let errorMessage = 'No se pudo confirmar la compra gratuita';
            try { const t = await response.text(); if (t?.trim()) errorMessage = t; } catch {}
            throw new Error(errorMessage);
          }

          const ticketsArray = Object.entries(ticketsAcomprar || {}).map(([keyStr, qty]) => {
            try { return { ...JSON.parse(keyStr), quantity: qty }; } catch { return null; }
          }).filter(Boolean);

          // Crear payphone_transaction con payphone_id: 'Gratis'
          if (attenderId && event?._id) {
            await createPayphoneTransaction({
              attenderId,
              eventId:              event._id,
              tickets:              ticketsArray,
              clientTransactionId:  purchaseId,
              observations,
              observation,
              payphoneId:           'Gratis', // ← gratuito
              statusCode:           3,
            });
          }

          setStatus('success');
          setMessage('¡Compra gratuita realizada con éxito!');
          queryClient.invalidateQueries({ queryKey: ['myTickets', userId] });

          setTimeout(() => {
            navigate('/purchase-confirmation', {
              state: { purchaseId, transactionId: purchaseId, ticketsAcomprar, event },
            });
          }, 2000);
          return;
        }

        // ── FLUJO NORMAL PAYPHONE ────────────────────────────────────
        const txId =
          searchParams.get('id') ||
          searchParams.get('transaction_id') ||
          searchParams.get('transactionId');
        const clientTxId =
          searchParams.get('clientTransactionId') ||
          searchParams.get('reference') ||
          searchParams.get('client_tx');

        console.log('[PaymentCallback] Flujo normal Payphone:', { txId, clientTxId });

        if (!txId) throw new Error('No se encontró ID de transacción');

        setTransactionId(txId);

        const purchaseDataStr = localStorage.getItem('purchaseData');
        if (!purchaseDataStr) throw new Error('No se encontraron datos de la compra');

        const {
          purchaseId,
          ticketsAcomprar,
          event,
          attenderId,
          observations,
          observation,
        } = JSON.parse(purchaseDataStr);

        let response;
        try {
          response = await fetch(`${BACKEND_URL}/payments/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': localStorage.getItem('session_token'),
            },
            body: JSON.stringify({
              paymentId:  txId,
              clientTxId: clientTxId || txId,
              purchaseId,
            }),
          });
        } catch (fetchError) {
          throw new Error('No se pudo conectar con el servidor.');
        }

        const contentType = response.headers.get('content-type');
        const hasJson = contentType && contentType.includes('application/json');

        if (!response.ok) {
          let errorMessage = 'No se pudo confirmar el pago';
          if (hasJson) {
            try {
              const errData = await response.json();
              errorMessage = errData?.error || errData?.details || errorMessage;
            } catch {
              const t = await response.text().catch(() => '');
              if (t?.trim()) errorMessage = t;
              else errorMessage = `Error del servidor (${response.status})`;
            }
          } else {
            const t = await response.text().catch(() => '');
            errorMessage = t?.trim() || `Error del servidor (${response.status})`;
          }
          throw new Error(errorMessage);
        }

        if (hasJson) {
          try { await response.json(); } catch {}
        }

        const ticketsArray = Object.entries(ticketsAcomprar || {}).map(([keyStr, qty]) => {
          try { return { ...JSON.parse(keyStr), quantity: qty }; } catch { return null; }
        }).filter(Boolean);

        // Crear payphone_transaction con payphone_id: txId (ID real de Payphone)
        if (attenderId && event?._id) {
          await createPayphoneTransaction({
            attenderId,
            eventId:              event._id,
            tickets:              ticketsArray,
            clientTransactionId:  clientTxId || txId,
            observations,
            observation,
            payphoneId:           txId, // ← ID real de Payphone
            statusCode:           3,
          });
        }

        setStatus('success');
        setMessage('¡Pago realizado con éxito!');
        queryClient.invalidateQueries({ queryKey: ['myTickets', userId] });
        localStorage.removeItem('purchaseData');

        setTimeout(() => {
          navigate('/purchase-confirmation', {
            state: { purchaseId, transactionId: txId, ticketsAcomprar, event },
          });
        }, 2000);

      } catch (error) {
        console.error('Error verificando pago:', error);
        setStatus('error');
        setMessage(`Error: ${error.message}`);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, state]);

  return (
    <div className="payment-callback-page">
      <div className="callback-container">
        {status === 'loading' && (
          <div className="loading">
            <div className="spinner"></div>
            <p>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="success">
            <div className="success-icon">✓</div>
            <h2>¡Pago Exitoso!</h2>
            <p>{message}</p>
            <p className="transaction-id">ID Transacción: {transactionId}</p>
          </div>
        )}

        {status === 'failure' && (
          <div className="failure">
            <div className="failure-icon">✕</div>
            <h2>Pago Fallido</h2>
            <p>{message}</p>
            <button className="btn-retry" onClick={() => navigate(-1)}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="error">
            <h2>Error en la Transacción</h2>
            <p>{message}</p>
            <button className="btn-retry" onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </div>
        )}

        {status === 'pending' && (
          <div className="pending">
            <div className="spinner"></div>
            <h2>Pago Pendiente</h2>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;