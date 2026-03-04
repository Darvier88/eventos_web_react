import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './ProfilePage.css';
import { termsContent, dataUsagePolicy, rechargePolicy } from '../constants/policy_text';
import PolicyModal from '../components/PolicyModal';

const ProfilePage = () => {
  const [attender, setAttender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyContent, setPolicyContent] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem('user_id');
        if (!userId) throw new Error('Usuario no autenticado');
        const data = await apiService.getAttenderById(userId);
        setAttender(data);
      } catch (err) {
        setError(err.message || 'Error al cargar el perfil');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user_id');
    navigate('/login');
  };

  if (loading) return <div className="profile-page"><div className="spinner"></div></div>;
  if (error) return <div className="profile-page"><div className="login-error">{error}</div></div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header" style={{ marginBottom: 24 }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#607d8b" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
          </svg>
          <h1 className="profile-title" style={{ fontSize: 32, margin: 0 }}>{attender.full_name || attender.fullName}</h1>
        </div>
        <div className="profile-list">
          <div className="profile-item">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#607d8b" stroke-width="2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="8" cy="10" r="2" />
                <line x1="14" y1="8" x2="18" y2="8" />
                <line x1="14" y1="12" x2="18" y2="12" />
                <line x1="8" y1="14" x2="18" y2="14" />
            </svg>
            <div>
              <div className="profile-label">Cédula de Identidad</div>
              <div className="profile-value">{attender.id_document || attender.idDocument || 'No vinculada'}</div>
            </div>
          </div>
          <div className="profile-item">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#607d8b" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <polyline points="3,7 12,13 21,7" />
            </svg><div>
              <div className="profile-label">Correo Electrónico</div>
              <div className="profile-value">{attender.email}</div>
            </div>
          </div>
          <div className="profile-item">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#607d8b" strokeWidth="2"><path d="M22 16.92V19a2 2 0 01-2 2A19.72 19.72 0 013 5a2 2 0 012-2h2.09a2 2 0 012 1.72c.13 1.05.37 2.07.72 3.06a2 2 0 01-.45 2.11l-.27.27a16 16 0 006.29 6.29l.27-.27a2 2 0 012.11-.45c.99.35 2.01.59 3.06.72A2 2 0 0122 16.92z"/></svg>
            <div>
              <div className="profile-label">Teléfono</div>
              <div className="profile-value">{attender.phone || attender.phone_number || attender.phoneNumber || 'No registrado'}</div>
            </div>
          </div>
        </div>
        <div className="button-container">
          <div className="button-container-top">
            <button className="profile-btn profile-btn-primary" onClick={() => navigate('/account-settings')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 008 19a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004 15.7a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 005 8.7a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 008.3 5a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019 8.3a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              <span className="profile-btn-label-primary">Configuración de Cuenta</span>
            </button>

            <button className="profile-btn profile-btn-danger" onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5m0 0l-5-5m5 5H9"/>
              </svg>
              <span className="profile-btn-label">Cerrar Sesión</span>
            </button>
          </div>
          <div className="button-container-bottom">
            <button className="profile-btn profile-btn-link" onClick={() => { setPolicyTitle('Términos y Condiciones'); setPolicyContent(termsContent); setShowPolicyModal(true); }}>
              <span className='profile-btn-label'>Términos y Condiciones</span>
            </button>
            <button className="profile-btn profile-btn-link" onClick={() => { setPolicyTitle('Política de Uso de Datos'); setPolicyContent(dataUsagePolicy); setShowPolicyModal(true); }}>
              <span className='profile-btn-label'>Política de Uso de Datos</span>
            </button>
            <button className="profile-btn profile-btn-link" onClick={() => { setPolicyTitle('Política de Recargas'); setPolicyContent(rechargePolicy); setShowPolicyModal(true); }}>
              <span className='profile-btn-label'>Política de Recargas</span>
            </button>
          </div>
        </div>
      </div>
      <PolicyModal open={showPolicyModal} onClose={() => setShowPolicyModal(false)} title={policyTitle} content={policyContent} />
    </div>
  );
};

export default ProfilePage;
