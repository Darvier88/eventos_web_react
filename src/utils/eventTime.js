/**
 * Fechas de eventos.
 *
 * Se cargan desde macak_tools como hora de Ecuador ("2026-10-17 10:00:00") y
 * el servidor, que corre en UTC, las guarda con esa misma hora. O sea que el
 * instante almacenado (10:00Z) no es el real (15:00Z): es la hora de pared de
 * Ecuador con una Z pegada. De ahí que haga falta leerlas de dos maneras:
 *
 *   - `eventWallClock`: para MOSTRAR. Devuelve la hora tal como se cargó, sin
 *     importar la zona horaria del navegador. Sin esto, en Ecuador un evento
 *     de las 10:00 se veía a las 05:00.
 *   - `eventInstant`: para COMPARAR contra el reloj (si ya empezó o terminó).
 *
 * Ecuador continental es UTC-5 todo el año: no tiene horario de verano.
 */
const EVENT_UTC_OFFSET_HOURS = -5;

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** La fecha tal como se cargó, para mostrarla. null si no hay fecha válida. */
export const eventWallClock = (value) => {
  const date = parseDate(value);
  return date ? new Date(date.getTime() + date.getTimezoneOffset() * 60000) : null;
};

/** El momento real en que ocurre, para comparar con ahora. */
export const eventInstant = (value) => {
  const date = parseDate(value);
  return date ? new Date(date.getTime() - EVENT_UTC_OFFSET_HOURS * 3600000) : null;
};

/**
 * true si el evento ya terminó. Sin hora de fin se toma la de inicio, que es
 * como venía funcionando en las pantallas que bloquean compras y QR.
 */
export const hasEventEnded = (event) => {
  const end = eventInstant(event?.end_date || event?.start_date);
  return end ? Date.now() > end.getTime() : false;
};

/** Horas que faltan para que empiece (negativo si ya empezó). */
export const hoursUntilEvent = (event) => {
  const start = eventInstant(event?.start_date);
  return start ? (start.getTime() - Date.now()) / 3600000 : null;
};

/** Evento de prueba: va al final de las listas, no entre los reales. */
export const isDemoEvent = (event) => /^demo\b/i.test((event?.name || '').trim());

const startTime = (event) => eventInstant(event?.start_date)?.getTime() ?? Infinity;

/**
 * Orden de las listas de eventos:
 *   1. Los que todavía no terminaron, del más próximo al más lejano.
 *   2. Los que ya pasaron, del más reciente al más antiguo.
 *   3. Los de demostración, siempre al final.
 *
 * Antes se ordenaba solo por fecha de inicio, así que los eventos viejos
 * encabezaban la lista y el próximo quedaba enterrado.
 */
export const sortEventsForDisplay = (events = []) =>
  [...events].sort((a, b) => {
    const demoA = isDemoEvent(a);
    const demoB = isDemoEvent(b);
    if (demoA !== demoB) return demoA ? 1 : -1;

    const endedA = hasEventEnded(a);
    const endedB = hasEventEnded(b);
    if (endedA !== endedB) return endedA ? 1 : -1;

    // Los terminados, al revés: primero el que acaba de pasar.
    return endedA ? startTime(b) - startTime(a) : startTime(a) - startTime(b);
  });
