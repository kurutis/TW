import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Создаем основной экземпляр API
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
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
    // Ошибка от сервера
    return {
      status: error.response.status,
      data: error.response.data,
      message: error.response.data?.error || 'Server error',
      isNetworkError: false
    };
  } else if (error.request) {
    // Запрос был сделан, но ответ не получен
    return {
      status: 503,
      message: 'Сервер не отвечает',
      isNetworkError: true
    };
  } else {
    // Ошибка при настройке запроса
    return {
      status: 500,
      message: 'Ошибка при отправке запроса',
      isNetworkError: true
    };
  }
};

api.interceptors.request.use(config => {
  const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            error.message = 'Требуется авторизация';
        }
        return Promise.reject(error);
    }
);


export const apiService = {
  auth: {
    login: async (credentials) => {
      try {
        const response = await api.post('/auth/login', credentials);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    register: async (userData) => {
      try {
        const response = await api.post('/auth/register', userData);
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    logout: async () => {
      try {
        const response = await api.post('/auth/logout');
        return response.data;
      } catch (error) {
        throw error;
      }
    },
    me: async () => {
      try {
        const response = await api.get('/auth/me');
        return response.data;
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
        const response = await api.get('/cart');
        return response.data;
      } catch (error) {
        throw handleError(error);
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
