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

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
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
