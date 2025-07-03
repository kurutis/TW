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

export const addReview = createAsyncThunk(
  'reviews/addReview',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiService.reviews.create(formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await apiService.reviews.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);