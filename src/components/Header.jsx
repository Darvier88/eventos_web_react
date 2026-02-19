import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useViewMode } from '../context/ViewContext';
import './Header.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { viewMode, toggleViewMode } = useViewMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    await logout();
    setDrawerOpen(false);
    setShowLogoutConfirm(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleLogin = () => {
    setDrawerOpen(false);
    navigate('/login');
  };

  const handleNavigate = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <button className="menu-btn" onClick={() => setDrawerOpen(!drawerOpen)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="logo">
                <span className="logo-text">MACAK Eventos</span>
            </Link>
          </div>
          
          <div className="header-right">
            {isAuthenticated && (
              <>
                <Link className="icon-btn" to="/my-tickets" title="Mis tickets" aria-label="Mis tickets">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="6" width="18" height="12" rx="2" />
                  <circle cx="3" cy="12" r="2" fill="currentColor" />
                  <circle cx="21" cy="12" r="2" fill="currentColor" />
                  <line x1="10" y1="10" x2="14" y2="10" />
                  <line x1="10" y1="14" x2="14" y2="14" />
                </svg>
                </Link>
                <button className="icon-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <button className="icon-btn" onClick={handleLogout} title="Cerrar sesión">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5m0 0l-5-5m5 5H9" />
                  </svg>
                </button>
              </>
            )}
            <button className="icon-btn" onClick={() => navigate('/explore')} title="Explorar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Drawer - Solo para login cuando no está autenticado */}
      {!isAuthenticated && (
        <>
          <div className={`drawer-overlay ${drawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
          <div className={`drawer ${drawerOpen ? 'open' : ''}`}>
            <div className="drawer-content">
              <button className="drawer-close" onClick={() => setDrawerOpen(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              <div className="drawer-menu">
                <button className="drawer-item drawer-login" onClick={handleLogin}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Iniciar sesión</span>
                </button>
                <button className="drawer-item" onClick={() => handleNavigate('/register')}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" />
                    <line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                  <span>Registrarse</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-backdrop" onClick={cancelLogout}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-header">
              <h2>Cerrar sesión</h2>
              <button className="logout-close" onClick={cancelLogout}>×</button>
            </div>
            <div className="logout-modal-body">
              <p>¿Estás seguro de que deseas cerrar sesión?</p>
            </div>
            <div className="logout-modal-actions">
              <button className="logout-btn-cancel" onClick={cancelLogout}>
                Cancelar
              </button>
              <button className="logout-btn-confirm" onClick={confirmLogout}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
