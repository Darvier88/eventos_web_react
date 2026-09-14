// src/services/rechargeStore.js
// Helpers de localStorage para el flujo de recarga de pulseras.
// Mismo patrón que prechargeStore, con su propia clave para no mezclar flujos.

const STORAGE_KEY = 'recharge_records';

/**
 * Lee todos los registros de recarga del localStorage.
 * @returns {Object} mapa { [clientTxId]: record }
 */
function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Escribe todos los registros en el localStorage.
 */
function writeAll(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore storage errors
  }
}

/**
 * Clasifica la respuesta de apiService.rechargeTokenAttender():
 *  - 'applied'  → el saldo se sumó a la pulsera.
 *  - 'rejected' → el backend lo rechazó ANTES de escribir nada (401 de sesión,
 *                 404 de pulsera, o error de validación). Es seguro reintentar.
 *  - 'unknown'  → cualquier otro error. El controlador responde 400 a toda
 *                 excepción, incluso si ya sumó el saldo, así que reintentar
 *                 podría duplicar la recarga.
 */
export function classifyRechargeResponse({ ok, status, data }) {
  if (ok) return 'applied';
  if (status === 401 || status === 404) return 'rejected';
  if (status === 400 && data?.name === 'ValidationError') return 'rejected';
  return 'unknown';
}

const rechargeStore = {
  /**
   * Crea un nuevo registro de recarga.
   * @param {Object} record
   * @param {string} record.clientTxId     - "REC-..." (único, ≤50 chars)
   * @param {string} record.tokenId        - _id de la pulsera
   * @param {string} record.tokenCode      - código visible de la pulsera (para soporte)
   * @param {string} record.eventId
   * @param {number} record.amount         - monto solicitado en USD (ej: 10.50)
   * @param {number} record.balanceBefore  - saldo de la pulsera antes del pago
   */
  create({ clientTxId, tokenId, tokenCode, eventId, amount, balanceBefore }) {
    const records = readAll();
    const now = Date.now();
    records[clientTxId] = {
      clientTxId,
      tokenId,
      tokenCode,
      eventId,
      amount,
      balanceBefore,
      // pending | confirming | paid | applying | done | cancelled | ambiguous | dismissed
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    writeAll(records);
    return records[clientTxId];
  },

  /**
   * Obtiene un registro por clientTxId.
   * @returns {Object|null}
   */
  get(clientTxId) {
    const records = readAll();
    return records[clientTxId] ?? null;
  },

  /**
   * Actualiza campos de un registro existente.
   * @param {string} clientTxId
   * @param {Object} updates
   */
  update(clientTxId, updates) {
    const records = readAll();
    if (!records[clientTxId]) return;
    records[clientTxId] = { ...records[clientTxId], ...updates, updatedAt: Date.now() };
    writeAll(records);
    return records[clientTxId];
  },

  /**
   * Devuelve todos los registros como array.
   */
  list() {
    return Object.values(readAll());
  },

  /**
   * Elimina un registro.
   */
  remove(clientTxId) {
    const records = readAll();
    delete records[clientTxId];
    writeAll(records);
  },
};

export default rechargeStore;
