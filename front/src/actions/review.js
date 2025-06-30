// reviewActions.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { apiService } from '../services/api';

export const fetchReviews = createAsyncThunk(
  'reviews/fetchReviews',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.reviews.getAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const addReview = (reviewData) => async (dispatch) => {
  try {
    const response = await apiService.reviews.create(reviewData);
    dispatch({ type: 'ADD_REVIEW_SUCCESS', payload: response.data });
    return response.data;
  } catch (error) {
    dispatch({ type: 'ADD_REVIEW_ERROR', payload: error.message });
    throw error;
  }
};