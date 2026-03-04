// src/utils/networkUtils.js

/**
 * Comprueba si el navegador está online.
 */
export function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Ejecuta una promesa con timeout (en ms).
 * Rechaza si se supera el tiempo.
 */
export function withTimeout(promise, ms = 15000, timeoutMsg = 'Tiempo de espera agotado') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(timeoutMsg)), ms)),
  ]);
}

/**
 * Intenta hacer un ping rápido a un recurso público para comprobar la red.
 * Devuelve true si responde, false si no.
 */
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://biodynamics.tech/macak_dev';
export async function quickPing(url = `${API_BASE_URL}/event/get_all`, ms = 4000) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}
