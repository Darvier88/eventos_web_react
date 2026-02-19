import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';
import secureStorage from '../services/secureStorage';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar sesión al iniciar (equivalente a AppStarted en Dart)
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = secureStorage.getSessionToken();
      const userType = secureStorage.getUserType();
      const userId = secureStorage.getUserId();

      if (!token || !userType || !userId) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      // Validar sesión según tipo de usuario
      if (userType === 'attender') {
        try {
          const response = await apiService.isValidSessionAttender(token);
          setUser({
            id: userId,
            type: 'attender',
            data: response,
          });
          setIsAuthenticated(true);
        } catch (error) {
          // Si falla la validación, al menos marca como autenticado si tiene token
          console.warn('Session validation warning:', error.message);
          setUser({
            id: userId,
            type: 'attender',
            data: null,
          });
          setIsAuthenticated(true);
        }
      } else {
        try {
          const response = await apiService.isValidSession(token);
          setUser({
            id: userId,
            type: 'user',
            role: response.userRole,
            data: response,
          });
          setIsAuthenticated(true);
        } catch (error) {
          console.warn('Session validation warning:', error.message);
          setUser({
            id: userId,
            type: 'user',
            data: null,
          });
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Session validation failed:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  // Login de usuario (admin/vendor)
  const login = async (username, password) => {
    try {
      const loginResponse = await apiService.login(username, password);
      
      // Guardar en storage (equivalente a _handleLoggedIn en Dart)
      secureStorage.setSessionToken(loginResponse.jwt);
      secureStorage.setUserId(loginResponse.userId);
      secureStorage.setUserType('user');

      // Guardar eventId o storeId según el rol
      if (loginResponse.eventId) {
        secureStorage.setEventId(loginResponse.eventId);
      }
      if (loginResponse.storeId) {
        secureStorage.setStoreId(loginResponse.storeId);
      }

      setUser({
        id: loginResponse.userId,
        type: 'user',
        role: loginResponse.userRole,
        data: loginResponse,
      });
      setIsAuthenticated(true);

      return { success: true, data: loginResponse };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Error al iniciar sesión' 
      };
    }
  };

  // Login de attender
  const loginAttender = async (email, password) => {
    try {
      const loginResponse = await apiService.loginAttender(email, password);
      
      // Guardar en storage
      secureStorage.setSessionToken(loginResponse.jwt);
      secureStorage.setUserId(loginResponse.userId);
      secureStorage.setUserType('attender');

      setUser({
        id: loginResponse.userId,
        type: 'attender',
        data: loginResponse,
      });
      setIsAuthenticated(true);

      return { success: true, data: loginResponse };
    } catch (error) {
      console.error('Attender login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Error al iniciar sesión' 
      };
    }
  };

  // Logout
  const logout = async () => {
    try {
      secureStorage.clearAll();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    loginAttender,
    logout,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};