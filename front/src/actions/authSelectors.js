import { createSelector } from '@reduxjs/toolkit';

const selectAuth = (state) => state.forProfile;

// Базовые селекторы
export const selectUser = (state) => state.forProfile.user;
export const selectIsAuthenticated = (state) => state.forProfile.isAuthenticated;
export const selectAuthChecked = (state) => state.forProfile.authChecked;

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
export const selectUserId = (state) => state.forProfile.user?.id;