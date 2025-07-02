const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  authChecked: false
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case 'AUTH_CHECK_START':
    case 'LOGIN_REQUEST':
    case 'REGISTER_REQUEST':
      return { 
        ...state, 
        isLoading: true, 
        error: null 
      };

    case 'SET_AUTH_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
    case 'AUTH_CHECK_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        isLoading: false,
        authChecked: true,
        error: null
      };

    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        authChecked: true
      };

    case 'AUTH_CHECK_FAILURE':
      return {
        ...state,
        isLoading: false,
        authChecked: true,
        error: action.payload
      };

    case 'LOGOUT_SUCCESS':
      return {
        ...initialState,
        authChecked: true
      };

    case 'CLEAR_AUTH_ERROR':
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
}