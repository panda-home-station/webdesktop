import { create } from 'zustand';
import { LoggedInUser } from '../types/auth.interface';
import { truenasApi } from '../../truenas/api';
import { createTypedStore, sessionStorage as phsSessionStorage } from '../../desktop/state/persistence';

// Create typed stores for persistent data
const tokenStore = createTypedStore<string | null>('token', null);
const loginBannerDismissedStore = createTypedStore<boolean>('loginBannerDismissed', false);

interface AuthState {
  // User state
  user: LoggedInUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasTwoFactor: boolean;

  // Token state
  token: string | null;

  // Error state
  loginError: string | null;

  // Actions
  setUser: (user: LoggedInUser | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setHasTwoFactor: (hasTwoFactor: boolean) => void;
  setToken: (token: string | null) => void;
  setLoginError: (error: string | null) => void;

  // Methods
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state - load token from persistent storage
  user: null,
  isAuthenticated: false,
  isLoading: false,
  hasTwoFactor: false,
  token: tokenStore.get(),
  loginError: null,

  // Actions
  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasTwoFactor: (hasTwoFactor) => set({ hasTwoFactor }),
  setToken: (token) => {
    set({ token });
    // Persist token
    tokenStore.set(token);
  },
  setLoginError: (error) => set({ loginError: error }),

  // Logout method
  logout: async () => {
    try {
      await truenasApi.call('auth.logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      get().clearAuth();
    }
  },

  // Refresh user method
  refreshUser: async () => {
    try {
      const user = await truenasApi.call('auth.me') as LoggedInUser;
      set({ user });
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  },

  // Clear auth method
  clearAuth: () => {
    set({
      user: null,
      isAuthenticated: false,
      hasTwoFactor: false,
      token: null,
      loginError: null,
    });

    // Clear session and persistent storage
    loginBannerDismissedStore.remove();
    tokenStore.remove();
  },
}));
