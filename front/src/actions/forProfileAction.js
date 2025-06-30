import { apiService } from '../services/api';

// Вспомогательная функция для обработки ошибок
const getErrorMessage = (error) => 
  error.response?.data?.message || error.message || 'Произошла ошибка';

// Чистка ошибок аутентификации
const getAuthError = (error) => {
  // Приоритеты получения сообщения об ошибке:
  return error.response?.data?.error?.details?.email?.[0] || // Детализированные ошибки валидации
         error.response?.data?.error?.message ||             // Стандартное сообщение от API
         error.response?.data?.message ||                    // Альтернативное поле с сообщением
         error.message ||                                    // Сообщение из исключения
         'Произошла неизвестная ошибка';                     // Запасной вариант
};

export const clearAuthError = () => ({
  type: 'CLEAR_AUTH_ERROR'
});

const handleAuthResponse = (response) => {
  // Если ответ полностью отсутствует
  if (!response) {
    throw new Error('Пустой ответ сервера');
  }

  // Проверяем различные варианты расположения данных
  const responseData = response.data || response;
  
  // Если нет данных вообще
  if (!responseData) {
    throw new Error('Отсутствуют данные в ответе сервера');
  }

  // Проверяем различные варианты токена
  const token = responseData.access_token || responseData.token;
  
  // Если нет токена, но есть пользователь (например, для /me endpoint)
  if (!token && !responseData.user && !responseData.email) {
    throw new Error('Отсутствуют данные аутентификации в ответе');
  }

  // Если есть токен - сохраняем его
  if (token) {
    localStorage.setItem('authToken', token);
  }

  return {
    token,
    user: responseData.user || {
      email: responseData.email,
      id: responseData.id,
      ...responseData // включаем все остальные поля
    }
  };
};

export const login = (credentials) => async (dispatch) => {
  dispatch({ type: 'LOGIN_REQUEST' });

  try {
    console.log('Отправка данных:', credentials);
    const response = await apiService.auth.login(credentials);
    console.log('Ответ сервера:', response);

    const { token, user } = handleAuthResponse(response);

    localStorage.setItem('authToken', token);
    
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user }
    });

    return { success: true, user };

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
