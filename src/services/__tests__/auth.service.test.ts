import { authService } from '../auth.service';
import { apiClient } from '../api';

jest.mock('../api', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
  normalizeApiResponse: jest.fn((data) => {
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data;
    }
    return data;
  }),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('sends credentials to /auth/login and normalizes response', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-token-xyz',
          user: {
            id: 'u-1',
            nome: 'Carlos Silva',
            email: 'carlos@larvifort.com',
          },
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authService.login({
        email: 'carlos@larvifort.com',
        password: 'password123',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'carlos@larvifort.com',
        senha: 'password123',
        password: 'password123',
      });
      expect(result.token).toBe('jwt-token-xyz');
      expect(result.user.email).toBe('carlos@larvifort.com');
      expect(result.user.nome).toBe('Carlos Silva');
    });

    it('handles access_token key and nested data envelope', async () => {
      const mockResponse = {
        data: {
          data: {
            access_token: 'nested-jwt-token',
            usuario: {
              id: 'u-2',
              nome: 'Ana Lima',
              email: 'ana@larvifort.com',
            },
          },
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authService.login({
        email: 'ana@larvifort.com',
        senha: 'pass',
      });

      expect(result.token).toBe('nested-jwt-token');
      expect(result.user.nome).toBe('Ana Lima');
    });

    it('creates fallback user when user object is omitted from response', async () => {
      const mockResponse = {
        data: {
          token: 'jwt-only-token',
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await authService.login({
        email: 'operador@larvifort.com',
        password: 'secret',
      });

      expect(result.token).toBe('jwt-only-token');
      expect(result.user.email).toBe('operador@larvifort.com');
      expect(result.user.nome).toBe('operador');
    });
  });

  describe('getProfile', () => {
    it('fetches user profile from /auth/me', async () => {
      const mockUser = {
        id: 'u-1',
        nome: 'Carlos Silva',
        email: 'carlos@larvifort.com',
      };
      (apiClient.get as jest.Mock).mockResolvedValueOnce({
        data: mockUser,
      });

      const profile = await authService.getProfile();
      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(profile).toEqual(mockUser);
    });
  });
});
