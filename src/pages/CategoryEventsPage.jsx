import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';
import './CategoryEventsPage.css';

const CATEGORY_NAMES = {
  concert: 'Conciertos',
  sport: 'Deportes',
  family: 'Familiar',
  party: 'Fiestas',
  movies: 'Cine',
  workshop: 'Talleres',
};

const CategoryEventsPage = () => {
  const { categoryKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const events = location.state?.events || [];
  const title = CATEGORY_NAMES[categoryKey] || 'Categoría';

  return (
    <div className="category-events-page">
      <div className="category-events-container">
        <button className="btn btn-secondary" onClick={() => navigate('/explore')}>
          Volver
        </button>
        <h1 className="category-title">{title}</h1>

        {events.length === 0 ? (
          <div className="empty-state">
            <p>No hay eventos para esta categoría.</p>
            <button className="btn btn-primary" onClick={() => navigate('/explore')}>
              Volver a explorar
            </button>
          </div>
        ) : (
          <div className="category-events-grid">
            {events.map((event) => (
              <EventCard key={event._id || event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryEventsPage;
