import { configureStore } from "@reduxjs/toolkit";
import citiesReducer from '../reducers/cities';
import forprofileReducer from "../reducers/forprofile";
import reviewReducer from "../reducers/review"; 
import productReducer from '../reducers/products';
import cartReducer from '../reducers/cartSlice';

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
      serializableCheck: false
    })
});