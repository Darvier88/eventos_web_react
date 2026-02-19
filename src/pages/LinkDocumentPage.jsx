// src/pages/LinkDocumentPage.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './LinkDocumentPage.css';

const LinkDocumentPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { returnTo = '/purchase', eventId } = state || {};

  const [documentType, setDocumentType] = useState('DNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!documentNumber.trim()) {
      setError('Por favor ingresa el número de documento');
      return;
    }

    setLoading(true);
    try {
      // Actualizar perfil del usuario con documento de identidad
      const userProfile = await apiService.getCurrentUserProfile();
      
      await apiService.updateUserProfile(userProfile._id, {
        idDocumentType: documentType,
        idDocument: documentNumber.trim(),
      });

      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate(returnTo, { 
          state: { eventId } 
        });
      }, 2000);
    } catch (err) {
      console.error('Error al vincular documento:', err);
      setError(err.message || 'No se pudo vincular el documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="link-document-page">
      <div className="link-document-container">
        <div className="link-document-header">
          <h1>Vincular Documento</h1>
          <p>Necesitamos tu documento de identidad para continuar con la compra</p>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>¡Documento vinculado exitosamente!</h2>
            <p>Redirigiendo...</p>
          </div>
        ) : (
          <form className="link-document-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="documentType">Tipo de Documento</label>
              <select
                id="documentType"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                disabled={loading}
              >
                <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                <option value="PASSPORT">Pasaporte</option>
                <option value="CEDULA">Cédula de Identidad</option>
                <option value="RUC">RUC</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="documentNumber">Número de Documento</label>
              <input
                id="documentNumber"
                type="text"
                placeholder="Ej: 12345678"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                disabled={loading}
                maxLength="20"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="btn-submit"
              disabled={loading || !documentNumber.trim()}
            >
              {loading ? 'Vinculando...' : 'Vincular Documento'}
            </button>

            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancelar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LinkDocumentPage;
