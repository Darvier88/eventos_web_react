import React, { useEffect, useRef, useState } from 'react';
import EventCard from '../components/EventCard';
import apiService from '../services/apiService';
import secureStorage from '../services/secureStorage';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './EventsPage.css';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageUrls, setImageUrls] = useState({
    current: null,
    next: null
  });
  const autoAdvanceRef = useRef(null);
  const navigate = useNavigate();

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getAllEvents();
      // Ordenar por fecha de inicio
      const sortedEvents = data.sort((a, b) => 
        new Date(a.start_date) - new Date(b.start_date)
      );
      setEvents(sortedEvents);
    } catch (err) {
      setError(err.message);
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const stopAutoAdvance = () => {
    if (autoAdvanceRef.current) {
      clearInterval(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  };

  const startAutoAdvance = () => {
    if (events.length <= 1) {
      return;
    }

    stopAutoAdvance();
    autoAdvanceRef.current = setInterval(() => {
      setCurrentIndex((prev) => prev === events.length - 1 ? 0 : prev + 1);
    }, 2000); // 2 segundos como pediste
  };

  const resetAutoAdvance = () => {
    if (isHovered) {
      return;
    }

    startAutoAdvance();
  };

  useEffect(() => {
    if (!isHovered) {
      startAutoAdvance();
    }

    return () => stopAutoAdvance();
  }, [events.length, isHovered]);

  useEffect(() => {
    // Cargar imágenes del evento actual y siguiente
    if (events.length > 0) {
      const loadImages = async () => {
        const nextIndex = currentIndex === events.length - 1 ? 0 : currentIndex + 1;

        const currentEvent = events[currentIndex];
        const nextEvent = events[nextIndex];

        const currentId = currentEvent._id || currentEvent.id || currentEvent.event_id;
        const nextId = nextEvent._id || nextEvent.id || nextEvent.event_id;

        try {
          const [currentUrl, nextUrl] = await Promise.all([
            apiService.getImageFileByEvent(currentId, 'square').catch(() => null),
            apiService.getImageFileByEvent(nextId, 'square').catch(() => null)
          ]);

          setImageUrls({
            current: currentUrl,
            next: nextUrl
          });
        } catch (error) {
          console.error('Error loading images:', error);
        }
      };

      loadImages();

      return () => {
        // Limpiar URLs anteriores
        Object.values(imageUrls).forEach(url => {
          if (url) URL.revokeObjectURL(url);
        });
      };
    }
  }, [currentIndex, events]);

  const handleRefresh = () => {
    loadEvents();
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => prev === 0 ? events.length - 1 : prev - 1);
    resetAutoAdvance();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => prev === events.length - 1 ? 0 : prev + 1);
    resetAutoAdvance();
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy • HH:mm '(EC)'", { locale: es });
  };

  const handleEventClick = (eventId) => {
    secureStorage.setEventId(eventId);
    navigate(`/evento/${eventId}`);
  };

  if (loading) {
    return (
      <div className="events-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Cargando eventos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="events-page">
        <div className="error-container">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#f44336">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>Error al cargar eventos</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={handleRefresh}>
            Reintentar
          </button>
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
      </div>
    );
  }

  const currentEvent = events[currentIndex];
  const eventId = currentEvent._id || currentEvent.id || currentEvent.event_id;

  return (
    <div className="events-page">
      {/* Carrusel de galería */}
      <div className="gallery-container">
        <div className="gallery-main">
          {/* Carrusel de imágenes */}
          <div className="gallery-carousel">
            {/* Imagen actual (enfocada) */}
            {imageUrls.current ? (
              <img 
                src={imageUrls.current} 
                alt={currentEvent.name} 
                className="gallery-image gallery-image-current" 
              />
            ) : (
              <div className="gallery-image-placeholder gallery-image-current">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            )}

            {/* Imagen siguiente */}
            {imageUrls.next ? (
              <img 
                src={imageUrls.next} 
                alt="Siguiente evento" 
                className="gallery-image gallery-image-next"
                onClick={handleNext}
              />
            ) : (
              <div className="gallery-image-placeholder gallery-image-next">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            )}
          </div>
          
          <div 
            className="gallery-info"
            onMouseEnter={() => {
              setIsHovered(true);
              stopAutoAdvance();
            }}
            onMouseLeave={() => {
              setIsHovered(false);
              startAutoAdvance();
            }}
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

        {/* Navegación */}
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
    </div>
  );
};

export default EventsPage;