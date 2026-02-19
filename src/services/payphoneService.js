// src/services/payphoneService.js
/**
 * Servicio para integración con Payphone
 * Documentación: https://developer.payphone.com.ar
 */

const PAYPHONE_CONFIG = {
  merchantId: import.meta.env.VITE_PAYPHONE_MERCHANT_ID,
  publicKey: import.meta.env.VITE_PAYPHONE_PUBLIC_KEY,
  apiUrl: import.meta.env.VITE_PAYPHONE_API_URL || 'https://api.payphone.com.ar',
  callbackUrl: import.meta.env.VITE_APP_CALLBACK_URL,
};

/**
 * Valida que las credenciales de Payphone estén configuradas
 */
export const isPayphoneConfigured = () => {
  return !!(PAYPHONE_CONFIG.merchantId && PAYPHONE_CONFIG.publicKey);
};

/**
 * Inicia el proceso de pago con Payphone a través del backend
 * El backend se encarga de la comunicación segura con Payphone API
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise<Object>} - Respuesta con transaction token
 */
export const initiatePayment = async (paymentData) => {
  if (!isPayphoneConfigured()) {
    throw new Error('Payphone no está configurado correctamente');
  }

  const {
    purchaseId,
    amount,
    currency = 'ARS',
    description,
    customerEmail,
    customerPhone,
  } = paymentData;

  const payload = {
    reference: purchaseId,
    amount: Math.round(amount * 100), // Convertir a centavos
    currency,
    description: description || 'Compra de tickets',
    customerEmail,
    customerPhone,
  };

  try {
    // Llamar al BACKEND para que cree la transacción de forma segura
    // El backend usa la Secret Key de Payphone (nunca expuesta al cliente)
    const response = await fetch('/api/payments/payphone/create-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Error al crear transacción: ${response.statusText}`);
    }

    const transactionData = await response.json();
    return transactionData;
  } catch (error) {
    console.error('Error en initiatePayment:', error);
    throw error;
  }
};

/**
 * Abre el widget de Payphone para completar el pago
 * @param {string} transactionToken - Token de transacción retornado por el backend
 */
export const openPayphoneWidget = (transactionToken) => {
  if (!window.Payphone) {
    throw new Error('Widget de Payphone no está cargado. Asegúrate de tener el script de Payphone en index.html');
  }

  window.Payphone.openPaymentWidget(transactionToken, {
    onSuccess: (result) => {
      console.log('Pago exitoso:', result);
      window.location.href = '/payment-success';
    },
    onFailure: (error) => {
      console.error('Error en pago:', error);
      window.location.href = '/payment-failure';
    },
    onCancel: () => {
      console.log('Pago cancelado por el usuario');
    },
  });
};

/**
 * Verifica el estado de una transacción a través del backend
 * @param {string} transactionId - ID de la transacción
 */
export const getTransactionStatus = async (transactionId) => {
  if (!isPayphoneConfigured()) {
    throw new Error('Payphone no está configurado correctamente');
  }

  try {
    const response = await fetch(`/api/payments/payphone/transaction-status/${transactionId}`, {
      headers: {
        'Authorization': localStorage.getItem('session_token'),
      },
    });

    if (!response.ok) {
      throw new Error(`Error al obtener estado: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en getTransactionStatus:', error);
    throw error;
  }
};

export default {
  isPayphoneConfigured,
  initiatePayment,
  openPayphoneWidget,
  getTransactionStatus,
};
