import { apiService } from '../services/api';

export const fetchProducts = (categoryId = null) => async (dispatch) => {
  dispatch({ type: 'FETCH_PRODUCTS_REQUEST' });
  
  try {
    const params = categoryId ? { categoryId } : {};
    console.log('Making API request with params:', params);
    
    const response = await apiService.products.getAll(params);
    console.log('API response:', response);
    
    const products = response.data || response;
    
    if (!products) {
      throw new Error('Empty response from server');
    }
    
    dispatch({
      type: 'FETCH_PRODUCTS_SUCCESS',
      payload: Array.isArray(products) ? products : [products]
    });
  } catch (error) {
    console.error('API error:', error);
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