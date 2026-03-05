// src/pages/EventDetailPage.jsx
import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import apiService from '../services/apiService';
import secureStorage from '../services/secureStorage';
import { useAuth } from '../context/AuthContext';
import './EventDetailPage.css';

const EventDetailPage = () => {
  // Scroll al top al montar
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

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

  const formatDate = (d) => format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const formatTime = (d) => format(new Date(d), 'HH:mm', { locale: es });

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

  const handleGoToPurchase = () => {
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

  return (
    <div className="event-detail-page">
      <div className="event-banner">
        {bannerImageUrl && !imageError ? (
          <img src={bannerImageUrl} alt={event.name} className="event-banner-image" />
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
            <InfoRow icon="calendar" label="Fecha"         value={formatDate(event.start_date)} />
            <InfoRow icon="clock"    label="Hora de inicio" value={formatTime(event.start_date)} />
            <InfoRow icon="location" label="Lugar"          value={event.location || 'Por confirmar'} />
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

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