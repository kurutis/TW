// actions/authMiddleware.js
export const authMiddleware = store => next => action => {
  const { type, payload } = action;
  
  // Очистка cookies при выходе
  if (type === 'LOGOUT_SUCCESS') {
    document.cookie = 'authToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    document.cookie = 'user=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
  
  // Обработка 401 ошибок
  if (type.endsWith('REJECTED') && payload?.status === 401) {
    store.dispatch({ type: 'LOGOUT' });
    store.dispatch({
      type: 'SHOW_AUTH_MODAL',
      payload: {
        message: 'Сессия истекла. Пожалуйста, войдите снова',
        callback: {
          type: 'SESSION_EXPIRED_CALLBACK'
        }
      }
    });
  }
  
  // Преобразование callback для SHOW_AUTH_MODAL
  if (type === 'SHOW_AUTH_MODAL' && payload?.callback) {
    const callbackAction = {
      type: 'HANDLE_AUTH_CALLBACK',
      payload: {
        actionType: payload.callback.type || 'DEFAULT_CALLBACK',
        modalMessage: payload.message
      }
    };
    
    return next({
      ...action,
      payload: {
        ...payload,
        callback: callbackAction
      }
    });
  }
  
  return next(action);
};