import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiService from '../services/apiService';
import './LoginPage.css';
import './ForgotPassword.css';

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [token, setToken] = useState('');
    const [showToken, setShowToken] = useState(false);
    useEffect(() => {
        const state = location.state;
        if (state && state.email) {
            setEmail(state.email);
        }
        if (state && state.showToken) {
            setShowToken(true);
            if (state.token) setToken(state.token);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        setLoading(true);
        try {
            if (showToken) {
                await apiService.resetPassword(email, token, newPassword);
            } else {
                await apiService.changePassword(currentPassword, newPassword, confirmPassword);
            }
            setSuccess('Contraseña cambiada exitosamente. Redirigiendo al login...');
            setTimeout(() => navigate('/login', { state: { email } }), 1500);
        }
        catch (err) {
            setError(err.message || 'Error al cambiar la contraseña.');
        }
        finally {
            setLoading(false);
        }
    };

   
    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <button 
                        onClick={() => navigate('/login')} 
                        className="back-button"
                        type="button"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <img 
                        src="/logo.png" 
                        alt="Logo" 
                        className="login-logo"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <h1 className="forgot-title">Cambiar contraseña</h1>
                    <p className="login-subtitle">Ingresa tu nueva contraseña</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="login-success request-success">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ display: 'block', margin: '0 auto 8px auto' }}>
                                <circle cx="12" cy="12" r="10" stroke="#4caf50"></circle>
                                <path d="M8 12l2 2l4-4" stroke="#4caf50" strokeWidth="2" fill="none" />
                            </svg>
                            <span>{success}</span>
                        </div>
                    )}
                    {showToken ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="email">Correo electrónico</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    required
                                    disabled
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="token">Token de recuperación</label>
                                <input
                                    type="text"
                                    id="token"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="Ingresa el token de recuperación"
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="form-group">
                            <label htmlFor="currentPassword">Contraseña actual</label>
                            <input
                                type="password"
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="newPassword">Nueva contraseña</label>
                        <div className="password-field-wrapper">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                                autoComplete="new-password"
                                className="password-input"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                tabIndex="-1"
                                aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showNewPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar contraseña</label>
                        <div className="password-field-wrapper">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                                autoComplete="new-password"
                                className="password-input"
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex="-1"
                                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {showConfirmPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-primary btn-login"
                        disabled={loading || !newPassword || !confirmPassword || (showToken ? !token : !currentPassword)}
                    >
                        {loading ? (
                            <>
                                <div className="spinner-small"></div>
                                <span>Cambiando contraseña...</span>
                            </>
                        ) : (
                            'Cambiar contraseña'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
export default ChangePasswordPage;