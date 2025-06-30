import { apiService } from '../services/api';

export const fetchProducts = (categoryId = null) => async (dispatch) => {
  dispatch({ type: 'FETCH_PRODUCTS_REQUEST' });
  
  try {
    const response = await apiService.products.getAll(categoryId ? { categoryId } : {});
    
    dispatch({
      type: 'FETCH_PRODUCTS_SUCCESS',
      payload: response
    });
  } catch (error) {
    dispatch({
      type: 'FETCH_PRODUCTS_FAILURE',
      payload: error.message
    });
  }
};

export const fetchCategories = () => async (dispatch) => {
  try {
    const response = await apiService.categories.getAll();
    
    dispatch({
      type: 'FETCH_CATEGORIES_SUCCESS',
      payload: response
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
};

export const setSelectedCategory = (categoryId) => ({
  type: 'SET_SELECTED_CATEGORY',
  payload: categoryId
});