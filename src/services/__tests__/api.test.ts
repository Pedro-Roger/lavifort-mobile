import axios from 'axios';
import { apiClient, normalizeApiResponse, tryRefreshAccessToken } from '../api';
import { secureStorage } from '../../core/storage';
import { ENV } from '../../core/config';

jest.mock('../../core/storage', () => ({
  secureStorage: {
    getAuthToken: jest.fn(),
    setAuthToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setRefreshToken: jest.fn(),
    removeAuthToken: jest.fn(),
    removeRefreshToken: jest.fn(),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizeApiResponse', () => {
    it('unwraps data envelope when response contains data property', () => {
      const response = { data: [{ id: '1', titulo: 'Tarefa 1' }] };
      const normalized = normalizeApiResponse(response);
      expect(normalized).toEqual([{ id: '1', titulo: 'Tarefa 1' }]);
    });

    it('returns raw data when no data envelope exists', () => {
      const response = [{ id: '1', titulo: 'Tarefa 1' }];
      const normalized = normalizeApiResponse(response);
      expect(normalized).toEqual([{ id: '1', titulo: 'Tarefa 1' }]);
    });
  });

  describe('apiClient request interceptor', () => {
    it('adds Authorization header when token is present', async () => {
      (secureStorage.getAuthToken as jest.Mock).mockResolvedValueOnce('mocked-jwt');

      // Execute request interceptor handler directly
      const requestHandler =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (apiClient.interceptors.request as any).handlers[0].fulfilled;

      const config = { headers: {} };
      const resultConfig = await requestHandler(config);

      expect(resultConfig.headers.Authorization).toBe('Bearer mocked-jwt');
    });

    it('does not set Authorization header when token is null', async () => {
      (secureStorage.getAuthToken as jest.Mock).mockResolvedValueOnce(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const requestHandler = (apiClient.interceptors.request as any).handlers[0].fulfilled;
      const config = { headers: {} };
      const resultConfig = await requestHandler(config);

      expect(resultConfig.headers.Authorization).toBeUndefined();
    });
  });

  describe('401 → refresh → retry (sessão expirada em campo)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rejectedHandler = () => (apiClient.interceptors.response as any).handlers[0].rejected;

    function make401(url: string): unknown {
      return {
        response: { status: 401 },
        config: { url, headers: {} },
        request: {},
      };
    }

    it('renews the access token via POST /auth/refresh and retries the original request', async () => {
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('rt-old');
      const postSpy = jest
        .spyOn(axios, 'post')
        .mockResolvedValueOnce({
          data: { accessToken: 'access-new', refreshToken: 'rt-new' },
        });
      const requestSpy = jest
        .spyOn(apiClient, 'request')
        .mockResolvedValueOnce({ data: 'ok' });

      const handler = rejectedHandler();
      const result = await handler(make401('/tasks/t-1/confirm-activity'));

      expect(postSpy).toHaveBeenCalledWith(
        `${ENV.API_BASE_URL}/auth/refresh`,
        { refreshToken: 'rt-old' },
        expect.anything()
      );
      expect(secureStorage.setAuthToken).toHaveBeenCalledWith('access-new');
      expect(secureStorage.setRefreshToken).toHaveBeenCalledWith('rt-new');
      expect(result.data).toBe('ok');
      // A request refeita carrega o novo Bearer token.
      const retryConfig = requestSpy.mock.calls[0][0] as {
        headers: { Authorization?: string };
        _retry?: boolean;
      };
      expect(retryConfig.headers.Authorization).toBe('Bearer access-new');
      expect(retryConfig._retry).toBe(true);
    });

    it('clears credentials and rejects with a clear message when refresh fails', async () => {
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('rt-dead');
      jest.spyOn(axios, 'post').mockRejectedValueOnce(new Error('401 invalid'));

      const handler = rejectedHandler();
      await expect(
        handler(make401('/tasks/t-1/confirm-activity'))
      ).rejects.toThrow('Sessão expirada');

      expect(secureStorage.removeAuthToken).toHaveBeenCalled();
      expect(secureStorage.removeRefreshToken).toHaveBeenCalled();
    });

    it('does not attempt refresh on auth routes (login/refresh)', async () => {
      const postSpy = jest.spyOn(axios, 'post');

      const handler = rejectedHandler();
      await expect(handler(make401('/auth/login'))).rejects.toBeDefined();
      expect(postSpy).not.toHaveBeenCalled();
      expect(secureStorage.setAuthToken).not.toHaveBeenCalled();
    });

    it('passes through non-401 errors without refreshing', async () => {
      const postSpy = jest.spyOn(axios, 'post');

      const handler = rejectedHandler();
      const error409 = {
        response: { status: 409 },
        config: { url: '/tasks/t-1/confirm-activity', headers: {} },
      };
      await expect(handler(error409)).rejects.toBe(error409);
      expect(postSpy).not.toHaveBeenCalled();
    });
  });

  describe('tryRefreshAccessToken (single-flight)', () => {
    it('returns null when there is no refresh token stored', async () => {
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);
      const result = await tryRefreshAccessToken();
      expect(result).toBeNull();
      expect(jest.spyOn(axios, 'post')).not.toHaveBeenCalled();
    });

    it('stores the rotated tokens and returns the new access token', async () => {
      (secureStorage.getRefreshToken as jest.Mock).mockResolvedValue('rt-1');
      jest.spyOn(axios, 'post').mockResolvedValueOnce({
        data: { accessToken: 'a2', refreshToken: 'r2' },
      });

      const result = await tryRefreshAccessToken();
      expect(result).toBe('a2');
      expect(secureStorage.setAuthToken).toHaveBeenCalledWith('a2');
      expect(secureStorage.setRefreshToken).toHaveBeenCalledWith('r2');
    });
  });
});