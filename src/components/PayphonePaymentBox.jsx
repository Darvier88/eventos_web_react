// src/components/PayphonePaymentBox.jsx
import React, { useEffect, useRef } from 'react';

/**
 * Componente que envuelve la "Cajita de Pagos" de Payphone
 * Documentación: https://docs.payphonetodoesposible.com/cajita-de-pagos
 */
const PayphonePaymentBox = ({
  token,
  clientTransactionId,
  amount,
  currency = 'ARS',
  amountWithTax,
  amountWithoutTax,
  tax,
  service,
  tip,
  storeId,
  reference,
  phoneNumber,
  email,
  documentId,
  identificationType = 1,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Esperar a que el DOM esté listo y Payphone esté cargado
    const initPaymentBox = () => {
      if (!window.PPaymentButtonBox) {
        console.error('Payphone Payment Box no está cargado');
        return;
      }

      try {
        // Limpiar contenedor previo si existe
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Desglose de montos (Payphone requiere que amount = sumatoria)
        const totalCents = Math.round(amount * 100);
        const breakdown = {
          amountWithoutTax: amountWithoutTax ?? totalCents,
          amountWithTax: amountWithTax ?? 0,
          tax: tax ?? 0,
          service: service ?? 0,
          tip: tip ?? 0,
        };

        const computedAmount =
          breakdown.amountWithoutTax +
          breakdown.amountWithTax +
          breakdown.tax +
          breakdown.service +
          breakdown.tip;

        if (!storeId) {
          console.error('Payphone Payment Box: storeId no definido');
          return;
        }

        // Crear instancia de la Cajita de Pagos
        const ppb = new window.PPaymentButtonBox({
          token,
          clientTransactionId,
          amount: computedAmount,
          amountWithTax: breakdown.amountWithTax,
          amountWithoutTax: breakdown.amountWithoutTax,
          tax: breakdown.tax,
          service: breakdown.service,
          tip: breakdown.tip,
          currency,
          storeId,
          reference,
          lang: 'es',
          defaultMethod: 'payphone', // Mostrar Payphone por defecto
          timeZone: -3, // Argentina UTC-3
          phoneNumber,
          email,
          documentId,
          identificationType,
        });

        // Renderizar el botón en el contenedor
        ppb.render('payphone-payment-box');

        // Configurar listeners si el widget los soporta
        window.addEventListener('payphone-success', (event) => {
          console.log('Pago exitoso:', event.detail);
          if (onPaymentSuccess) {
            onPaymentSuccess(event.detail);
          }
        });

        window.addEventListener('payphone-error', (event) => {
          console.error('Error en pago:', event.detail);
          if (onPaymentError) {
            onPaymentError(event.detail);
          }
        });
      } catch (error) {
        console.error('Error inicializando Payphone Payment Box:', error);
        if (onPaymentError) {
          onPaymentError(error);
        }
      }
    };

    // Esperar a que el script se cargue
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initPaymentBox);
    } else {
      initPaymentBox();
    }

    return () => {
      document.removeEventListener('DOMContentLoaded', initPaymentBox);
    };
  }, [token, clientTransactionId, amount, currency, storeId, reference, phoneNumber, email, documentId, identificationType, onPaymentSuccess, onPaymentError]);

  return (
    <div
      ref={containerRef}
      id="payphone-payment-box"
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100px',
      }}
    />
  );
};

export default PayphonePaymentBox;
