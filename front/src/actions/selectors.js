import { createSelector } from '@reduxjs/toolkit';

const selectAuthState = (state) => state.auth;

export const selectAuthError = createSelector(
  [selectAuthState],
  (auth) => auth?.error
);

export const selectAuthLoading = createSelector(
  [selectAuthState],
  (auth) => auth?.isLoading || false
);