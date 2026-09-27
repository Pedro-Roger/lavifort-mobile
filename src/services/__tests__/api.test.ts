import { apiClient, normalizeApiResponse } from '../api';
import { secureStorage } from '../../core/storage';

jest.mock('../../core/storage', () => ({
  secureStorage: {
    getAuthToken: jest.fn(),
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
});
