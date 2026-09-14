// src/pages/RechargesPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/apiService';
import rechargeStore, { classifyRechargeResponse } from '../services/rechargeStore';
import PayphonePaymentBox from '../components/PayphonePaymentBox';
import './RechargesPage.css';

const AMOUNT_OPTIONS = [5, 10, 20];
const MIN_AMOUNT = 1;

// PayPhone reversa los pagos que no se confirman en los primeros 5 minutos.
const CONFIRM_WINDOW_MS = 5 * 60 * 1000;

// Un callback que lleva este tiempo sin actualizar su registro fue interrumpido
// (se cerró la pestaña o se recargó la página a mitad del proceso).
const STALE_STEP_MS = 60 * 1000;

/**
 * Paleta determinista por pulsera: el mismo código recibe siempre el mismo
 * color. Replica el hash de la app móvil (user_recharges_screen.dart), así una
 * pulsera se ve igual en la app y en la web.
 */
const BAND_PALETTES = [
  { start: '#1650DB', end: '#3F2FD0', dot: '#1650DB' },
  { start: '#E0559A', end: '#B5279D', dot: '#D6489A' },
  { start: '#C98A12', end: '#A35D00', dot: '#C98A12' },
  { start: '#0EA5A5', end: '#0F766E', dot: '#0EA5A5' },
  { start: '#7C3AED', end: '#5B21B6', dot: '#7C3AED' },
];

function paletteFor(code = '') {
  if (!code) return BAND_PALETTES[0];
  let hash = 7;
  for (let i = 0; i < code.length; i += 1) {
    hash = (hash * 31 + code.charCodeAt(i)) & 0x7fffffff;
  }
  return BAND_PALETTES[hash % BAND_PALETTES.length];
}

/**
 * Genera un clientTransactionId único con prefijo "REC-".
 * El prefijo es lo que usa PaymentCallbackPage para reconocer una recarga.
 * Payphone limita a 50 caracteres.
 */
function generateClientTxId() {
  const uuid = crypto.randomUUID().replace(/-/g, '').slice(0, 30);
  return `REC-${uuid}`;
}

const money = (value) => `$${(Number(value) || 0).toFixed(2)}`;

function formatDate(timestamp) {
  if (!timestamp) return null;
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

const ContactlessIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M8.5 8.5a5 5 0 0 1 0 7" />
    <path d="M12 6a8.5 8.5 0 0 1 0 12" />
    <path d="M15.5 3.5a12 12 0 0 1 0 17" />
  </svg>
);

const RechargesPage = () => {
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('user_id');

  const {
    data: tokens = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['myTokens', userId],
    queryFn: () => apiService.getTokensByAttender(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  // Se guarda el id y no el objeto: tras un refetch llegan objetos nuevos.
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(10); // null = "Otro"
  const [customAmount, setCustomAmount] = useState('');
  const [formError, setFormError] = useState(null);
  const [checkout, setCheckout] = useState(null); // { clientTxId, amount, token }
  const [pendingRecords, setPendingRecords] = useState([]);
  const [retryingTxId, setRetryingTxId] = useState(null);
  const [retryMessage, setRetryMessage] = useState(null);

  const selected = useMemo(
    () => tokens.find((t) => t._id === selectedTokenId) || tokens[0] || null,
    [tokens, selectedTokenId]
  );

  const amountValue = selectedAmount ?? parseFloat(customAmount);
  const hasValidAmount = Number.isFinite(amountValue) && amountValue >= MIN_AMOUNT;

  // ── Recargas que quedaron a medias ───────────────────────────────
  // El pago termina en PaymentCallbackPage; aquí se retoman los casos en los
  // que ese proceso se interrumpió.
  const refreshRecords = useCallback(() => {
    const now = Date.now();
    rechargeStore.list().forEach((rec) => {
      if (rec.status === 'pending' && now - rec.createdAt > CONFIRM_WINDOW_MS) {
        // Nunca se confirmó: PayPhone ya lo reversó, no hubo cobro.
        rechargeStore.update(rec.clientTxId, { status: 'cancelled' });
      } else if (
        (rec.status === 'confirming' || rec.status === 'applying') &&
        now - (rec.updatedAt || rec.createdAt) > STALE_STEP_MS
      ) {
        // Se interrumpió sin respuesta: no se sabe si se cobró o se aplicó.
        rechargeStore.update(rec.clientTxId, { status: 'ambiguous' });
      }
    });
    setPendingRecords(
      rechargeStore
        .list()
        .filter((rec) => rec.status === 'paid' || rec.status === 'ambiguous')
        .sort((a, b) => b.createdAt - a.createdAt)
    );
  }, []);

  useEffect(() => {
    refreshRecords();
  }, [refreshRecords]);

  // Solo se reintentan recargas en estado 'paid': cobradas y confirmadas, y
  // con la certeza de que el backend no sumó el saldo.
  const handleRetry = async (rec) => {
    setRetryMessage(null);
    setRetryingTxId(rec.clientTxId);
    rechargeStore.update(rec.clientTxId, { status: 'applying' });

    let outcome = 'unknown';
    let status = null;
    try {
      const result = await apiService.rechargeTokenAttender(rec.tokenId, rec.confirmedAmount ?? rec.amount);
      status = result.status;
      outcome = classifyRechargeResponse(result);
    } catch (err) {
      console.error('[Recargas] Error al reintentar:', err);
    }

    if (outcome === 'applied') {
      rechargeStore.update(rec.clientTxId, { status: 'done' });
      queryClient.invalidateQueries({ queryKey: ['myTokens', userId] });
      setRetryMessage({ type: 'success', text: `Recarga aplicada a la pulsera ${rec.tokenCode}.` });
    } else if (outcome === 'rejected') {
      rechargeStore.update(rec.clientTxId, { status: 'paid' });
      setRetryMessage({
        type: 'error',
        text:
          status === 401
            ? 'Tu sesión expiró. Vuelve a iniciar sesión e intenta aplicar la recarga de nuevo.'
            : `No se pudo aplicar la recarga. Contacta a soporte con el código ${rec.clientTxId}.`,
      });
    } else {
      rechargeStore.update(rec.clientTxId, { status: 'ambiguous' });
      setRetryMessage({
        type: 'error',
        text: `No pudimos verificar si la recarga se aplicó. No la repitas: contacta a soporte con el código ${rec.clientTxId}.`,
      });
    }

    setRetryingTxId(null);
    refreshRecords();
  };

  const handleDismiss = (rec) => {
    rechargeStore.update(rec.clientTxId, { status: 'dismissed' });
    refreshRecords();
  };

  const handleCustomAmountChange = (e) => {
    const val = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setCustomAmount(val);
      setFormError(null);
    }
  };

  const handleStartPayment = () => {
    setFormError(null);
    if (!selected) return;

    if (selected.status !== 'registered') {
      setFormError('Esta pulsera está desactivada y no se puede recargar.');
      return;
    }
    if (!hasValidAmount) {
      setFormError(`El monto mínimo es ${money(MIN_AMOUNT)}`);
      return;
    }

    const amount = Math.round(amountValue * 100) / 100;
    const clientTxId = generateClientTxId();

    // Guardar en localStorage antes de abrir Payphone: el callback lo necesita
    rechargeStore.create({
      clientTxId,
      tokenId: selected._id,
      tokenCode: selected.code,
      eventId: selected.event?._id || '',
      amount,
      balanceBefore: Number(selected.balance) || 0,
    });

    setCheckout({ clientTxId, amount, token: selected });
  };

  // ── Render: estados ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="recharges-page">
        <div className="rc-state">
          <div className="rc-spinner" />
          <p>Cargando tus pulseras...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="recharges-page">
        <div className="rc-container">
          <h1 className="rc-title">Recargas</h1>
          <div className="rc-state rc-state-card">
            <p>{error?.message || 'No se pudieron obtener tus pulseras'}</p>
            <button className="rc-secondary-btn" onClick={() => refetch()}>
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const banners = (
    <>
      {retryMessage && (
        <div className={`rc-banner ${retryMessage.type === 'success' ? 'rc-banner-success' : 'rc-banner-error'}`}>
          <span>{retryMessage.text}</span>
        </div>
      )}
      {pendingRecords.map((rec) => (
        <div
          key={rec.clientTxId}
          className={`rc-banner ${rec.status === 'paid' ? 'rc-banner-warning' : 'rc-banner-error'}`}
        >
          {rec.status === 'paid' ? (
            <>
              <span>
                Pagaste {money(rec.confirmedAmount ?? rec.amount)} para la pulsera {rec.tokenCode}, pero el
                saldo todavía no se aplicó.
              </span>
              <button onClick={() => handleRetry(rec)} disabled={retryingTxId === rec.clientTxId}>
                {retryingTxId === rec.clientTxId ? 'Aplicando...' : 'Aplicar recarga'}
              </button>
            </>
          ) : (
            <>
              <span>
                No pudimos verificar tu recarga de {money(rec.confirmedAmount ?? rec.amount)} para la pulsera{' '}
                {rec.tokenCode}. No la repitas: contacta a soporte con el código <code>{rec.clientTxId}</code>.
              </span>
              <button onClick={() => handleDismiss(rec)}>Ocultar</button>
            </>
          )}
        </div>
      ))}
    </>
  );

  if (tokens.length === 0) {
    return (
      <div className="recharges-page">
        <div className="rc-container">
          <h1 className="rc-title">Recargas</h1>
          {banners}
          <div className="rc-state rc-state-card">
            <ContactlessIcon size={40} />
            <h2>No tienes pulseras registradas</h2>
            <p>Las pulseras se registran en la entrada del evento. Cuando tengas una, podrás recargarla aquí.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: pago ─────────────────────────────────────────────────
  if (checkout) {
    const palette = paletteFor(checkout.token.code);
    return (
      <div className="recharges-page">
        <div className="rc-container">
          <h1 className="rc-title">Completar recarga</h1>

          <div className="rc-card">
            <div className="rc-summary-token">
              <span className="rc-token-dot" style={{ background: palette.dot }}>
                <ContactlessIcon size={20} />
              </span>
              <div>
                <div className="rc-summary-name">Pulsera {checkout.token.name}</div>
                <div className="rc-summary-code">{checkout.token.code}</div>
              </div>
            </div>
            <div className="rc-summary-row">
              <span>Monto a recargar</span>
              <strong>{money(checkout.amount)}</strong>
            </div>
          </div>

          <div className="rc-card">
            <PayphonePaymentBox
              token={import.meta.env.VITE_PAYPHONE_PUBLIC_KEY}
              clientTransactionId={checkout.clientTxId}
              amount={checkout.amount}
              amountWithoutTax={Math.round(checkout.amount * 100)}
              amountWithTax={0}
              tax={0}
              service={0}
              tip={0}
              currency={import.meta.env.VITE_PAYPHONE_CURRENCY || 'USD'}
              storeId={import.meta.env.VITE_PAYPHONE_STORE_ID}
              reference={`Recarga pulsera ${checkout.token.code}`.slice(0, 100)}
            />
          </div>

          <button className="rc-secondary-btn" onClick={() => setCheckout(null)}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ── Render: pulseras ─────────────────────────────────────────────
  const palette = paletteFor(selected.code);
  const isRegistered = selected.status === 'registered';
  const activation = formatDate(selected.timestamp);

  return (
    <div className="recharges-page">
      <div className="rc-container">
        <h1 className="rc-title">Recargas</h1>

        {banners}

        {/* ── Pulsera en foco ── */}
        <div
          className="rc-hero"
          style={{
            background: `linear-gradient(135deg, ${palette.start} 0%, ${palette.end} 100%)`,
            boxShadow: `0 14px 30px -14px ${palette.end}`,
          }}
        >
          <div className="rc-hero-top">
            <div className="rc-hero-id">
              <span className="rc-hero-label">Pulsera {selected.name}</span>
              <span className="rc-hero-code">{selected.code}</span>
            </div>
            <span className="rc-nfc-chip">
              <ContactlessIcon />
              {isRegistered ? 'NFC activo' : 'Desactivada'}
            </span>
          </div>
          <div className="rc-hero-amount">{money(selected.balance)}</div>
          <div className="rc-hero-sub">disponible para gastar</div>
          <div className="rc-hero-meta">
            {selected.event?.name ? `${selected.event.name} · ` : ''}
            {activation ? `Activada el ${activation}` : 'Sin fecha de activación'}
          </div>
        </div>

        {/* ── Monto ── */}
        <div className="rc-section-title">Recargar pulsera seleccionada</div>

        <div className="rc-chips">
          {AMOUNT_OPTIONS.map((value) => (
            <button
              key={value}
              className={`rc-chip ${selectedAmount === value ? 'selected' : ''}`}
              onClick={() => {
                setSelectedAmount(value);
                setFormError(null);
              }}
              disabled={!isRegistered}
            >
              ${value}
            </button>
          ))}
          <button
            className={`rc-chip ${selectedAmount === null ? 'selected' : ''}`}
            onClick={() => {
              setSelectedAmount(null);
              setFormError(null);
            }}
            disabled={!isRegistered}
          >
            Otro
          </button>
        </div>

        {selectedAmount === null && (
          <div className="rc-custom-amount">
            <span className="rc-currency">$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={customAmount}
              onChange={handleCustomAmountChange}
              aria-label="Monto a recargar"
              autoFocus
            />
          </div>
        )}

        {!isRegistered && (
          <div className="rc-banner rc-banner-warning">
            <span>Esta pulsera está desactivada y no se puede recargar.</span>
          </div>
        )}

        {formError && <div className="rc-error">{formError}</div>}

        <button
          className="rc-primary-btn"
          onClick={handleStartPayment}
          disabled={!isRegistered || !hasValidAmount}
        >
          {hasValidAmount ? `Recargar · ${money(amountValue)}` : 'Recargar · elegir monto'}
        </button>

        {/* ── Lista de pulseras ── */}
        <div className="rc-section-title">
          Mis pulseras <span className="rc-section-count">({tokens.length})</span>
        </div>

        <div className="rc-token-list">
          {tokens.map((token) => {
            const isSelected = token._id === selected._id;
            const isEmpty = (Number(token.balance) || 0) <= 0;
            return (
              <button
                key={token._id}
                className={`rc-token ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTokenId(token._id);
                  setFormError(null);
                }}
                aria-pressed={isSelected}
              >
                <span className="rc-token-dot" style={{ background: paletteFor(token.code).dot }}>
                  <ContactlessIcon size={20} />
                </span>
                <span className="rc-token-info">
                  <span className="rc-token-name">
                    <span className="rc-truncate">Pulsera {token.name}</span>
                    {isEmpty && <span className="rc-pill-low">Bajo</span>}
                  </span>
                  <span className="rc-token-code">
                    {token.code}
                    {token.event?.name ? ` · ${token.event.name}` : ''}
                  </span>
                </span>
                <span className="rc-token-balance">
                  <strong className={isEmpty ? 'empty' : ''}>{money(token.balance)}</strong>
                  <span>disponible</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RechargesPage;
