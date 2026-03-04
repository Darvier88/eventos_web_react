import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './LoginPage.css';
import './ForgotPassword.css';

const ForgotPasswordPage = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const handleGoBack = () => {
		navigate('/login');
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccess('');
		setLoading(true);
		try {
			const msg = await apiService.requestPasswordReset(email);
			setSuccess(msg);
		} catch (err) {
			setError(err.message || 'Error al solicitar restablecimiento.');
		} finally {
			setLoading(false);
		}
	};

    useEffect(() => {
        if(success) {
            const timer = setTimeout(() => {
                navigate('/change-password',{ state: { email, show_token: true } });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [success, navigate]);

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
						onError={(e) => { e.target.style.display = 'none'; }}
					/>
					<h1 className="forgot-title">¿Olvidaste tu contraseña?</h1>
					<p className="login-subtitle">Ingresa tu correo electrónico para restablecerla</p>
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
                    <div className="request-success">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ margin: '0 4px 2px auto' }}>
                            <circle cx="12" cy="12" r="10" stroke="#4caf50"></circle>
                            <path d="M8 12l2 2l4-4" stroke="#4caf50" strokeWidth="2" fill="none" />
                        </svg>
                        <span>{success}</span>
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
					<button 
						type="submit" 
						className="btn btn-primary btn-login"
						disabled={loading || !email}
					>
						{loading ? (
							<>
								<div className="spinner-small"></div>
								<span>Enviando...</span>
							</>
						) : (
							'Enviar enlace de restablecimiento'
						)}
					</button>
					<div className="login-footer">
						<a href="/login" className="login-link">
							¿Ya tienes cuenta? Inicia sesión
						</a>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ForgotPasswordPage;
