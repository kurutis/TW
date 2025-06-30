import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiService } from '../services/api';

// Асинхронные действия
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
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await apiService.reviews.create(reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  items: [],
  loading: 'idle',
  error: null,
  lastAdded: null,
  addStatus: 'idle'
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    resetReviewError: (state) => {
      state.error = null;
    },
    resetAddStatus: (state) => {
      state.addStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload;
      })
      .addCase(addReview.pending, (state) => {
        state.addStatus = 'pending';
        state.error = null;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.addStatus = 'succeeded';
        state.items.unshift(action.payload);
        state.lastAdded = action.payload;
      })
      .addCase(addReview.rejected, (state, action) => {
        state.addStatus = 'failed';
        state.error = action.payload;
      });
  }
});

// Селекторы
export const selectAllReviews = (state) => state.reviews.items;
export const selectReviewStatus = (state) => state.reviews.loading;
export const selectReviewError = (state) => state.reviews.error;
export const selectLastAddedReview = (state) => state.reviews.lastAdded;
export const selectAddReviewStatus = (state) => state.reviews.addStatus;
export const selectUserReview = (state, userId) => 
  state.reviews.items.find(review => review.user_id === userId);

// Actions
export const { resetReviewError, resetAddStatus } = reviewSlice.actions;

// Reducer
export default reviewSlice.reducer;