import { createSelector } from '@reduxjs/toolkit';

const selectAuth = (state) => state.forProfile;

// Базовые селекторы
export const selectUser = createSelector(
  [selectAuth],
  (auth) => auth?.user ?? null
);

export const selectIsAuthenticated = createSelector(
  [selectAuth],
  (auth) => auth?.isAuthenticated ?? false
);

export const selectAuthChecked = createSelector(
  [selectAuth],
  (auth) => auth?.authChecked ?? false
);

export const selectIsLoading = createSelector(
  [selectAuth],
  (auth) => auth?.isLoading ?? false
);

export const selectError = createSelector(
  [selectAuth],
  (auth) => auth?.error ?? null
);

export const selectUserProfile = createSelector(
  [
    selectUser,
    selectIsAuthenticated,
    selectAuthChecked,
    selectIsLoading,
    selectError
  ],
  (user, isAuthenticated, authChecked, isLoading, error) => ({
    user,
    isAuthenticated,
    authChecked,
    isLoading,
    error
  })
);

export const selectAuthError = (state) => state.forProfile.error;
export const selectAuthLoading = (state) => state.forProfile.isLoading;