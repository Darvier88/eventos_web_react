import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAttender, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldNavigate, setShouldNavigate] = useState(false);

  // Efecto para navegar después de que isAuthenticated se actualice
  useEffect(() => {
    if (shouldNavigate && isAuthenticated) {
      const from = location.state?.from;
      const redirectTo = typeof from === 'string' ? from : from?.pathname || '/';
      navigate(redirectTo, { replace: true });
      setShouldNavigate(false);
    }
  }, [isAuthenticated, shouldNavigate, navigate, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginAttender(email, password);
      
      if (result.success) {
        console.log('[Login] Usuario ID:', result.data?.userId);
        console.log('[Login] Datos completos:', result.data);
        // Señalar que debe navegar cuando isAuthenticated se actualice
        setShouldNavigate(true);
      } else {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setError('Error al iniciar sesión. Por favor, intente nuevamente.');
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <button 
            onClick={handleGoBack} 
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
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h1 className="login-title">Bienvenido</h1>
          <p className="login-subtitle">Inicia sesión para continuar</p>
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

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-field-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
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
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              'Iniciar sesión'
            )}
          </button>

          <div className="login-footer">
            <a href="/register" className="login-link">
              ¿No tienes cuenta? Regístrate
            </a>
            <a href="/recuperar-contraseña" className="login-link">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;