// src/services/prechargeStore.js
// Helpers de localStorage para el flujo de precarga.
// Permite crear, leer, actualizar y listar registros por clientTxId.

const STORAGE_KEY = 'precharge_records';

/**
 * Lee todos los registros de precarga del localStorage.
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

const prechargeStore = {
  /**
   * Crea un nuevo registro de precarga.
   * @param {Object} record
   * @param {string} record.clientTxId        - "PRE-..." (único, ≤50 chars)
   * @param {string} record.purchaseTicketId  - _id de la orden
   * @param {string} record.eventId
   * @param {number} record.amount            - monto en USD (ej: 10.50)
   * @param {number} record.prechargeBefore   - precharge_amount antes del pago
   */
  create({ clientTxId, purchaseTicketId, eventId, amount, prechargeBefore }) {
    const records = readAll();
    records[clientTxId] = {
      clientTxId,
      purchaseTicketId,
      eventId,
      amount,
      prechargeBefore,
      status: 'pending',     // pending | confirming | registering | done | cancelled | ambiguous
      createdAt: Date.now(),
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
    records[clientTxId] = { ...records[clientTxId], ...updates };
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

export default prechargeStore;
