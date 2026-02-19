// src/pages/EventDetailPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import apiService from '../services/apiService';
import secureStorage from '../services/secureStorage';
import { useAuth } from '../context/AuthContext';
import './EventDetailPage.css';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const eventId = id || secureStorage.getEventId();

  // Estados principales del evento
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [bannerImageUrl, setBannerImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (!eventId) {
      setError('No se pudo identificar el evento');
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [ev, tks] = await Promise.all([
          apiService.getEventById(eventId),
          apiService.getTicketsByEvent(eventId),
        ]);
        setEvent(ev);
        setTickets(tks);
        try {
          const url = await apiService.getImageFileByEvent(eventId, 'banner');
          setBannerImageUrl(url);
        } catch {
          setImageError(true);
        }
      } catch (err) {
        setError(err.message || 'No se pudo cargar el evento');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (bannerImageUrl) URL.revokeObjectURL(bannerImageUrl);
    };
  }, [eventId]); // sin bannerImageUrl para evitar loop


  const formatDate = (d) => format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const formatTime = (d) => format(new Date(d), 'HH:mm', { locale: es });

  const getYoutubeEmbedUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return null;
    }

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

  const youtubeEmbedUrl = getYoutubeEmbedUrl(event?.youtube_url);

  // Tickets visibles y ordenados
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

  if (loading) {
    return <div className="event-detail-page"><div className="spinner" /><p>Cargando detalles del evento...</p></div>;
  }
  if (error || !event) {
    return (
      <div className="event-detail-page">
        <div className="error-container">
          <h2>Error al cargar el evento</h2>
          <p>{error || 'Evento no encontrado'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Volver a eventos</button>
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
            <InfoRow icon="calendar" label="Fecha" value={formatDate(event.start_date)} />
            <InfoRow icon="clock" label="Hora de inicio" value={formatTime(event.start_date)} />
            <InfoRow icon="location" label="Lugar" value={event.location || 'Por confirmar'} />
          </div>
          {youtubeEmbedUrl && (
            <div className="event-video">
              <div className="event-video-frame">
                <iframe
                  src={youtubeEmbedUrl}
                  title="Video del evento"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}
          <div className="event-description-section">
            <h2 className="section-title">Descripción</h2>
            <p className="event-description">{event.description}</p>
          </div>
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
                        <span className="ticket-price">{t.price === 0 ? 'Gratis' : `$${t.price.toFixed(2)}`}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary btn-buy"
                  onClick={handleGoToPurchase}
                >
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