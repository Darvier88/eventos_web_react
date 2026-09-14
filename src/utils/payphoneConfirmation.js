// src/utils/payphoneConfirmation.js

/**
 * Interpreta la respuesta de apiService.confirmPayphonePayment().
 *
 * El backend (/payments/confirm) anida la respuesta de PayPhone:
 *   HTTP ok    → { purchaseId, status, raw: <respuesta de PayPhone> }
 *   HTTP error → { error, details: <respuesta de PayPhone u otro detalle> }
 * y confirmPayphonePayment lo envuelve otra vez en { ok, status, raw: <body> }.
 * Por eso los datos de PayPhone están en result.raw.raw, no en result.raw.
 *
 * El backend responde 200 aunque PayPhone diga "cancelado", así que la
 * aprobación se decide por statusCode === 3 y no solo por el HTTP.
 *
 * @param {{ ok: boolean, status: number, raw: Object|null }} result
 * @returns {{ approved: boolean, cancelled: boolean, statusCode: number|null,
 *             clientTransactionId: string|null, amountUsd: number|null }}
 */
export function readPayphoneConfirmation(result) {
  const body = result?.raw ?? null;
  const payphone = body?.raw ?? body?.details ?? null;
  const statusCode = typeof payphone?.statusCode === 'number' ? payphone.statusCode : null;

  return {
    approved: Boolean(result?.ok) && statusCode === 3,
    cancelled: statusCode === 2,
    statusCode,
    clientTransactionId: payphone?.clientTransactionId ?? null,
    // PayPhone expresa el monto en centavos
    amountUsd: typeof payphone?.amount === 'number' ? payphone.amount / 100 : null,
  };
}
