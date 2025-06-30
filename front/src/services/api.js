import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Вспомогательная функция для форматирования ошибок
const formatError = (error) => {
  if (error.response) {
    return {
      status: error.response.status,
      data: error.response.data || { error: 'Ошибка сервера' },
      message: error.response.data?.message || 'Произошла ошибка'
    };
  }
  return {
    status: 500,
    data: { error: 'Network Error' },
    message: 'Проблемы с соединением'
  };
};

// Функция создания экземпляра API
const createApiInstance = (config) => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: config.timeout,
    withCredentials: true,
    headers: config.headers
  });

  instance.interceptors.request.use(config => {
    console.log('Making request to:', config.url);
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
      return Promise.reject(formatError(error));
    }
  );

  return instance;
};

// Создаем экземпляры API
const api = createApiInstance({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const apiFormData = createApiInstance({
  timeout: 15000,
  headers: {} // Для FormData заголовки устанавливаются автоматически
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
    getAll: (params = {}) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (productData) => api.post('/products', productData),
    update: (id, productData) => api.put(`/products/${id}`, productData),
    delete: (id) => api.delete(`/products/${id}`)
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