import axios from 'axios';

// Явно задаем базовый URL для API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Улучшенная функция обработки ошибок
const formatError = (error) => {
  if (error.response) {
    return {
      status: error.response.status,
      data: error.response.data || { error: 'Ошибка сервера' },
      message: error.response.data?.message || 'Произошла ошибка',
      isNetworkError: false
    };
  }
  
  if (error.code === 'ECONNABORTED') {
    return {
      status: 504,
      message: 'Таймаут запроса: сервер не ответил вовремя',
      isNetworkError: true
    };
  }
  
  return {
    status: 500,
    message: 'Проблемы с соединением',
    isNetworkError: true
  };
};

const createApiInstance = (config) => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: config.timeout,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    }
  });

  // Логирование запросов
  instance.interceptors.request.use(config => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }, error => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  });

  // Логирование ответов
  instance.interceptors.response.use(
    response => {
      console.log(`[API] Response ${response.status} ${response.config.url}`);
      return response;
    },
    error => {
      const formattedError = formatError(error);
      console.error('[API] Error:', formattedError);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      
      return Promise.reject(formattedError);
    }
  );

  return instance;
};

// Основной экземпляр API
const api = createApiInstance({
  timeout: 10000
});

// Экземпляр для FormData
const apiFormData = createApiInstance({
  timeout: 15000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Экспортируемые сервисы
export const apiService = {
  auth: {
    login: async (credentials) => {
      try {
        const response = await api.post('/auth/login', {
          email: credentials.email.trim(),
          password: credentials.password
        });
        
        if (response.data?.access_token) {
          localStorage.setItem('authToken', response.data.access_token);
        }
        
        return response.data;
      } catch (error) {
        throw error; // Ошибка уже отформатирована в интерцепторе
      }
    },
    register: async (userData) => {
      try {
        const response = await api.post('/auth/register', userData);
        
        if (response.data?.access_token) {
          localStorage.setItem('authToken', response.data.access_token);
        }
        
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    logout: async () => {
      try {
        const response = await api.post('/auth/logout');
        localStorage.removeItem('authToken');
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    me: async () => {
      try {
        return await api.get('/auth/me');
      } catch (error) {
        throw error;
      }
    }
  },
  
  products: {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      console.error('Products getAll error:', error);
      throw error;
    }
  },
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw error;
    }
  }
},
  
  categories: {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
  },
  
  reviews: {
    getAll: () => api.get('/reviews'),
    create: (formData) => apiFormData.post('/reviews', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
    getByUser: (userId) => api.get(`/reviews/user/${userId}`),
    update: (id, formData) => apiFormData.put(`/reviews/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
    delete: (id) => api.delete(`/reviews/${id}`)
  },
  
  cart: {
    get: () => api.get('/cart'),
    add: (data) => api.post('/cart', data),
    update: (id, data) => api.put(`/cart/${id}`, data),
    remove: (id) => api.delete(`/cart/${id}`),
    clear: () => api.delete('/cart')
  },
  
  orders: {
    create: (orderData) => api.post('/orders', orderData),
    get: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`) 
  }
};

export { api, apiFormData };