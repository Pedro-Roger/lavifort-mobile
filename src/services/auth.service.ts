import { apiClient, normalizeApiResponse } from './api';
import { AuthResponse, LoginCredentials, User } from '../types';

interface RawBackendAuthResponse {
  token?: string;
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
  user?: User;
  usuario?: User;
  data?: RawBackendAuthResponse;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const payload = {
      email: credentials.email,
      senha: credentials.senha || credentials.password,
      password: credentials.password || credentials.senha,
    };

    const response = await apiClient.post<RawBackendAuthResponse>('/auth/login', payload);
    const normalized = normalizeApiResponse<RawBackendAuthResponse>(response.data);

    const token =
      normalized.token ||
      normalized.accessToken ||
      normalized.access_token ||
      '';

    // O backend rotaciona o refresh token em cada login/refresh
    // (POST /auth/refresh). Sem ele, o app não consegue renovar o
    // access token de curta duração (JWT_EXPIRES_IN=15m no backend).
    const refreshToken =
      normalized.refreshToken ||
      normalized.refresh_token ||
      undefined;

    const rawUser = normalized.user || normalized.usuario;
    const user: User = rawUser || {
      id: 'usr_' + Date.now(),
      nome: credentials.email.split('@')[0],
      email: credentials.email,
    };

    return {
      token,
      user,
      refreshToken,
    };
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get<User | { data: User }>('/auth/me');
    return normalizeApiResponse<User>(response.data);
  },
};
