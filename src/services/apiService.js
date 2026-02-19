// src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://biodynamics.tech/macak_dev';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de request: token sin "Bearer"
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('session_token');
    if (token) config.headers['Authorization'] = token;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: maneja 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // ==================== AUTH ====================
  async login(username, password) {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(
        `${API_BASE_URL}/user/login`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.status === 200) {
        return {
          userId: response.data.id,
          jwt: response.data.jwtoken,
          userRole: response.data.role,
          eventId: response.data.event_id,
          storeId: response.data.store_id,
        };
      }
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        throw new Error('Usuario o contraseña incorrecta');
      }
      throw new Error(`Error al iniciar sesión: ${error.message}`);
    }
  },

  async isValidSession() {
    try {
      const response = await apiClient.get('/user/validate');
      if (response.status === 200) {
        return {
          userId: response.data.id,
          jwt: response.data.jwtoken,
          userRole: response.data.role,
          eventId: response.data.event_id,
          storeId: response.data.store_id,
        };
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('LOGOUT_REQUIRED: Token inválido o expirado');
      }
      throw new Error(`Error de validación: ${error.message}`);
    }
  },

  async loginAttender(email, password) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/attender/login`,
        {
          email: email,
          password: password,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        return {
          userId: response.data.id,
          jwt: response.data.jwtoken,
          attender: response.data.user,
        };
      }
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 401) {
        throw new Error('Correo o contraseña incorrecta.');
      } else if (error.response?.status === 403) {
        try {
          await this.resendVerificationEmail(email);
        } catch (resendError) {
          console.error('Error al reenviar verificación:', resendError);
        }
        throw new Error('Por favor, verifique su correo electrónico. Se reenviará el correo de verificación.');
      }
      throw new Error(`Error al iniciar sesión: ${error.message}`);
    }
  },

  async resendVerificationEmail(email) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/attender/resend_verification`,
        null,
        { params: { email } }
      );

      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Usuario no encontrado');
      }
      if (error.response?.status === 400) {
        throw new Error('El correo ya está verificado');
      }
      throw new Error(`No se pudo reenviar el correo de verificación: ${error.message}`);
    }
  },

  async isValidSessionAttender() {
    try {
      const response = await apiClient.get('/attender/validate');
      if (response.status === 200) {
        return {
          userId: response.data.id,
          jwt: response.data.jwtoken,
          attender: response.data.user,
        };
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const errorMessage = error.response.data?.error || 'Token inválido';
        throw new Error(`LOGOUT_REQUIRED: ${errorMessage}`);
      }
      throw new Error(`Error de validación: ${error.message}`);
    }
  },

  async registerAttender({ fullName, phone, email, password }) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/attender`,
        {
          full_name: fullName,
          phone: phone || undefined,
          email: email,
          password: password,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        return {
          userId: response.data._id,
          message: 'Usuario registrado exitosamente. Revise su correo para verificar su cuenta.',
        };
      }
    } catch (error) {
      if (error.response?.status === 400) {
        const message = error.response.data?.message || 'Datos inválidos';
        throw new Error(message);
      }
      throw new Error(`Error al registrar usuario: ${error.message}`);
    }
  },

  // ==================== EVENTS ====================
  async getAllEvents() {
    try {
      const response = await axios.get(`${API_BASE_URL}/event/get_all`);
      return response.data;
    } catch (error) {
      throw new Error(`No se pudieron obtener los eventos: ${error.message}`);
    }
  },

  async getEventById(eventId) {
    try {
      // Usar el endpoint público de todos los eventos y filtrar por ID
      const allEvents = await axios.get(`${API_BASE_URL}/event/get_all`);
      const event = allEvents.data.find(e => e._id === eventId || e.id === eventId);
      
      if (!event) {
        throw new Error('El evento que está buscando no existe');
      }
      return event;
    } catch (error) {
      if (error.message.includes('no existe')) {
        throw error;
      }
      throw new Error(`No se pudo obtener el evento: ${error.message}`);
    }
  },

  async getTicketsByEvent(eventId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/ticket/event`, {
        params: { id: eventId },
      });
      return response.data;
    } catch (error) {
      throw new Error(`No se pudieron obtener los tickets: ${error.message}`);
    }
  },

  async getImageFileByEvent(eventId, imageType) {
    try {
      const response = await axios.get(`${API_BASE_URL}/image/`, {
        params: { id: eventId, type: imageType },
        responseType: 'blob',
      });
      if (response.status === 200) {
        return URL.createObjectURL(response.data);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('El tipo de imagen solicitado no existe para este evento.');
      }
      throw new Error(`No se pudo obtener la imagen: ${error.message}`);
    }
  },

  getBannerImageUrl(eventId) {
    return `${API_BASE_URL}/image/?id=${eventId}&type=banner`;
  },

  getSquareImageUrl(eventId) {
    return `${API_BASE_URL}/image/?id=${eventId}&type=square`;
  },

  // ==================== TICKETS / PURCHASE ====================
  async validateEventCode(eventId, code) {
    try {
      const response = await apiClient.post('/event/validate_code', {
        event_id: eventId,
        code,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 404) {
        const msg = error.response.data?.message || error.response.data?.error;
        throw new Error(msg || 'Código inválido');
      }
      throw new Error(`No se pudo validar el código: ${error.message}`);
    }
  },

  async createPurchaseTicket(eventId, attenderId, { toBuyTickets = {}, observation } = {}) {
    try {
      const body = { event_id: eventId, attender_id: attenderId };
      if (observation) body.observation = observation;

      const response = await apiClient.post('/purchase_ticket', body);
      if (response.status === 201) {
        const purchaseId = response.data?._id || response.data?.id;

        // Crear items de compra para cada ticket
        if (toBuyTickets && Object.keys(toBuyTickets).length > 0) {
          for (const [ticket, quantity] of Object.entries(toBuyTickets)) {
            try {
              const ticketData = typeof ticket === 'string' ? JSON.parse(ticket) : ticket;
              await this.createPurchaseTicketItem(ticketData.id, quantity, purchaseId);
            } catch (err) {
              console.error(`Error al crear item de ticket:`, err);
              throw new Error(`No se pudo agregar ticket a la compra: ${err.message}`);
            }
          }
        }

        return purchaseId;
      }
      throw new Error('No se pudo crear la orden');
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(msg || `Error al crear la orden: ${error.message}`);
    }
  },

  async createPurchaseTicketItem(ticketId, quantity, purchaseId) {
    try {
      const body = {
        ticket_id: ticketId,
        quantity,
        purchase_ticket_id: purchaseId,
      };

      const response = await apiClient.post('/purchase_ticket_item', body);
      if (response.status === 201) {
        return response.data;
      }
      throw new Error('No se pudo agregar el ticket');
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(msg || `Error al agregar el ticket: ${error.message}`);
    }
  },

  async sendTicketEmail(purchaseTicketId) {
    try {
      const response = await apiClient.post('/purchase_ticket/send_ticket', {}, {
        params: { purchase_ticket_id: purchaseTicketId },
      });
      if (response.status === 200) {
        return 'Ticket enviado por correo correctamente';
      }
      throw new Error('No se pudo enviar el ticket');
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(msg || `Error al enviar ticket por correo: ${error.message}`);
    }
  },

  async deletePurchaseTicket(purchaseId) {
    try {
      const response = await apiClient.delete('/purchase_ticket', {
        params: { id: purchaseId },
      });
      if (response.status !== 204) {
        throw new Error('No se pudo eliminar la orden');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(msg || `Error al eliminar la orden: ${error.message}`);
    }
  },

  async getPurchaseTicketsByAttender(attenderId) {
    try {
      const response = await apiClient.get('/purchase_ticket/attender', {
        params: { id: attenderId },
      });
      return response.data;
    } catch (error) {
      throw new Error(`No se pudieron obtener las órdenes: ${error.message}`);
    }
  },

  async getPayphoneTransactionsByAttender(attenderId) {
    try {
      const response = await apiClient.get(
        `/payphone_transaction/pending/by_attender/${attenderId}`
      );
      const data = response.data;
      if (Array.isArray(data)) return data.length;
      if (typeof data === 'number') return data;
      return 0;
    } catch (error) {
      throw new Error(
        `No se pudieron obtener transacciones pendientes: ${error.message}`
      );
    }
  },

  async getCurrentUserProfile() {
    const userId = localStorage.getItem('user_id');
    if (!userId) throw new Error('Usuario no autenticado');
    try {
      const response = await apiClient.get('/attender', { params: { id: userId } });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(msg || `No se pudo obtener el perfil: ${error.message}`);
    }
  },

  async updateUserProfile(userId, profileData) {
    try {
      const response = await apiClient.put(`/attender/${userId}`, profileData);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(msg || `No se pudo actualizar el perfil: ${error.message}`);
    }
  },

  async updatePurchaseTransaction(purchaseId, transactionId) {
    try {
      const response = await apiClient.put(`/purchase/${purchaseId}`, {
        transactionId,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(msg || `No se pudo actualizar la transacción: ${error.message}`);
    }
  },

  async updatePurchasePaymentStatus(purchaseId, paymentData) {
    try {
      const response = await apiClient.put(`/purchase/${purchaseId}/payment`, paymentData);
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(msg || `No se pudo actualizar el estado del pago: ${error.message}`);
    }
  },

  async downloadTicketPdf(purchaseTicketId) {
    try {
      const response = await apiClient.post(
        '/purchase_ticket/download_ticket',
        {},
        {
          params: { purchase_ticket_id: purchaseTicketId },
          responseType: 'blob',
        }
      );

      if (response.status === 200) {
        const blob = response.data;
        const fileName = `ticket_${purchaseTicketId.split('-')[0]}.pdf`;
        
        // Crear URL temporal para el blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear elemento <a> temporal para la descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        
        // Agregar al DOM, hacer click y remover
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL temporal
        window.URL.revokeObjectURL(url);
        
        return `PDF guardado correctamente: ${fileName}`;
      }
      throw new Error('No se pudo descargar el ticket');
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('El ticket no existe o no se pudo generar el PDF');
      }
      const msg = error.response?.data?.message || error.response?.data?.error;
      throw new Error(msg || `No se pudo descargar el ticket: ${error.message}`);
    }
  },
};

export default apiService;