export const SHOW_AUTH_MODAL = 'SHOW_AUTH_MODAL';
export const HIDE_AUTH_MODAL = 'HIDE_AUTH_MODAL';

export const showAuthModal = (payload = {}) => ({
  type: SHOW_AUTH_MODAL,
  payload: {
    message: payload.message || 'Требуется авторизация',
    callback: payload.callback || null
  }
});

export const hideAuthModal = () => ({
  type: HIDE_AUTH_MODAL
});