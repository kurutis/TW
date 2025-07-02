const initialState = {
  authModal: {
    visible: false,
    message: '',
    callback: null
  }
};

export default function modalReducer(state = initialState, action) {
  switch (action.type) {
    case 'SHOW_AUTH_MODAL':
      return {
        ...state,
        authModal: {
          visible: true,
          message: action.payload.message,
          callback: action.payload.callback
        }
      };
    case 'HIDE_AUTH_MODAL':
      return {
        ...state,
        authModal: initialState.authModal
      };
    default:
      return state;
  }
}