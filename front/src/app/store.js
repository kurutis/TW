import { configureStore } from "@reduxjs/toolkit";
import citiesReducer from '../reducers/cities';
import forprofileReducer from "../reducers/forprofile";
import reviewReducer from "../reducers/review";
import productReducer from '../reducers/products';
import cartReducer from '../reducers/cartSlice';
import { authMiddleware } from '../actions/authMiddleware';
import { callbackMiddleware } from '../actions/callbackMiddleware'; // Новый middleware

export default configureStore({
  reducer: {
    cities: citiesReducer,
    forProfile: forprofileReducer,
    reviews: reviewReducer,
    products: productReducer,
    cart: cartReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['SHOW_AUTH_MODAL'],
        ignoredPaths: ['payload.callback']
      }
    }).concat(
      authMiddleware,
      callbackMiddleware
    )
});