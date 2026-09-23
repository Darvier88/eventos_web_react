// src/pages/EventDetailPage.jsx
import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import apiService from '../services/apiService';
import secureStorage from '../services/secureStorage';
import { useAuth } from '../context/AuthContext';
import { eventWallClock, hasEventEnded } from '../utils/eventTime';
import './EventDetailPage.css';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const eventId = id || secureStorage.getEventId();

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['eventDetail', eventId],
    queryFn: async () => {
      const [ev, tks] = await Promise.all([
        apiService.getEventById(eventId),
        apiService.getTicketsByEvent(eventId),
      ]);
      return { event: ev, tickets: tks };
    },
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2,
  });

  const event   = data?.event   ?? null;
  const tickets = data?.tickets ?? [];

  // Obtener video del evento
  const {
    data: eventVideo,
    isLoading: isVideoLoading,
    isError: isVideoError,
    error: videoError,
  } = useQuery({
    queryKey: ['eventVideo', eventId],
    queryFn: () => apiService.getVideoByEventId(eventId),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: bannerImageUrl, isError: imageError } = useQuery({
    queryKey: ['bannerImage', eventId],
    queryFn: () => apiService.getImageFileByEvent(eventId, 'banner'),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const formatDate = (d) => {
    const date = eventWallClock(d);
    return date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: es }) : 'Por confirmar';
  };
  const formatTime = (d) => {
    const date = eventWallClock(d);
    return date ? format(date, 'HH:mm', { locale: es }) : null;
  };

  // Usar youtube_url directamente del objeto eventVideo
  let videoContent = null;
  if (eventVideo && typeof eventVideo.youtube_url === 'string' && eventVideo.youtube_url.trim() !== '') {
    // Convertir a embed si es necesario
    const getYoutubeEmbedUrl = (rawUrl) => {
      try {
        const url = new URL(rawUrl);
        if (url.hostname.includes('youtu.be')) {
          const videoId = url.pathname.replace('/', '').trim();
          return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
        }
        if (url.hostname.includes('youtube.com')) {
          if (url.pathname.startsWith('/embed/')) {
            return `https://www.youtube-nocookie.com${url.pathname}`;
          }
          const videoId = url.searchParams.get('v');
          return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
        }
      } catch {
        return null;
      }
      return null;
    };
    const embedUrl = getYoutubeEmbedUrl(eventVideo.youtube_url);
    if (embedUrl) {
      videoContent = (
        <div className="event-video">
          <div className="event-video-frame">
            <iframe
              src={embedUrl}
              title="Video del evento"
              style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
    }
  }

  

  const visibleTickets = useMemo(
    () => tickets.filter((t) => !t.hidden).sort((a, b) => a.price - b.price),
    [tickets]
  );

  // Estado para modal de evento finalizado
  const [showEndedModal, setShowEndedModal] = useState(false);

  // URLs de publicidad cuya imagen no cargó: ese lado se oculta en vez de
  // mostrar una imagen rota. Se guarda por URL, así que al navegar a otro
  // evento con otras publicidades no arrastra fallos del anterior.
  const [failedAdUrls, setFailedAdUrls] = useState(() => new Set());
  const markAdFailed = (url) =>
    setFailedAdUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));

  // Desde este ancho las publicidades van en columnas a los costados; por
  // debajo se muestran como una sola tira centrada que rota entre ambas.
  // Debe coincidir con el mismo ancho en EventDetailPage.css.
  const sideAds = useMediaQuery('(min-width: 1024px)');

  // Determinar si el evento ya terminó
  const isEventOver = hasEventEnded(event);

  const handleGoToPurchase = () => {
    if (isEventOver) {
      setShowEndedModal(true);
      return;
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (eventId) {
      secureStorage.setEventId(eventId);
    }
    navigate('/purchase', {
      state: { eventId, event, tickets },
    });
  };

  if (isLoading) {
    return (
      <div className="event-detail-page">
        <div className="spinner" />
        <p>Cargando detalles del evento...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="event-detail-page">
        <div className="error-container">
          <h2>Error al cargar el evento</h2>
          <p>{error?.message || 'Evento no encontrado'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Volver a eventos
          </button>
        </div>
      </div>
    );
  }

  // Publicidad lateral: `banner` a la izquierda y `banner2` a la derecha.
  // Se cargan con un PUT sobre el evento; si un campo es null o su imagen no
  // carga, ese lado no se muestra. Sin ninguna, la página queda como siempre.
  const leftAd  = adUrl(event.banner);
  const rightAd = adUrl(event.banner2);
  const visibleLeftAd  = leftAd  && !failedAdUrls.has(leftAd)  ? leftAd  : null;
  const visibleRightAd = rightAd && !failedAdUrls.has(rightAd) ? rightAd : null;
  const hasAds = Boolean(visibleLeftAd || visibleRightAd);
  const stripAds = [visibleLeftAd, visibleRightAd].filter(Boolean);

  // Fecha y horario. Con hora de fin se muestran las dos ("10:00 – 23:59"), y
  // si el evento termina otro día, la fecha también indica hasta cuándo.
  const startsAt = eventWallClock(event.start_date);
  const endsAt   = eventWallClock(event.end_date);
  const endsSameDay = startsAt && endsAt && isSameDay(startsAt, endsAt);

  const dateLabel = endsAt && !endsSameDay
    ? `${formatDate(event.start_date)} — ${formatDate(event.end_date)}`
    : formatDate(event.start_date);

  const startTime = formatTime(event.start_date);
  const endTime   = formatTime(event.end_date);
  const hoursLabel = endTime ? 'Horario' : 'Hora de inicio';
  const hoursValue = endTime
    ? `${startTime || '--:--'} – ${endTime}`
    : (startTime || 'Por confirmar');

  return (
    <div className="event-detail-page">
      <div className={`event-layout${hasAds ? ' event-layout--with-ads' : ''}`}>
        {sideAds && visibleLeftAd && (
          <EventAd side="left" src={visibleLeftAd} eventName={event.name} onError={markAdFailed} />
        )}

        <div className="event-main">
          <div className="event-banner">
            {bannerImageUrl && !imageError ? (
              <>
                {/* Copia difuminada detrás: rellena lo que sobra a los lados
                    cuando el banner no tiene la proporción del hueco, así la
                    imagen se ve entera sin recortes ni franjas vacías. */}
                <img src={bannerImageUrl} alt="" aria-hidden="true" className="event-banner-backdrop" />
                <img src={bannerImageUrl} alt={event.name} className="event-banner-image" />
              </>
            ) : imageError ? (
              <div className="event-banner-placeholder"><p>Imagen no disponible</p></div>
            ) : (
              <div className="event-banner-placeholder"><div className="spinner" /><p>Cargando imagen...</p></div>
            )}
          </div>

          <div className="event-detail-container">
            <div className="event-info-section">
              <h1 className="event-title-detail">{event.name}</h1>
              <div className="event-details">
                <InfoRow icon="calendar" label="Fecha"    value={dateLabel} />
                <InfoRow icon="clock"    label={hoursLabel} value={hoursValue} />
                <InfoRow icon="location" label="Lugar"    value={event.location || 'Por confirmar'} />
              </div>

              <div className="event-description-section">
                <h2 className="section-title">Descripción</h2>
                <p className="event-description">{event.description}</p>
              </div>

              {isVideoLoading ? (
                <div className="event-video"><div className="spinner" /><p>Cargando video...</p></div>
              ) : videoContent}
            </div>

            <div className="tickets-section">
              <div className="tickets-card">
                <h2 className="tickets-title">Localidades</h2>
                {visibleTickets.length === 0 ? (
                  <div className="no-tickets"><p>No hay tickets disponibles para este evento</p></div>
                ) : (
                  <>
                    <div className="tickets-list">
                      {visibleTickets.map((t) => (
                        <div key={t._id} className="ticket-card">
                          <div className="ticket-header">
                            <span className="ticket-name">{t.name}</span>
                            <span className="ticket-price">
                              {t.price === 0 ? 'Gratis' : `$${t.price.toFixed(2)}`}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-primary btn-buy" onClick={handleGoToPurchase}>
                      Comprar tickets
                    </button>
                    {/* Modal global para evento finalizado */}
                    {showEndedModal && (
                      <div className="blocked-modal-backdrop" onClick={() => setShowEndedModal(false)}>
                        <div className="blocked-modal" onClick={e => e.stopPropagation()}>
                          <div className="blocked-modal-content">
                            <span>El evento ya se acabó. No es posible comprar tickets.</span>
                            <button className="blocked-modal-close" onClick={() => setShowEndedModal(false)} aria-label="Cerrar">&times;</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {sideAds && visibleRightAd && (
          <EventAd side="right" src={visibleRightAd} eventName={event.name} onError={markAdFailed} />
        )}

        {!sideAds && hasAds && (
          <EventAdCarousel ads={stripAds} eventName={event.name} onError={markAdFailed} />
        )}
      </div>
    </div>
  );
};

/** true mientras la pantalla cumpla la media query. */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(media.matches);          // por si cambió entre el render y el efecto
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
};

/**
 * URL de publicidad utilizable, o null si el campo viene vacío. Las subidas
 * desde macak_tools llegan como ruta relativa a la API y se completan aquí.
 */
const adUrl = (value) => apiService.resolveApiUrl(value);

/**
 * Publicidad en pantallas angostas: una sola tira recortada al centro de la
 * imagen, que alterna entre las dos publicidades si el evento tiene ambas.
 * La pieza es vertical, así que mostrarla entera la dejaría diminuta:
 * recortada al centro aprovecha todo el ancho disponible.
 */
const AD_ROTATION_MS = 6000;

const EventAdCarousel = ({ ads, eventName, onError }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => i + 1), AD_ROTATION_MS);
    return () => clearInterval(timer);
  }, [ads.length]);

  // El índice crece sin tope y se acota aquí: si una publicidad no carga y
  // desaparece de la lista, la tira sigue mostrando la que queda.
  const current = index % ads.length;

  return (
    <section className="event-ad-strip" aria-label="Publicidad">
      {ads.map((src, position) => (
        <img
          key={src}
          src={src}
          alt={`Publicidad en ${eventName}`}
          className={`event-ad-strip-image${position === current ? ' is-visible' : ''}`}
          loading="lazy"
          decoding="async"
          onError={() => onError(src)}
        />
      ))}

      {ads.length > 1 && (
        <div className="event-ad-strip-dots">
          {ads.map((src, position) => (
            <button
              key={src}
              type="button"
              className={`event-ad-strip-dot${position === current ? ' is-active' : ''}`}
              aria-label={`Ver publicidad ${position + 1} de ${ads.length}`}
              onClick={() => setIndex(position)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const EventAd = ({ side, src, eventName, onError }) => (
  <aside className={`event-ad event-ad--${side}`} aria-label="Publicidad">
    <img
      src={src}
      alt={`Publicidad en ${eventName}`}
      className="event-ad-image"
      loading="lazy"
      decoding="async"
      onError={() => onError(src)}
    />
  </aside>
);

const InfoRow = ({ icon, label, value }) => {
  const icons = {
    calendar: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    clock: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    location: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  };

  return (
    <div className="info-row">
      <div className="info-icon">{icons[icon]}</div>
      <div className="info-content">
        <div className="info-label">{label}</div>
        <div className="info-value">{value}</div>
      </div>
    </div>
  );
};

export default EventDetailPage;