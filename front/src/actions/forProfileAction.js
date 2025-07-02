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

  // Явная проверка наличия токена
  const token = responseData.access_token || responseData.token;
  if (!token) {
    throw new Error('Токен не получен от сервера');
  }

  localStorage.setItem('authToken', token);
  console.log('Токен сохранен:', token);

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
    
    if (!response.user) {
      throw new Error('Данные пользователя не получены');
    }

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user: response.user }
    });

    return { success: true };

  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'Ошибка входа';
    
    dispatch({
      type: 'LOGIN_FAILURE',
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};

// Регистрация пользователя
export const register = (userData) => async (dispatch) => {
  dispatch({ type: 'REGISTER_REQUEST' });

  try {
    const response = await apiService.auth.register(userData);
    const { token, user } = handleAuthResponse(response);

    localStorage.setItem('authToken', token);
    
    dispatch({
      type: 'REGISTER_SUCCESS',
      payload: { user }
    });

    return { success: true };

  } catch (error) {
      console.error('Полная ошибка:', {
        error,
        response: error.response?.data
      });

      let message = 'Ошибка входа';
      
      if (error.response) {
        // Обработка стандартных ошибок axios
        const serverError = error.response.data;
        
        if (serverError.message) {
          message = serverError.message;
        } else if (serverError.error) {
          message = serverError.error;
        } else if (error.response.status === 401) {
          message = 'Неверные учетные данные';
        }
      } else if (error.message) {
        message = error.message;
      }

      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message
      });

      return { success: false, error: message };
    }
  }


// Проверка аутентификации
export const checkAuth = () => async (dispatch) => {
  dispatch({ type: 'AUTH_CHECK_START' });
  
  const token = localStorage.getItem('authToken');
  if (!token) {
    dispatch({ type: 'AUTH_CHECK_SUCCESS', payload: { user: null } });
    return { isAuthenticated: false };
  }

  try {
    const response = await apiService.auth.me();
    
    // Обрабатываем случай, когда /me возвращает только данные пользователя без обертки
    const userData = response.data || response;
    
    if (!userData) {
      throw new Error('Данные пользователя не получены');
    }

    dispatch({
      type: 'AUTH_CHECK_SUCCESS',
      payload: { user: userData }
    });
    
    return { isAuthenticated: true, user: userData };
  } catch (error) {
    localStorage.removeItem('authToken');
    dispatch({
      type: 'AUTH_CHECK_FAILURE',
      payload: getErrorMessage(error)
    });
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
    // Пытаемся выполнить API-выход, но не блокируем процесс при ошибке
    await apiService.auth.logout().catch(e => console.log('Logout API error:', e));
  } finally {
    // Всегда очищаем хранилище
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    dispatch({ type: 'LOGOUT_SUCCESS' });
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
