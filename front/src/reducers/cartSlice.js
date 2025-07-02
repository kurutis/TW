import { createAsyncThunk, createSlice, isRejected, isPending, isFulfilled } from '@reduxjs/toolkit';
import { apiService } from '../services/api';

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  isLoading: false,
  authError: false,
  shouldLogout: false
};

// Вспомогательная функция для обработки ошибок
const getErrorPayload = (error) => {
  const status = error.response?.status;
  return {
    message: error.response?.data?.error || error.message || 'Произошла неизвестная ошибка',
    status,
    shouldLogout: status === 401
  };
};

// Thunk для получения корзины
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState();
    
    if (!auth?.isAuthenticated) {
      return rejectWithValue({
        message: 'Требуется авторизация',
        status: 401,
        shouldLogout: false
      });
    }

    try {
      const response = await apiService.cart.get();
      return response.data;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
        shouldLogout: error.response?.status === 401
      });
    }
  }
);

// Thunk для добавления в корзину
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, color, quantity }, { getState, rejectWithValue }) => {
    const { auth } = getState();
    
    // Синхронная проверка авторизации
    if (!auth?.isAuthenticated) {
      return rejectWithValue({
        message: 'Требуется авторизация',
        status: 401,
        shouldLogout: false // Не разлогинивать, просто показать модалку
      });
    }

    try {
      const response = await apiService.cart.add({ productId, color, quantity });
      return response.data;
    } catch (error) {
      // Ошибка API
      return rejectWithValue({
        message: error.response?.data?.error || error.message,
        status: error.response?.status,
        shouldLogout: error.response?.status === 401
      });
    }
  }
);

// Thunk для обновления количества товара
export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, quantity }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const item = state.cart.items.find(item => item.id === itemId);
      
      if (!item) {
        throw new Error('Товар не найден в корзине');
      }

      if (quantity <= 0) {
        throw new Error('Количество должно быть больше 0');
      }

      if (quantity > item.stock) {
        throw new Error(`Максимальное количество: ${item.stock}`);
      }

      const response = await apiService.cart.update(itemId, { quantity });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

// Thunk для удаления товара из корзины
export const removeFromCart = createAsyncThunk(
  'cart/removeItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await apiService.cart.remove(itemId);
      return itemId;
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

// Thunk для очистки корзины
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.cart.clear();
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

// Thunk для оформления заказа
export const checkout = createAsyncThunk(
  'cart/checkout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { cart } = getState();
      await apiService.orders.create({ items: cart.items });
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setError: (state, action) => {
      state.error = action.payload;
    },
    resetError: (state) => {
      state.error = null;
      state.authError = false;
    },
    resetCart: () => initialState,
    incrementItem: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) item.quantity += 1;
    },
    decrementItem: (state, action) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item && item.quantity > 1) item.quantity -= 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        const existingIndex = state.items.findIndex(
          item => item.productId === action.payload.productId && 
                item.selectedColor === action.payload.selectedColor
        );
        
        if (existingIndex >= 0) {
          state.items[existingIndex].quantity += action.payload.quantity;
        } else {
          state.items.push({
            ...action.payload,
            images: action.payload.images || ['/placeholder.jpg'],
            stock: action.payload.stock || 10
          });
        }
        state.lastUpdated = Date.now();
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index >= 0) {
          state.items[index] = action.payload;
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
      .addCase(checkout.fulfilled, (state) => {
        state.items = [];
        state.lastUpdated = Date.now();
      })
      .addMatcher(isPending, (state) => {
        state.status = 'loading';
        state.isLoading = true;
        state.error = null;
      })
      .addMatcher(isFulfilled, (state) => {
        state.status = 'succeeded';
        state.isLoading = false;
      })
      .addMatcher(
        isRejected,
        (state, action) => {
          state.status = 'failed';
          state.isLoading = false;
          
          if (action.payload) {
            state.error = action.payload.message;
            
            if (action.payload.status === 401) {
              state.authError = true;
              state.shouldLogout = action.payload.shouldLogout;
            }
          }
        }
      );
}
});

export const { 
  setError, 
  resetError, 
  resetCart,
  incrementItem,
  decrementItem 
} = cartSlice.actions;

export default cartSlice.reducer;