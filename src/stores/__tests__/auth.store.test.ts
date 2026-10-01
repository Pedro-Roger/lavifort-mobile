import { useAuthStore } from '../auth.store';
import { authService } from '../../services/auth.service';
import { secureStorage, localStorage } from '../../core/storage';
import { STORAGE_KEYS } from '../../core/config';

jest.mock('../../services/auth.service', () => ({
  authService: {
    login: jest.fn(),
    getProfile: jest.fn(),
  },
}));

jest.mock('../../core/storage', () => ({
  secureStorage: {
    getAuthToken: jest.fn(),
    setAuthToken: jest.fn(),
    removeAuthToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setRefreshToken: jest.fn(),
    removeRefreshToken: jest.fn(),
  },
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('AuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isRestoringSession: false,
      error: null,
    });
  });

  describe('login', () => {
    it('successfully logs in, persists tokens, and updates state', async () => {
      const mockUser = {
        id: 'u-100',
        nome: 'Operador Teste',
        email: 'teste@larvifort.com',
      };
      (authService.login as jest.Mock).mockResolvedValueOnce({
        token: 'auth-jwt-token',
        user: mockUser,
      });

      const result = await useAuthStore.getState().login({
        email: 'teste@larvifort.com',
        password: 'password123',
      });

      expect(result).toBe(true);
      expect(secureStorage.setAuthToken).toHaveBeenCalledWith('auth-jwt-token');
      expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_USER, mockUser);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('auth-jwt-token');
      expect(state.user).toEqual(mockUser);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('handles login failure and sets error message', async () => {
      (authService.login as jest.Mock).mockRejectedValueOnce({
        response: {
          data: {
            message: 'Credenciais inválidas.',
          },
        },
      });

      const result = await useAuthStore.getState().login({
        email: 'wrong@larvifort.com',
        password: 'wrong',
      });

      expect(result).toBe(false);
      expect(secureStorage.setAuthToken).not.toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Credenciais inválidas.');
    });

    it('handles empty token response as failure', async () => {
      (authService.login as jest.Mock).mockResolvedValueOnce({
        token: '',
        user: { id: '1', nome: 'A', email: 'a@b.com' },
      });

      const result = await useAuthStore.getState().login({
        email: 'a@b.com',
        password: 'p',
      });

      expect(result).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('restoreSession (Offline-First)', () => {
    it('restores cached session when token and user are in local storage', async () => {
      const cachedUser = {
        id: 'u-offline',
        nome: 'Técnico Campo',
        email: 'tecnico@larvifort.com',
      };
      (secureStorage.getAuthToken as jest.Mock).mockResolvedValueOnce('persisted-token-123');
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(cachedUser);

      const restored = await useAuthStore.getState().restoreSession();

      expect(restored).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('persisted-token-123');
      expect(state.user).toEqual(cachedUser);
      expect(state.isRestoringSession).toBe(false);
    });

    it('restores fallback session if only token is persisted', async () => {
      (secureStorage.getAuthToken as jest.Mock).mockResolvedValueOnce('persisted-token-456');
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const restored = await useAuthStore.getState().restoreSession();

      expect(restored).toBe(true);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('persisted-token-456');
      expect(state.user?.id).toBe('offline-user');
      expect(state.isRestoringSession).toBe(false);
    });

    it('sets unauthenticated state if no token exists', async () => {
      (secureStorage.getAuthToken as jest.Mock).mockResolvedValueOnce(null);
      (localStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const restored = await useAuthStore.getState().restoreSession();

      expect(restored).toBe(false);
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isRestoringSession).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears credentials from secureStorage and localStorage and resets state', async () => {
      useAuthStore.setState({
        token: 'active-token',
        user: { id: 'u-1', nome: 'User', email: 'user@test.com' },
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      expect(secureStorage.removeAuthToken).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_USER);

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('helpers', () => {
    it('clears error', () => {
      useAuthStore.setState({ error: 'Erro teste' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('sets user', () => {
      const newUser = { id: 'u-new', nome: 'Novo', email: 'novo@test.com' };
      useAuthStore.getState().setUser(newUser);
      expect(useAuthStore.getState().user).toEqual(newUser);
    });
  });
});
