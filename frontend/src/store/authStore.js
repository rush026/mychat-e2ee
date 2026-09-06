import { create } from 'zustand';
import { authService } from '../services/auth.service';

/**
 * Authentication store (Zustand).
 * Manages user session state, access token, and auth actions.
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // True initially while checking session
  error: null,

  /**
   * Set access token (used by axios interceptor on refresh).
   */
  setAccessToken: (token) => set({ accessToken: token }),

  /**
   * Register a new user.
   */
  register: async ({ username, email, password, displayName }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authService.register({ username, email, password, displayName });
      set({
        user: data.data.user,
        accessToken: data.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  /**
   * Login with email/username + password.
   */
  login: async ({ identifier, password }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authService.login({ identifier, password });
      set({
        user: data.data.user,
        accessToken: data.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  /**
   * Logout — clear state and revoke refresh token.
   */
  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors — we're logging out anyway
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  /**
   * Check current session (on app load).
   * Attempts to refresh the access token using the HttpOnly cookie.
   */
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authService.refresh();
      set({
        user: data.data.user,
        accessToken: data.data.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  /**
   * Update user in store (after profile changes).
   */
  setUser: (user) => set({ user }),

  /**
   * Clear error.
   */
  clearError: () => set({ error: null }),
}));
