import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import './RegisterPage.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const validateName = (value) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;
    if (!value) return "El nombre es obligatorio";
    if (!nameRegex.test(value)) return "Solo se permiten letras y espacios";
    return null;
  };

  const validateLastName = (value) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/;
    if (!value) return "El apellido es obligatorio";
    if (!nameRegex.test(value)) return "Solo se permiten letras y espacios";
    return null;
  };

  const validatePhone = (value) => {
    if (value && !/^\d{10}$/.test(value)) {
      return "El teléfono debe tener 10 dígitos";
    }
    return null;
  };

  const validateEmail = (value) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!value) return "El correo es obligatorio";
    if (!emailRegex.test(value)) return "Formato de correo no válido";
    return null;
  };

  const validatePassword = (value) => {
    if (!value) return "La contraseña es obligatoria";
    if (value.length < 6) return "Debe tener al menos 6 caracteres";
    return null;
  };

  const validateConfirmPassword = (value) => {
    if (!value) return "Confirma la contraseña";
    if (value !== formData.password) return "Las contraseñas no coinciden";
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Capitalizar primera letra para nombre y apellido
    if ((name === 'name' || name === 'lastName') && value) {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Validar en tiempo real
    const validators = {
      name: validateName,
      lastName: validateLastName,
      phone: validatePhone,
      email: validateEmail,
      password: validatePassword,
      confirmPassword: validateConfirmPassword,
    };

    const error = validators[name]?.(processedValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {
      name: validateName(formData.name),
      lastName: validateLastName(formData.lastName),
      phone: validatePhone(formData.phone),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!acceptedTerms) {
      setGeneralError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Llamar al endpoint de registro
      const response = await apiService.registerAttender({
        fullName: `${formData.name} ${formData.lastName}`,
        phone: formData.phone.trim() || null,
        email: formData.email,
        password: formData.password,
      });

      alert("Registro realizado exitosamente. Revise su correo electrónico para verificar su cuenta.");
      navigate('/login', { state: { from: '/' } });
    } catch (error) {
      setGeneralError(error.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1 className="register-title">Registro de Usuario</h1>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {generalError && (
            <div className="register-error-general full-width">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              placeholder="Tu nombre"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Apellido</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={loading}
              placeholder="Tu apellido"
            />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono (Opcional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={loading}
              placeholder="Ej: 0991234567"
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              placeholder="correo@ejemplo.com"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-field-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className="password-input"
                placeholder="••••••••"
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
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <div className="password-field-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                className="password-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
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
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <div className="terms-checkbox full-width">
            <label>
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                disabled={loading}
              />
              <span>
                Acepto los <a href="/terms" target="_blank" rel="noopener noreferrer">términos y condiciones</a>
              </span>
            </label>
          </div>

          <div className="register-actions full-width">
            <button 
              type="submit" 
              className="btn btn-primary btn-register"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Registrando...</span>
                </>
              ) : (
                'Registrar'
              )}
            </button>
            <button 
              type="button" 
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
