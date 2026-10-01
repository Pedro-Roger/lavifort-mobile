import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ENV } from '../core/config';
import { secureStorage } from '../core/storage';

export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await secureStorage.getAuthToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // In offline mode or storage error, continue request without crashing
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Renovação de access token (JWT_EXPIRES_IN curto no backend — 15m).
 *
 * Em 401 (fora das rotas de auth), tenta `POST /auth/refresh` com o
 * refresh token salvo no SecureStore, salva os novos tokens e refaz a
 * request original. Uso single-flight: requests concorrentes compartilham
 * a mesma promessa de refresh. Se o refresh falhar, limpa as credenciais
 * (o próximo app-open cai no login) e rejeita com mensagem clara.
 */
let refreshPromise: Promise<string | null> | null = null;

export async function tryRefreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) return null;

        // axios direto: sem interceptors (evita recursão em 401).
        const response = await axios.post<{
          accessToken?: string;
          refreshToken?: string;
        }>(
          `${ENV.API_BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: ENV.API_TIMEOUT_MS,
          }
        );

        const newAccess = response.data?.accessToken;
        const newRefresh = response.data?.refreshToken;
        if (!newAccess) return null;

        await secureStorage.setAuthToken(newAccess);
        if (newRefresh) {
          await secureStorage.setRefreshToken(newRefresh);
        }
        return newAccess;
      } catch {
        // Refresh inválido/expirado: sessão acabou de verdade.
        await secureStorage.removeAuthToken();
        await secureStorage.removeRefreshToken();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = config?.url ?? '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && config && !config._retry && !isAuthRoute) {
      config._retry = true;
      const newToken = await tryRefreshAccessToken();
      if (newToken && config.headers) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(config);
      }
      if (!newToken) {
        return Promise.reject(
          new Error('Sessão expirada. Faça login novamente para continuar.')
        );
      }
    }

    return Promise.reject(error);
  }
);

export function normalizeApiResponse<T>(responseData: unknown): T {
  if (
    responseData &&
    typeof responseData === 'object' &&
    'data' in responseData &&
    (responseData as { data: unknown }).data !== undefined
  ) {
    return (responseData as { data: T }).data;
  }
  return responseData as T;
}
