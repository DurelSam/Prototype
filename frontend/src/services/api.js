import axios from 'axios';
import API_CONFIG from '../config/api.config';

// Instance Axios configurée
const apiClient = axios.create({
  baseURL: API_CONFIG.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur de requête pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Erreurs de réponse du serveur
      switch (error.response.status) {
        case 401:
          // Non autorisé - rediriger vers login
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Accès interdit');
          break;
        case 404:
          console.error('Ressource non trouvée');
          break;
        case 500:
          console.error('Erreur serveur interne');
          break;
        default:
          console.error('Erreur:', error.response.data.message);
      }
    } else if (error.request) {
      // Erreur de requête (pas de réponse)
      console.error('Impossible de joindre le serveur');
    } else {
      // Autres erreurs
      console.error('Erreur:', error.message);
    }
    return Promise.reject(error);
  }
);

// Service API de base
const api = {
  // Health check
  healthCheck: () => apiClient.get('/health'),

  // Authentication
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    register: (userData) => apiClient.post('/auth/register', userData),
    logout: () => apiClient.post('/auth/logout'),
    getCurrentUser: () => apiClient.get('/auth/me')
  },

  // Tenants
  tenants: {
    getAll: () => apiClient.get('/tenants'),
    getById: (id) => apiClient.get(`/tenants/${id}`),
    create: (data) => apiClient.post('/tenants', data),
    update: (id, data) => apiClient.put(`/tenants/${id}`, data),
    delete: (id) => apiClient.delete(`/tenants/${id}`)
  },

  // Users
  users: {
    getAll: () => apiClient.get('/users'),
    getById: (id) => apiClient.get(`/users/${id}`),
    create: (data) => apiClient.post('/users', data),
    update: (id, data) => apiClient.put(`/users/${id}`, data),
    delete: (id) => apiClient.delete(`/users/${id}`)
  },

  // Communications
  communications: {
    getAll: (params) => apiClient.get('/communications', { params }),
    getById: (id) => apiClient.get(`/communications/${id}`),
    create: (data) => apiClient.post('/communications', data),
    update: (id, data) => apiClient.put(`/communications/${id}`, data),
    updateStatus: (id, status) => apiClient.patch(`/communications/${id}/status`, { status }),
    delete: (id) => apiClient.delete(`/communications/${id}`)
  },

  // Notifications
  notifications: {
    getAll: () => apiClient.get('/notifications'),
    getUnreadCount: () => apiClient.get('/notifications/unread-count'),
    markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.patch('/notifications/read-all')
  }
};

export default api;
export { apiClient };
