import {
  FETCH_PRODUCTS_REQUEST,
  FETCH_PRODUCTS_SUCCESS,
  FETCH_PRODUCTS_FAILURE,
  FETCH_CATEGORIES_SUCCESS,
  SET_SELECTED_CATEGORY
} from '../constants/actionTypes';

const initialState = {
  products: [],
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null
};

const productReducer = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PRODUCTS_REQUEST:
      return { ...state, loading: true, error: null };
      
    case FETCH_PRODUCTS_SUCCESS:
      return { 
        ...state, 
        loading: false, 
        products: action.payload,
        error: null 
      };
      
    case FETCH_PRODUCTS_FAILURE:
      return { 
        ...state, 
        loading: false, 
        error: action.payload 
      };
      
    case FETCH_CATEGORIES_SUCCESS:
      return {
        ...state,
        categories: action.payload
      };
      
    case SET_SELECTED_CATEGORY:
      return {
        ...state,
        selectedCategory: action.payload
      };
      
    default:
      return state;
  }
};

export default productReducer;