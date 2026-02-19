import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './ExplorePage.css';

const CATEGORIES = [
  { name: 'Conciertos', key: 'concert', colorClass: 'purple', icon: 'music' },
  { name: 'Deportes', key: 'sport', colorClass: 'green', icon: 'sport' },
  { name: 'Familiar', key: 'family', colorClass: 'blue', icon: 'family' },
  { name: 'Fiestas', key: 'party', colorClass: 'red', icon: 'party' },
  { name: 'Cine', key: 'movies', colorClass: 'amber', icon: 'movie' },
  { name: 'Talleres', key: 'workshop', colorClass: 'teal', icon: 'workshop' },
];

const ExplorePage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getAllEvents();
        setEvents(data);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los eventos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const counts = useMemo(() => {
    const map = new Map();
    CATEGORIES.forEach((c) => map.set(c.key, 0));
    events.forEach((event) => {
      const key = event.category;
      if (map.has(key)) {
        map.set(key, map.get(key) + 1);
      }
    });
    return map;
  }, [events]);

  const handleCategoryClick = (categoryKey) => {
    const filtered = events.filter((event) => event.category === categoryKey);
    navigate(`/explore/${categoryKey}`, { state: { events: filtered } });
  };

  if (loading) {
    return (
      <div className="explore-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="explore-page">
        <div className="error-container">
          <h2>Error al cargar</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-page">
      <div className="explore-container">
        <h1 className="explore-title">Explorar</h1>
        <div className="explore-grid">
          {CATEGORIES.map((category) => {
            const count = counts.get(category.key) || 0;
            return (
              <button
                key={category.key}
                className={`category-card ${category.colorClass} ${count === 0 ? 'disabled' : ''}`}
                onClick={() => count > 0 && handleCategoryClick(category.key)}
                disabled={count === 0}
              >
                <div className="category-icon">
                  {category.icon === 'music' && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 18V5l12-2v13"></path>
                      <circle cx="6" cy="18" r="3"></circle>
                      <circle cx="18" cy="16" r="3"></circle>
                    </svg>
                  )}
                  {category.icon === 'sport' && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M8 8l8 8M16 8l-8 8"></path>
                    </svg>
                  )}
                  {category.icon === 'family' && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M16 11a4 4 0 10-8 0"></path>
                      <circle cx="9" cy="7" r="3"></circle>
                      <circle cx="15" cy="7" r="3"></circle>
                      <path d="M5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"></path>
                    </svg>
                  )}
                  {category.icon === 'party' && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M2 22s10-4 20 0"></path>
                      <path d="M12 2v10"></path>
                      <path d="M8 6l4-4 4 4"></path>
                    </svg>
                  )}
                  {category.icon === 'movie' && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                      <path d="M6 6l2 12M10 6l2 12M14 6l2 12M18 6l2 12"></path>
                    </svg>
                  )}
                  {category.icon === 'workshop' && (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 3h18v4H3z"></path>
                      <path d="M5 7l2 14h10l2-14"></path>
                      <path d="M9 11h6"></path>
                    </svg>
                  )}
                </div>
                <div className="category-name">{category.name}</div>
                {count > 0 && <div className="category-badge">{count}</div>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
