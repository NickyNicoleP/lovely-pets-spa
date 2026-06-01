import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token de acceso
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de token expirado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        
        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Funciones helper para cada endpoint
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: (data) => api.post('/auth/logout', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  verify2FA: (data) => api.post('/auth/verify-2fa', data),
  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (data) => api.post('/auth/2fa/enable', data),
  disable2FA: (data) => api.post('/auth/2fa/disable', data),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUserRole: (userId, data) => api.put(`/auth/users/${userId}/role`, data),
  updateUserStatus: (userId, data) => api.put(`/auth/users/${userId}/status`, data),
  deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
  getCaptcha: () => api.get('/auth/captcha')
};

export const clientesAPI = {
  getAll: () => api.get('/clientes'),
  getById: (id) => api.get(`/clientes/${id}`),
  create: (data) => api.post('/clientes', data),
  update: (id, data) => api.put(`/clientes/${id}`, data),
  delete: (id) => api.delete(`/clientes/${id}`),
  getMascotas: (id) => api.get(`/clientes/${id}/mascotas`)
};

export const mascotasAPI = {
  getAll: () => api.get('/mascotas'),
  getById: (id) => api.get(`/mascotas/${id}`),
  create: (data) => api.post('/mascotas', data),
  update: (id, data) => api.put(`/mascotas/${id}`, data),
  delete: (id) => api.delete(`/mascotas/${id}`),
  uploadVacunas: (formData) => {
    const uploadApi = axios.create({
      baseURL: '/api'
    });
    const token = localStorage.getItem('accessToken');
    if (token) {
      uploadApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return uploadApi.post('/mascotas/upload-vacunas', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

export const serviciosAPI = {
  getAll: () => api.get('/servicios'),
  getById: (id) => api.get(`/servicios/${id}`),
  create: (data) => api.post('/servicios', data),
  update: (id, data) => api.put(`/servicios/${id}`, data),
  delete: (id) => api.delete(`/servicios/${id}`)
};

export const productosAPI = {
  getAll: () => api.get('/productos'),
  getById: (id) => api.get(`/productos/${id}`),
  create: (data) => api.post('/productos', data),
  update: (id, data) => api.put(`/productos/${id}`, data),
  delete: (id) => api.delete(`/productos/${id}`),
  getLowStock: () => api.get('/productos/low-stock'),
  
  // Métodos para imágenes
  uploadImage: (formData) => {
    const uploadApi = axios.create({
      baseURL: '/api'
    });
    
    // Agregar token para upload
    const token = localStorage.getItem('accessToken');
    if (token) {
      uploadApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    return uploadApi.post('/productos/upload-imagen', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  agregarImagen: (data) => api.post('/productos/imagenes', data),
  getImagenes: (productoId) => api.get(`/productos/${productoId}/imagenes`),
  deleteImage: (imagenId) => api.delete(`/productos/imagenes/${imagenId}`),
  setMainImage: (imagenId) => api.put(`/productos/imagenes/${imagenId}/principal`)
};

export const carritoAPI = {
  getAll: () => api.get('/carrito'),
  getById: (id) => api.get(`/carrito/${id}`),
  create: (data) => api.post('/carrito', data),
  updateStatus: (id, data) => api.put(`/carrito/${id}/status`, data)
};

export const pagosAPI = {
  getAll: (params) => api.get('/pagos', { params }),
  getById: (id) => api.get(`/pagos/${id}`),
  create: (data) => api.post('/pagos', data)
};

export const notificacionesAPI = {
  getAll: () => api.get('/notificaciones'),
  markRead: (id) => api.patch(`/notificaciones/${id}/read`)
};

export const agendaAPI = {
  getAll: (params) => api.get('/agenda', { params }),
  getById: (id) => api.get(`/agenda/${id}`),
  create: (data) => api.post('/agenda', data),
  update: (id, data) => api.put(`/agenda/${id}`, data),
  delete: (id) => api.delete(`/agenda/${id}`),
  getHorarios: (params) => api.get('/agenda/horarios', { params })
};

export const fichaGroomingAPI = {
  getAll: (params) => api.get('/ficha-grooming', { params }),
  getById: (id) => api.get(`/ficha-grooming/${id}`),
  create: (data) => api.post('/ficha-grooming', data),
  update: (id, data) => api.put(`/ficha-grooming/${id}`, data),
  addInsumo: (id, data) => api.post(`/ficha-grooming/${id}/insumo`, data),
  uploadFoto: (id, formData) => {
    const uploadApi = axios.create({
      baseURL: '/api'
    });
    const token = localStorage.getItem('accessToken');
    if (token) {
      uploadApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    return uploadApi.post(`/ficha-grooming/${id}/fotos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updateChecklistItem: (id, itemKey, data) => api.put(`/ficha-grooming/${id}/checklist/${encodeURIComponent(itemKey)}`, data),
  close: (id) => api.post(`/ficha-grooming/${id}/cerrar`),
  getEstadisticas: (params) => api.get('/ficha-grooming/estadisticas', { params })
};

export const inventarioAPI = {
  getAll: (params) => api.get('/inventario', { params }),
  getById: (id) => api.get(`/inventario/${id}`),
  create: (data) => api.post('/inventario', data)
};

export const auditAPI = {
  getLoginLogs: (params) => api.get('/audit/login', { params }),
  getAuditLogs: (params) => api.get('/audit', { params })
};

export const groomersAPI = {
  getAll: () => api.get('/groomers'),
  getById: (id) => api.get(`/groomers/${id}`),
  create: (data) => api.post('/groomers', data),
  update: (id, data) => api.put(`/groomers/${id}`, data),
  delete: (id) => api.delete(`/groomers/${id}`),
  updateDisponibilidad: (id, data) => api.put(`/groomers/${id}/disponibilidad`, data)
};

export const reportesAPI = {
  getVentas: (params) => api.get('/reportes/ventas', { params }),
  getAgendaDiaria: (fecha) => api.get('/reportes/agenda-diaria', { params: { fecha } }),
  getHistorialGroomer: (groomer_id, params) => api.get(`/reportes/groomer/${groomer_id}/historial`, { params }),
  getEstadisticasGroomer: (groomer_id, params) => api.get(`/reportes/groomer/${groomer_id}/estadisticas`, { params }),
  getEstadisticasGenerales: (params) => api.get('/reportes/estadisticas', { params })
};

export const whatsappAPI = {
  getStatus: () => api.get('/whatsapp/status'),
  getQrCode: () => api.get('/whatsapp/qr'),
  getMessageHistory: (limit = 50) => api.get('/whatsapp/history', { params: { limit } }),
  reconnect: () => api.post('/whatsapp/reconnect'),
  disconnect: () => api.post('/whatsapp/disconnect')
};