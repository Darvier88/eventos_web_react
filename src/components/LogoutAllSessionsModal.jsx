// LogoutAllSessionsModal.jsx
import React, { useState } from 'react';
import './LogoutAllSessionsModal.css';

const LogoutAllSessionsModal = ({ open, onClose, onLogout, error, success, loading }) => {
  const [password, setPassword] = useState('');

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Cerrar Todas las Sesiones</h2>
        <p>Confirma tu contraseña para cerrar sesión en todos los dispositivos.</p>
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={loading || !!success}
        />
        {error && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">{success}</div>}
        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>Cancelar</button>
          <button
            onClick={() => onLogout(password)}
            disabled={loading || !password || !!success}
          >
            {loading ? 'Procesando...' : 'Cerrar Sesiones'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutAllSessionsModal;