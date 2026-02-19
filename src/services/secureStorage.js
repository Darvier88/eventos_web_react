// Servicio de almacenamiento seguro (equivalente a SecureStorageRepository de Dart)
// Usa localStorage para persistir datos del usuario

const STORAGE_KEYS = {
  EVENT_ID: 'selected_event_id',
  SESSION_TOKEN: 'session_token',
  USER_ID: 'user_id',
  STORE_ID: 'store_id',
  USER_TYPE: 'user_type',
};

export const secureStorage = {
  // Event ID
  setEventId(eventId) {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENT_ID, eventId);
    } catch (error) {
      console.error('Error saving event ID to storage:', error);
    }
  },

  getEventId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.EVENT_ID);
    } catch (error) {
      console.error('Error getting event ID from storage:', error);
      return null;
    }
  },

  clearEventId() {
    try {
      localStorage.removeItem(STORAGE_KEYS.EVENT_ID);
    } catch (error) {
      console.error('Error clearing event ID from storage:', error);
    }
  },

  // Session Token
  setSessionToken(token) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
    } catch (error) {
      console.error('Error saving session token:', error);
    }
  },

  getSessionToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    } catch (error) {
      console.error('Error getting session token:', error);
      return null;
    }
  },

  // User ID
  setUserId(userId) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } catch (error) {
      console.error('Error saving user ID:', error);
    }
  },

  getUserId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  },

  // Store ID
  setStoreId(storeId) {
    try {
      localStorage.setItem(STORAGE_KEYS.STORE_ID, storeId);
    } catch (error) {
      console.error('Error saving store ID:', error);
    }
  },

  getStoreId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.STORE_ID);
    } catch (error) {
      console.error('Error getting store ID:', error);
      return null;
    }
  },

  // User Type
  setUserType(userType) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);
    } catch (error) {
      console.error('Error saving user type:', error);
    }
  },

  getUserType() {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_TYPE);
    } catch (error) {
      console.error('Error getting user type:', error);
      return null;
    }
  },

  // Clear All
  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

export default secureStorage;