// src/pages/PaymentCallbackPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import apiService from '../services/apiService';
import prechargeStore from '../services/prechargeStore';
import rechargeStore, { classifyRechargeResponse } from '../services/rechargeStore';
import { readPayphoneConfirmation } from '../utils/payphoneConfirmation';
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
  // A dónde lleva el botón de la pantalla de error (las recargas vuelven a Recargas)
  const [errorAction, setErrorAction] = useState({ path: '/', label: 'Volver al inicio' });

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

        // ── FLUJO RECARGA DE PULSERA (clientTransactionId empieza con "REC-") ──
        if (clientTxId && clientTxId.startsWith('REC-')) {
          console.log('[PaymentCallback] Flujo de recarga detectado:', clientTxId);
          setErrorAction({ path: '/recharges', label: 'Ir a Recargas' });

          const record = rechargeStore.get(clientTxId);
          if (!record) {
            throw new Error(
              `No se encontró el registro de la recarga. Código de referencia: ${clientTxId}. Contacta a soporte.`
            );
          }

          const goToRecharges = () => setTimeout(() => navigate('/recharges'), 2500);

          // Guard: ya aplicada → mostrar éxito sin volver a sumar saldo
          if (record.status === 'done') {
            setStatus('success');
            setMessage('¡Recarga ya aplicada! No se volvió a sumar el saldo.');
            queryClient.invalidateQueries({ queryKey: ['myTokens', userId] });
            goToRecharges();
            return;
          }

          if (record.status === 'cancelled') {
            setStatus('failure');
            setMessage('Este pago fue cancelado. No se realizó ningún cargo.');
            return;
          }

          // Una ejecución anterior se interrumpió a mitad del proceso: no se sabe
          // si se cobró o si ya se sumó el saldo, así que no se reintenta.
          if (record.status !== 'pending' && record.status !== 'paid') {
            rechargeStore.update(clientTxId, { status: 'ambiguous' });
            throw new Error(
              `No pudimos verificar el estado de esta recarga. No la repitas: contacta a soporte con el código ${clientTxId}.`
            );
          }

          let confirmedAmount = record.confirmedAmount ?? record.amount;

          if (record.status === 'pending') {
            // Confirmar con backend (purchaseId = clientTxId → no toca ninguna orden)
            rechargeStore.update(clientTxId, { status: 'confirming', payphoneId: txId });
            let confirmation;
            try {
              confirmation = readPayphoneConfirmation(
                await apiService.confirmPayphonePayment({
                  paymentId: txId,
                  clientTxId,
                  purchaseId: clientTxId,
                })
              );
            } catch (confirmErr) {
              rechargeStore.update(clientTxId, { status: 'ambiguous' });
              throw new Error(
                `No se pudo confirmar el pago. No lo repitas: contacta a soporte con el código ${clientTxId}.`
              );
            }

            if (confirmation.cancelled) {
              rechargeStore.update(clientTxId, { status: 'cancelled' });
              setStatus('failure');
              setMessage('Pago cancelado. No se realizó ningún cargo.');
              return;
            }

            if (
              !confirmation.approved ||
              (confirmation.clientTransactionId && confirmation.clientTransactionId !== clientTxId)
            ) {
              rechargeStore.update(clientTxId, { status: 'ambiguous' });
              throw new Error(
                `No pudimos verificar el pago. No lo repitas: contacta a soporte con el código ${clientTxId}.`
              );
            }

            // El monto que cobró Payphone, no el que se pidió
            confirmedAmount = confirmation.amountUsd ?? record.amount;
            rechargeStore.update(clientTxId, { status: 'paid', confirmedAmount });
          }

          // Sumar el saldo a la pulsera
          rechargeStore.update(clientTxId, { status: 'applying' });
          let outcome = 'unknown';
          try {
            outcome = classifyRechargeResponse(
              await apiService.rechargeTokenAttender(record.tokenId, confirmedAmount)
            );
          } catch (applyErr) {
            console.error('[Recarga] Error al aplicar:', applyErr);
          }

          if (outcome === 'rejected') {
            // El backend no escribió nada: queda pagada para reintentar desde Recargas
            rechargeStore.update(clientTxId, { status: 'paid' });
            throw new Error(
              `El pago se aprobó, pero no se pudo aplicar la recarga. Puedes reintentarlo desde Recargas (código ${clientTxId}).`
            );
          }

          if (outcome === 'unknown') {
            rechargeStore.update(clientTxId, { status: 'ambiguous' });
            throw new Error(
              `El pago se aprobó, pero no pudimos verificar si el saldo se aplicó. No lo repitas: contacta a soporte con el código ${clientTxId}.`
            );
          }

          rechargeStore.update(clientTxId, { status: 'done' });
          setStatus('success');
          setMessage(`¡Recarga de $${confirmedAmount.toFixed(2)} aplicada a la pulsera ${record.tokenCode}!`);
          queryClient.invalidateQueries({ queryKey: ['myTokens', userId] });
          goToRecharges();
          return;
        }

        // ── FLUJO PRECARGA (clientTransactionId empieza con "PRE-") ──
        if (clientTxId && clientTxId.startsWith('PRE-')) {
          console.log('[PaymentCallback] Flujo de precarga detectado:', clientTxId);

          const record = prechargeStore.get(clientTxId);
          if (!record) {
            throw new Error(
              `No se encontró el registro de precarga. Código de referencia: ${clientTxId}. Contacta a soporte.`
            );
          }

          // Guard: ya procesado → mostrar éxito sin duplicar
          if (record.status === 'done') {
            setStatus('success');
            setMessage('¡Precarga ya registrada! No se ha duplicado el cobro.');
            queryClient.invalidateQueries({ queryKey: ['myTickets', userId] });
            setTimeout(() => {
              navigate(record.eventId ? `/evento/${record.eventId}` : '/my-tickets');
            }, 2000);
            return;
          }

          // Confirmar con backend (purchaseId = clientTxId → no toca ninguna orden)
          prechargeStore.update(clientTxId, { status: 'confirming' });
          let confirmResult;
          try {
            confirmResult = await apiService.confirmPayphonePayment({
              paymentId: txId,
              clientTxId,
              purchaseId: clientTxId,
            });
          } catch (confirmErr) {
            prechargeStore.update(clientTxId, { status: 'ambiguous' });
            throw new Error(
              `No se pudo confirmar el pago. Código de referencia: ${clientTxId}. Contacta a soporte.`
            );
          }

          // Validar que Payphone aprobó el cobro (statusCode 3 = aprobado).
          // Los datos de PayPhone vienen anidados en la respuesta del backend:
          // ver readPayphoneConfirmation.
          const confirmation = readPayphoneConfirmation(confirmResult);

          if (confirmation.cancelled) {
            prechargeStore.update(clientTxId, { status: 'cancelled' });
            setStatus('failure');
            setMessage('Pago cancelado. No se realizó ningún cargo.');
            return;
          }

          if (!confirmation.approved) {
            // Sin una aprobación clara el pago pudo cobrarse: no marcar como cancelado
            prechargeStore.update(clientTxId, { status: 'ambiguous' });
            throw new Error(
              `No pudimos verificar el pago. Código de referencia: ${clientTxId}. Contacta a soporte.`
            );
          }

          // Validar que el clientTransactionId coincide (defensa adicional)
          if (confirmation.clientTransactionId && confirmation.clientTransactionId !== clientTxId) {
            prechargeStore.update(clientTxId, { status: 'ambiguous' });
            throw new Error(
              `Discrepancia en el ID de transacción. Código de referencia: ${clientTxId}. Contacta a soporte.`
            );
          }

          // El monto que cobró Payphone (en centavos → convertir a USD)
          const confirmedAmount = confirmation.amountUsd ?? record.amount;

          // Registrar precarga en backend
          prechargeStore.update(clientTxId, { status: 'registering' });
          try {
            await apiService.createPrechargeTransaction(record.purchaseTicketId, confirmedAmount);
          } catch (regErr) {
            console.error('[Precarga] Error al registrar:', regErr);
            // No marcamos como 'done' para que la reconciliación lo reintente
            prechargeStore.update(clientTxId, { status: 'registering' });
            throw new Error(
              `Pago aprobado pero no se pudo registrar la precarga. Código: ${clientTxId}. Contacta a soporte.`
            );
          }

          prechargeStore.update(clientTxId, { status: 'done' });
          setStatus('success');
          setMessage(`¡Precarga de $${confirmedAmount.toFixed(2)} registrada correctamente!`);
          queryClient.invalidateQueries({ queryKey: ['myTickets', userId] });

          setTimeout(() => {
            navigate(record.eventId ? `/evento/${record.eventId}` : '/my-tickets');
          }, 2000);
          return;
        }



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
            <button className="btn-retry" onClick={() => navigate(errorAction.path)}>
              {errorAction.label}
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