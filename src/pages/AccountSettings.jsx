import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import './AccountSettings.css';
import LogoutAllSessionsModal from '../components/LogoutAllSessionsModal';
import DeleteAccountModal from '../components/DeleteAccountModal';

import apiService from '../services/apiService';

const AccountSettings = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [logoutSuccess, setLogoutSuccess] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  return (
    <div className="account-settings-page">
      <div className="account-settings-container">

        <div className="account-settings-header">
          <h1 className="account-settings-title">Configuración de Cuenta</h1>
        </div>

        <div className="settings-list">

          {/* Sección Seguridad */}
          <p className="settings-section-label">Seguridad</p>
          <div className="settings-card">
            <button className="settings-item" onClick={() => navigate('/change-password')}>
              <span className="settings-icon" style={{ color: '#ff9800' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="8" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </span>
              <span>
                <div className="settings-title">Cambiar Contraseña</div>
                <div className="settings-subtitle">Actualiza tu contraseña de acceso</div>
              </span>
              <span className="settings-arrow">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </button>

            <div className="settings-divider" />

            <button className="settings-item" onClick={() => setShowLogoutModal(true)}>
              <span className="settings-icon" style={{ color: '#43a047' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 17l1.41-1.41a2 2 0 000-2.83L12 7.17l-5.41 5.59a2 2 0 000 2.83L8 17" />
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </span>
              <span>
                <div className="settings-title">Cerrar Todas las Sesiones</div>
                <div className="settings-subtitle">Cierra sesión en todos los dispositivos</div>
              </span>
              <span className="settings-arrow">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </button>
          </div>

          {/* Zona de Peligro */}
          <p className="settings-section-label">Zona de Peligro</p>
          <div className="settings-card danger">
            <button className="settings-item" onClick={() => setShowDeleteAccountModal(true)}>
              <span className="settings-icon" style={{ color: '#f44336' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="8" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                  <line x1="9" y1="17" x2="15" y2="17" />
                  <line x1="12" y1="14" x2="12" y2="17" />
                </svg>
              </span>
              <span>
                <div className="settings-title">Eliminar Cuenta Permanentemente</div>
                <div className="settings-subtitle">Esta acción no se puede deshacer</div>
              </span>
              <span className="settings-arrow">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f44336" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </button>
          </div>

        </div>
      </div>
      {/* Modal para Cerrar Todas las Sesiones */}
      <LogoutAllSessionsModal
        open={showLogoutModal}
        onClose={() => {
          setShowLogoutModal(false);
          setLogoutError('');
          setLogoutSuccess('');
          setLogoutLoading(false);
        }}
        onLogout={async (password) => {
          setLogoutLoading(true);
          setLogoutError('');
          setLogoutSuccess('');
          try {
            const response = await apiService.logoutAllSessions(password);
            setLogoutSuccess(response.message || 'Sesiones cerradas. Vuelve a iniciar sesión.');
            localStorage.removeItem('session_token');
            localStorage.removeItem('user_id');
            setTimeout(() => {
              window.location.href = '/login';
            }, 2000);
          } catch (err) {
            setLogoutError(err.message);
          } finally {
            setLogoutLoading(false);
          }
        }}
        error={logoutError}
        success={logoutSuccess}
        loading={logoutLoading}
      />
      {/* Modal para Eliminar Cuenta */}
      <DeleteAccountModal
        open={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onDelete={async (password) => {
          try {
            const response = await apiService.deleteAccount(password);
            return response;
          } catch (err) {
            throw err;
          }
        }}
      />
    </div>
  );
};

export default AccountSettings;