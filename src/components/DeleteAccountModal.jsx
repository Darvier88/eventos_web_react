// src/components/DeleteAccountModal.jsx
import React, { useState } from 'react';
import apiService from '../services/apiService';
import './DeleteAccountModal.css'; // Reutiliza el mismo CSS del modal

const DeleteAccountModal = ({ open, onClose }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('initial'); // 'initial', 'confirm', 'success'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!open) return null;

  const handleContinue = () => setStep('warning');
  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      // La API ya es protegida, el token se envía automáticamente
      await apiService.deleteAccount(password);
      setSuccess('Tu cuenta ha sido eliminada exitosamente. Serás desconectado automáticamente.');
      // El interceptor de apiClient redirige al login si el token se elimina
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al eliminar la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {step === 'initial' && (
          <>
            <h2 style={{ color: 'red' }}>Eliminar Cuenta Permanentemente</h2>
            <p style={{ fontWeight: 'bold' }}>¿Estás seguro de que deseas eliminar tu cuenta permanentemente?</p>
            <ul style={{ textAlign: 'left', margin: '12px 0' }}>
              <li>Es <b>IRREVERSIBLE</b></li>
              <li>Eliminará toda tu información</li>
              <li>Cerrará todas tus sesiones</li>
              <li>Perderás acceso a tus tickets</li>
            </ul>
            <div className="modal-actions">
              <button onClick={onClose} disabled={loading}>Cancelar</button>
              <button style={{ background: 'red' }} onClick={() => setStep('confirm')} disabled={loading}>
                Continuar
              </button>
            </div>
          </>
        )}
        {step === 'confirm' && (
          <>
            <h2 style={{ color: 'red' }}>Confirmar Identidad</h2>
            <p>Para tu seguridad, confirma tu contraseña actual para proceder con la eliminación de la cuenta:</p>
            <input
              type="password"
              placeholder="Contraseña actual"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading || !!success}
            />
            {error && <div className="modal-error">{error}</div>}
            {success && <div className="modal-success">{success}</div>}
            <div className="modal-actions">
              <button onClick={onClose} disabled={loading}>Cancelar</button>
              <button
                style={{ background: 'red' }}
                onClick={handleConfirm}
                disabled={loading || !password || !!success}
              >
                {loading ? 'Procesando...' : 'Eliminar Cuenta'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteAccountModal;