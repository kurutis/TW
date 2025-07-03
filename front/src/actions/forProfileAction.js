import { apiService } from '../services/api';

const getErrorMessage = (error) => 
  error.response?.data?.message || error.message || 'Произошла ошибка';


const getAuthError = (error) => {
  return error.response?.data?.error?.details?.email?.[0] || 
         error.response?.data?.error?.message ||             
         error.response?.data?.message ||                    
         error.message ||                                    
         'Произошла неизвестная ошибка';                     
};

export const clearAuthError = () => ({
  type: 'CLEAR_AUTH_ERROR'
});

const handleAuthResponse = (response) => {
  if (!response) {
    throw new Error('Пустой ответ сервера');
  }

  const responseData = response.data || response;
  
  if (!responseData) {
    throw new Error('Отсутствуют данные в ответе');
  }

  const token = responseData.access_token || responseData.token;
  if (!token) {
    throw new Error('Токен не получен от сервера');
  }

  return {
    token,
    user: responseData.user || {
      id: responseData.id,
      email: responseData.email,
      ...responseData
    }
  };
};

export const login = (credentials) => async (dispatch) => {
  dispatch({ type: 'LOGIN_REQUEST' });

  try {
    const response = await apiService.auth.login(credentials);
    
    if (!response || !response.token) {
      throw new Error('Invalid server response');
    }

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { 
        user: response.user,
        token: response.token
      }
    });

    return { success: true };

  } catch (error) {
    const message = error?.data?.error || error.message || 'Login failed';
    dispatch({ type: 'LOGIN_FAILURE', payload: message });
    return { success: false, error: message };
  }
};

export const register = (userData) => async (dispatch) => {
  dispatch({ type: 'REGISTER_REQUEST' });

  try {
    const response = await apiService.auth.register(userData);
    
    if (!response || !response.token) {
      throw new Error('Invalid server response');
    }

    dispatch({
      type: 'REGISTER_SUCCESS',
      payload: { 
        user: response.user,
        token: response.token
      }
    });

    return { success: true };

  } catch (error) {
    const message = error?.data?.error || error.message || 'Registration failed';
    dispatch({ type: 'REGISTER_FAILURE', payload: message });
    return { success: false, error: message };
  }
};


// Проверка аутентификации
export const checkAuth = () => async (dispatch) => {
  dispatch({ type: 'AUTH_CHECK_START' });
  
  try {
    const response = await apiService.auth.me();
    
    // Добавляем более строгую проверку ответа
    if (!response?.user?.id) {
      throw new Error('Invalid user data');
    }

    dispatch({
      type: 'AUTH_CHECK_SUCCESS',
      payload: { user: response.user }
    });
    
    return { isAuthenticated: true, user: response.user };
  } catch (error) {
    // Очищаем куки при неудачной проверке
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    dispatch({ type: 'AUTH_CHECK_FAILURE' });
    return { isAuthenticated: false };
  }
};

// Установка ошибки аутентификации
export const setAuthError = (error) => ({ 
  type: 'SET_AUTH_ERROR',
  payload: error
});

// Выход из системы
export const logout = () => async (dispatch) => {
  try {
    await apiService.auth.logout();
  } finally {
    localStorage.removeItem('authToken');
    dispatch({ type: 'LOGOUT_SUCCESS' });
    dispatch({ type: 'cart/resetCart' });
  }
};


// Успешная аутентификация (для сторонних аутентификаций)
export const authSuccess = (user) => ({
  type: 'AUTH_SUCCESS',
  payload: { user }
});

// Ошибка аутентификации (для сторонних аутентификаций)
export const authFailure = (error) => ({
  type: 'AUTH_FAILURE',
  payload: getErrorMessage(error)
});

export const showAuthModal = (payload) => ({
  type: 'SHOW_AUTH_MODAL',
  payload: {
    ...payload,
    callback: payload.callback || null
  }
});