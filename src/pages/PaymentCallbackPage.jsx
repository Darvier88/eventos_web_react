// src/pages/PaymentCallbackPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './PaymentCallbackPage.css';

const PaymentCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verificando pago...');
  const [transactionId, setTransactionId] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Payphone retorna "id" y "clientTransactionId" en el callback
        const txId =
          searchParams.get('id') ||
          searchParams.get('transaction_id') ||
          searchParams.get('transactionId');
        const clientTxId =
          searchParams.get('clientTransactionId') ||
          searchParams.get('reference') ||
          searchParams.get('client_tx');

        // Log para debugging
        console.log('[PaymentCallback] Parámetros recibidos:', {
          txId,
          clientTxId,
          allParams: Array.from(searchParams.entries()),
        });

        if (!txId) {
          throw new Error('No se encontró ID de transacción');
        }

        if (!clientTxId) {
          console.warn('[PaymentCallback] clientTxId no encontrado, usando txId como fallback');
        }

        setTransactionId(txId);

        // Recuperar datos guardados en localStorage
        const purchaseDataStr = localStorage.getItem('purchaseData');
        if (!purchaseDataStr) {
          throw new Error('No se encontraron datos de la compra');
        }

        const { purchaseId, ticketsAcomprar, event } = JSON.parse(purchaseDataStr);

        // Confirmar pago con el backend
        const confirmPayload = { 
          paymentId: txId, 
          clientTxId: clientTxId || txId // usar txId como fallback si clientTxId no existe
        };


        let response;
        try {
          response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'https://biodynamics.tech/macak_dev'}/payments/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': localStorage.getItem('session_token'),
            },
            body: JSON.stringify(confirmPayload),
          });
        } catch (fetchError) {
          console.error('[PaymentCallback] ❌ Error de red al conectar con backend:', fetchError);
          throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
        }


        // Verificar si la respuesta tiene contenido
        const contentType = response.headers.get('content-type');
        const hasJsonContent = contentType && contentType.includes('application/json');
        
        if (!response.ok) {
          let errorMessage = 'No se pudo confirmar el pago';
          let errorDetails = null;
          
          if (hasJsonContent) {
            try {
              errorDetails = await response.json();
              console.error('[PaymentCallback] Error del servidor (JSON):', errorDetails);
              errorMessage = errorDetails?.error || errorDetails?.details || errorMessage;
            } catch (e) {
              console.error('[PaymentCallback] Error parseando JSON de error:', e);
              // Intentar obtener texto plano
              try {
                const textError = await response.text();
                console.error('[PaymentCallback] Longitud de respuesta texto:', textError.length);
                console.error('[PaymentCallback] Respuesta como texto:', `"${textError}"`);
                if (textError && textError.trim()) {
                  errorMessage = textError;
                } else {
                  errorMessage = `Error del servidor (código ${response.status})`;
                }
              } catch (e2) {
                console.error('[PaymentCallback] No se pudo leer respuesta:', e2);
                errorMessage = `Error del servidor (código ${response.status})`;
              }
            }
          } else {
            // No es JSON, intentar leer como texto
            try {
              const textError = await response.text();
              console.error('[PaymentCallback] Longitud de respuesta texto:', textError.length);
              console.error('[PaymentCallback] Error del servidor (texto):', `"${textError}"`);
              if (textError && textError.trim()) {
                errorMessage = textError;
              } else {
                errorMessage = `Error del servidor (código ${response.status}). Backend devolvió respuesta vacía.`;
              }
            } catch (e) {
              console.error('[PaymentCallback] No se pudo leer respuesta:', e);
              errorMessage = `Error del servidor (código ${response.status})`;
            }
          }
          
          throw new Error(errorMessage);
        }

        // Parsear respuesta exitosa si hay contenido JSON
        let confirmResult = null;
        if (hasJsonContent) {
          try {
            confirmResult = await response.json();
          } catch (e) {
            console.warn('No se pudo parsear JSON de respuesta exitosa:', e);
          }
        }
        
        setStatus('success');
        setMessage('¡Pago realizado con éxito!');

        // Limpiar localStorage
        localStorage.removeItem('purchaseData');

        // Redirigir a confirmación después de 2 segundos
        setTimeout(() => {
          navigate('/purchase-confirmation', {
            state: { 
              purchaseId, 
              transactionId: txId,
              ticketsAcomprar,
              event,
            },
          });
        }, 2000);
      } catch (error) {
        console.error('Error verificando pago:', error);
        setStatus('error');
        setMessage(`Error: ${error.message}`);
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

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
