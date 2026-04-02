import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import EventCard from '../components/EventCard';
import Footer from '../components/Footer';
import apiService from '../services/apiService';
import secureStorage from '../services/secureStorage';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './EventsPage.css';

// ─── Utilidad de precarga ─────────────────────────────────────────────────────
const preloadImage = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.onload  = () => resolve(url);
    img.onerror = () => resolve(null);
    img.src = url;
  });

// ─── Hooks ────────────────────────────────────────────────────────────────────
const useEvents = () =>
  useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const data = await apiService.getAllEvents();
      return data.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
    },
    staleTime: 1000 * 60 * 2,
  });

const useAllEventImages = (events) =>
  useQuery({
    queryKey: ['allEventImages', events.map((e) => e._id || e.id || e.event_id).join(',')],
    queryFn: async () => {
      const urls = await Promise.all(
        events.map((e) => {
          const id = e._id || e.id || e.event_id;
          return apiService.getImageFileByEvent(id, 'square').catch(() => null);
        })
      );
      await Promise.all(urls.map(preloadImage));
      return Object.fromEntries(
        events.map((e, i) => [e._id || e.id || e.event_id, urls[i]])
      );
    },
    enabled: events.length > 0,
    staleTime: 1000 * 60 * 5,
  });

// ─── Page Component ───────────────────────────────────────────────────────────
const EventsPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered]       = useState(false);
  const autoAdvanceRef = useRef(null);
  const navigate = useNavigate();

  const { data: events = [], isLoading, isError, error, refetch } = useEvents();
  const { data: imageMap = null, isLoading: isLoadingImages } = useAllEventImages(events);

  const allReady = !isLoading && !isLoadingImages && imageMap !== null;

  const nextIndex = events.length > 0
    ? (currentIndex === events.length - 1 ? 0 : currentIndex + 1)
    : 0;

  const stopAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);

  const startAutoAdvance = useCallback(() => {
    if (events.length <= 1) return;
    stopAutoAdvance();
    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1));
    }, 2000);
  }, [events.length, stopAutoAdvance]);

  useEffect(() => {
    if (!allReady || isHovered) return;
    startAutoAdvance();
    return () => stopAutoAdvance();
  }, [allReady, isHovered, startAutoAdvance, stopAutoAdvance]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? events.length - 1 : prev - 1));
    if (!isHovered) startAutoAdvance();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === events.length - 1 ? 0 : prev + 1));
    if (!isHovered) startAutoAdvance();
  };

  const formatEventDate = (dateString) =>
    format(new Date(dateString), "dd 'de' MMMM 'de' yyyy • HH:mm '(EC)'", { locale: es });

  const handleEventClick = (eventId) => {
    secureStorage.setEventId(eventId);
    navigate(`/evento/${eventId}`);
  };

  // ── Estados de carga / error / vacío ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="events-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="events-page">
        <div className="error-container">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#f44336">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>Error al cargar eventos</h2>
          <p>{error?.message || 'Error desconocido'}</p>
          <button className="btn btn-primary" onClick={refetch}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="events-page">
        <div className="no-events">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <h2>No hay eventos disponibles</h2>
          <p>Vuelve pronto para ver nuevos eventos</p>
        </div>
        <Footer />
      </div>
    );
  }

  const currentEvent = events[currentIndex];
  const nextEvent    = events[nextIndex];
  const eventId      = currentEvent._id || currentEvent.id || currentEvent.event_id;
  const nextEventId  = nextEvent._id    || nextEvent.id    || nextEvent.event_id;

  const currentImageUrl = imageMap?.[eventId]    ?? null;
  const nextImageUrl    = imageMap?.[nextEventId] ?? null;

  const placeholderSVG = (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  );

  return (
    <div className="events-page">
      <div className="gallery-container">
        <div className="gallery-main">
          <div className="gallery-carousel">

            {/* Imagen actual */}
            {!allReady ? (
              <div className="gallery-image-placeholder gallery-image-current gallery-image-skeleton" />
            ) : currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={currentEvent.name}
                className="gallery-image gallery-image-current"
              />
            ) : (
              <div className="gallery-image-placeholder gallery-image-current">{placeholderSVG}</div>
            )}

            {/* Imagen siguiente */}
            {!allReady ? (
              <div className="gallery-image-placeholder gallery-image-next gallery-image-skeleton" />
            ) : nextImageUrl ? (
              <img
                src={nextImageUrl}
                alt="Siguiente evento"
                className="gallery-image gallery-image-next"
                onClick={handleNext}
              />
            ) : (
              <div className="gallery-image-placeholder gallery-image-next" onClick={handleNext}>{placeholderSVG}</div>
            )}

          </div>

          <div
            className="gallery-info"
            onMouseEnter={() => { setIsHovered(true);  stopAutoAdvance();  }}
            onMouseLeave={() => { setIsHovered(false); startAutoAdvance(); }}
          >
            <h1 className="gallery-title">{currentEvent.name}</h1>

            <div className="gallery-details">
              <div className="detail-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span>{formatEventDate(currentEvent.start_date)}</span>
              </div>

              <div className="detail-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{currentEvent.location}</span>
              </div>
            </div>

            <div className="gallery-buttons">
              <button className="btn btn-gallery btn-primary" onClick={() => handleEventClick(eventId)}>
                Comprar ahora
              </button>
              <button className="btn btn-gallery btn-gallery-secondary" onClick={() => handleEventClick(eventId)}>
                Ver detalle
              </button>
            </div>
          </div>
        </div>

        <button className="gallery-nav prev" onClick={handlePrevious} title="Evento anterior">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="gallery-nav next" onClick={handleNext} title="Siguiente evento">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="events-container">
        <h2 className="events-list-title">Eventos</h2>
        <div className="events-list">
          {events.map((event) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventsPage;