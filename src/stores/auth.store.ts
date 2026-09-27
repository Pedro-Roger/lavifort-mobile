import { create } from 'zustand';
import { User, LoginCredentials } from '../types';
import { authService } from '../services/auth.service';
import { secureStorage, localStorage } from '../core/storage';
import { STORAGE_KEYS } from '../core/config';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoringSession: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isRestoringSession: true,
  error: null,

  login: async (credentials: LoginCredentials): Promise<boolean> => {
    set({ isLoading: true, error: null });
    try {
      const authData = await authService.login(credentials);
      
      if (!authData.token) {
        throw new Error('Token de autenticação não retornado pelo servidor.');
      }

      await secureStorage.setAuthToken(authData.token);
      await localStorage.setItem(STORAGE_KEYS.AUTH_USER, authData.user);

      set({
        token: authData.token,
        user: authData.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: unknown) {
      let errorMessage = 'Falha ao autenticar. Verifique suas credenciais.';
      if (err && typeof err === 'object') {
        const anyErr = err as { response?: { data?: { message?: string } }; message?: string };
        if (anyErr.response?.data?.message) {
          errorMessage = anyErr.response.data.message;
        } else if (anyErr.message) {
          errorMessage = anyErr.message;
        }
      }
      set({ isLoading: false, error: errorMessage });
      return false;
    }
  },

  restoreSession: async (): Promise<boolean> => {
    set({ isRestoringSession: true, error: null });
    try {
      const token = await secureStorage.getAuthToken();
      const cachedUser = await localStorage.getItem<User>(STORAGE_KEYS.AUTH_USER);

      if (token && cachedUser) {
        set({
          token,
          user: cachedUser,
          isAuthenticated: true,
          isRestoringSession: false,
        });
        return true;
      } else if (token) {
        // Fallback user if token exists but user metadata was cleared
        const fallbackUser: User = {
          id: 'offline-user',
          nome: 'Operador em Campo',
          email: 'offline@larvifort.com',
        };
        set({
          token,
          user: fallbackUser,
          isAuthenticated: true,
          isRestoringSession: false,
        });
        return true;
      }

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isRestoringSession: false,
      });
      return false;
    } catch {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isRestoringSession: false,
      });
      return false;
    }
  },

  logout: async (): Promise<void> => {
    set({ isLoading: true });
    try {
      await secureStorage.removeAuthToken();
      await localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    } finally {
      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
  setUser: (user: User | null) => set({ user }),
}));
