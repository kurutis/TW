import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiService } from '../services/api';

const initialState = {
  items: [], 
  status: 'idle',
  error: null,
  authError: false,
  shouldLogout: false,
  lastUpdated: null
};

const checkAuth = (getState) => {
  const state = getState();
  return {
    isAuthenticated: state.auth?.isAuthenticated || false,
    userId: state.auth?.user?.id || null
  };
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
    try {
      // Правильное получение состояния
      const state = getState();
      
      // Исправленная функция checkAuth
      const checkAuth = (state) => {
        return {
          isAuthenticated: state.auth?.isAuthenticated || false,
          userId: state.auth?.user?.id || null
        };
      };
      
      const { isAuthenticated, userId } = checkAuth(state);
      
      if (!isAuthenticated || !userId) {
        // Возвращаем текущую корзину вместо пустого массива
        return state.cart?.items || []; 
      }
      
      // Логика загрузки только при необходимости
      if (state.cart.status === 'succeeded' && state.cart.items?.length > 0) {
        return state.cart.items;
      }
      
      const response = await apiService.cart.get();
      
      // Проверка ответа сервера
      if (!response.data) {
        console.error('Сервер вернул пустые данные корзины');
        return state.cart?.items || [];
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Ошибка загрузки корзины:', error);
      // Возвращаем текущее состояние корзины при ошибке
      return rejectWithValue({
        ...getErrorPayload(error),
        currentItems: getState().cart?.items || []
      });
    }
  }
);

// Thunk для добавления в корзину
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, color, quantity }, { rejectWithValue }) => {
    try {
      const response = await apiService.cart.add({
        productId: Number(productId),
        color,
        quantity: Number(quantity)
      });
      
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
      return [];
    } catch (error) {
      return rejectWithValue(getErrorPayload(error));
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    resetCart: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
      state.lastUpdated = Date.now();
    },
    setAuthError: (state, action) => {
      state.authError = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработка fetchCart
      .addCase(fetchCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
        if (action.payload.status === 401) {
          state.authError = true;
          state.shouldLogout = action.payload.shouldLogout;
        }
      })

      // Обработка addToCart (единственный обработчик для этого действия)
      .addCase(addToCart.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        
        // Если сервер возвращает обновленный список
        if (Array.isArray(action.payload)) {
          state.items = action.payload;
        } 
        // Если сервер возвращает только добавленный товар
        else {
          const existingIndex = state.items.findIndex(item => 
            item.productId === action.payload.productId && 
            item.selectedColor === action.payload.selectedColor
          );
          
          if (existingIndex >= 0) {
            state.items[existingIndex].quantity += action.payload.quantity;
          } else {
            state.items.push(action.payload);
          }
        }
        
        state.lastUpdated = Date.now();
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Обработка updateCartItem (исправленный - без дублирования addToCart.fulfilled)
      .addCase(updateCartItem.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {  // Исправлено на updateCartItem.fulfilled
        state.status = 'succeeded';
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.lastUpdated = Date.now();
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })

      // Остальные обработчики остаются без изменений
      .addCase(removeFromCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = state.items.filter(item => item.id !== action.payload);
        state.lastUpdated = Date.now();
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      })
      .addCase(clearCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        if (action.payload?.force !== true) {
          console.warn('Предотвращена попытка очистки корзины без флага force');
          return;
        }
        state.status = 'succeeded';
        state.items = [];
        state.lastUpdated = Date.now();
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload.message;
      });
  }
});

export const { resetCart, setAuthError } = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items; 
export const selectCartStatus = (state) => state.cart?.status || 'idle';
export const selectCartError = (state) => state.cart?.error || null;
export const selectCartTotal = (state) => {
  const items = state.cart?.items || [];
  return items.reduce((total, item) => {
    return total + ((item?.price || 0) * (item?.quantity || 0));
  }, 0);
};

export default cartSlice.reducer;