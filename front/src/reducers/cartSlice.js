import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {apiService} from '../services/api';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  lastUpdated: null
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return rejectWithValue('Токен не найден');
    }
    
    try {
      const response = await apiService.cart.get();
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        window.location.reload();
      }
      return rejectWithValue(error.message);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, color, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await apiService.cart.add({ productId, color, quantity });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      if (quantity > product.stock) {
        throw new Error(`Максимальное количество: ${product.stock}`);
      }
      const response = await api.cart.update(itemId, { quantity });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update item');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await api.cart.remove(itemId);
      return itemId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove item');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await api.cart.clear();
      return [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to clear cart');
    }
  }
);

export const checkout = createAsyncThunk(
  'cart/checkout',
  async (items, { rejectWithValue }) => {
    try {
      const response = await api.orders.create({ items });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Ошибка оформления заказа');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCartError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        console.error('Cart fetch error:', action.payload);
      })
      
      .addCase(addToCart.fulfilled, (state, action) => {
        const existingIndex = state.items.findIndex(
          item => item.productId === action.payload.productId && 
                 item.selectedColor === action.payload.selectedColor
        );
        
        if (existingIndex >= 0) {
          state.items[existingIndex].quantity += action.payload.quantity;
        } else {
          state.items.unshift(action.payload);
        }
        state.lastUpdated = Date.now();
      })
      
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index >= 0) {
          state.items[index].quantity = action.payload.quantity;
          state.lastUpdated = Date.now();
        }
      })
      
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item.id !== action.payload);
        state.lastUpdated = Date.now();
      })
      
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.lastUpdated = Date.now();
      })
      
      .addMatcher(
        (action) => action.type.startsWith('cart/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.error = action.payload;
        }
      );
  }
});

export const { resetCartError } = cartSlice.actions;

export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => 
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
export const selectCartItemCount = (state) => 
  state.cart.items.reduce((count, item) => count + item.quantity, 0);

export default cartSlice.reducer;