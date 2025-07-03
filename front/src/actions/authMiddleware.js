export const authMiddleware = store => next => action => {
  // При успешной авторизации
  if (action.type === 'LOGIN_SUCCESS' || action.type === 'REGISTER_SUCCESS') {
    // Выполняем отложенные действия (например, добавление в корзину)
    const pendingAction = localStorage.getItem('pendingAction');
    if (pendingAction) {
      const { type, payload } = JSON.parse(pendingAction);
      store.dispatch({ type, payload });
      localStorage.removeItem('pendingAction');
    }
  }
  
  // При разлогине очищаем всё
  if (action.type === 'LOGOUT') {
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    localStorage.removeItem('pendingAction');
  }
  
  return next(action);
};
