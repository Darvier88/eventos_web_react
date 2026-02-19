import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import apiService from '../services/apiService';
import secureStorage from '../services/secureStorage';
import './EventCard.css';

const EventCard = ({ event }) => {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  // El event_id viene del objeto Event de getAllEvents()
  const eventId = event._id || event.id || event.event_id;

  useEffect(() => {
    // Cargar imagen usando getImageFileByEvent (como en Dart)
    const loadImage = async () => {
      try {
        const url = await apiService.getImageFileByEvent(eventId, 'square');
        setImageUrl(url);
      } catch (error) {
        console.error('Error loading image:', error);
        setImageError(true);
      }
    };

    loadImage();

    // Cleanup: liberar URL del blob cuando el componente se desmonte
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [eventId]);

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy • HH:mm '(EC)'", { locale: es });
  };

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Guardar event_id en storage cuando se hace clic (equivalente a SecureStorage de Dart)
  const handleClick = (e) => {
    e.preventDefault();
    secureStorage.setEventId(eventId);
    navigate(`/evento/${eventId}`);
  };

  return (
    <div onClick={handleClick} className="event-card-link" style={{ cursor: 'pointer' }}>
      <article className="event-card">
        <div className="event-card-image-container">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={event.name}
              className="event-card-image"
              loading="lazy"
            />
          ) : imageError ? (
            <div className="event-card-image-placeholder">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>Imagen no disponible</p>
            </div>
          ) : (
            <div className="event-card-image-placeholder">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        
        <div className="event-card-content">
          <div className="event-card-date">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>{formatEventDate(event.start_date)}</span>
          </div>
          
          <h2 className="event-card-title">{event.name}</h2>
          
          <div className="event-card-footer">
            <button className="bookmark-btn" onClick={handleClick}>
              VER MÁS
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};

export default EventCard;