import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Создаем основной экземпляр API
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Критически важно для cookie-based аутентификации
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Создаем экземпляр для FormData
const apiFormData = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Общий обработчик ошибок
const handleError = (error) => {
  if (error.response) {
    // Обработка 401 ошибки (неавторизован)
    if (error.response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth-required'));
    }
    
    return {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data?.error || error.response.data?.message || 'Ошибка сервера',
      isNetworkError: false
    };
  }
  
  if (error.code === 'ECONNABORTED') {
    return {
      status: 504,
      message: 'Таймаут запроса',
      isNetworkError: true
    };
  }
  
  return {
    status: 500,
    message: 'Ошибка соединения',
    isNetworkError: true
  };
};

api.interceptors.request.use(config => {
  // Добавляем токен, если он есть
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if ( config.url?.startsWith('/orders')) {
    return api.get('/auth/verify')
      .then(() => config)
      .catch(error => {
        throw error;
      });
  }
  
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Глобальная обработка 401 ошибки
      window.dispatchEvent(new CustomEvent('auth-required'));
    }
    return Promise.reject(error);
  }
);



// Добавляем перехватчики для FormData API
apiFormData.interceptors.response.use(
  response => response,
  error => Promise.reject(handleError(error))
);

export const apiService = {
  auth: {
    verifySession: async () => {
        try {
          return await api.get('/auth/verify');
        } catch (error) {
          throw error;
        }
      },
    login: async (credentials) => {
      try {
        const response = await api.post('/auth/login', credentials);
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    },
    register: async (userData) => {
      try {
        const response = await api.post('/auth/register', userData);
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    },
    logout: async () => {
      try {
        const response = await api.post('/auth/logout');
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    },
    me: async () => {
      try {
        const response = await api.get('/auth/me');
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    }
  },
  
 products: {
    getAll: async (params = {}) => {
      try {
        const response = await api.get('/products', { params });
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    },
    getById: async (id) => {
      try {
        const response = await api.get(`/products/${id}`);
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    }
  },
  
  categories: {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
  },
  
  reviews: {
    getAll: () => api.get('/reviews'),
    create: (formData) => apiFormData.post('/reviews', formData),
    getByUser: (userId) => api.get(`/reviews/user/${userId}`),
    update: (id, formData) => apiFormData.put(`/reviews/${id}`, formData),
    delete: (id) => api.delete(`/reviews/${id}`)
  },
  
  cart: {
    get: async () => {
      try {
        await apiService.auth.verifySession();
        return await api.get('/cart');
      } catch (error) {
        throw error;
      }
    },
    add: async (data) => {
      try {
        const response = await api.post('/cart', data);
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    },
    update: async (id, data) => {
      try {
        const response = await api.put(`/cart/${id}`, data);
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    },
    remove: async (id) => {
      try {
        const response = await api.delete(`/cart/${id}`);
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    },
    clear: async () => {
      try {
        const response = await api.delete('/cart');
        return response.data;
      } catch (error) {
        throw handleError(error);
      }
    }
  },
  
  orders: {
    create: (orderData) => api.post('/orders', orderData),
    get: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`) 
  }
};

export { api, apiFormData };