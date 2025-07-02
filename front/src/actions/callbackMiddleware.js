export const callbackMiddleware = store => next => action => {
  if (action.type === 'HANDLE_AUTH_CALLBACK') {
    const { actionType } = action.payload;
    
    switch(actionType) {
      case 'ADD_TO_CART_AFTER_AUTH':
        // Здесь можно добавить логику для повторной попытки
        break;
      case 'SESSION_EXPIRED_CALLBACK':
        // Логика после повторного входа
        break;
      default:
        break;
    }
  }
  
  return next(action);
};