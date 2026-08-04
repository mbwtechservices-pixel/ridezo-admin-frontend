import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AdminAuthResponse, ApiResponse } from '@ridezo/types';
import { useAuthStore } from '@/shared/store/auth.store';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.PROD
    ? 'https://ridezo-backend.onrender.com/api/v1'
    : 'http://localhost:4000/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function refreshAdminTokens(refreshToken: string): Promise<AdminAuthResponse> {
  const { data } = await axios.post<ApiResponse<AdminAuthResponse>>(
    `${API_BASE_URL}/admin/auth/refresh`,
    { refreshToken },
  );
  if (!data.data) throw new Error('Session refresh failed');
  return data.data;
}

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && original && !original._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && refreshToken !== 'demo-admin-token') {
        original._retry = true;
        try {
          const result = await refreshAdminTokens(refreshToken);
          const { user, setAuth } = useAuthStore.getState();
          if (user) {
            setAuth(user, result.tokens.accessToken, result.tokens.refreshToken);
          } else {
            localStorage.setItem('accessToken', result.tokens.accessToken);
            localStorage.setItem('refreshToken', result.tokens.refreshToken);
          }
          if (original.headers) {
            original.headers.Authorization = `Bearer ${result.tokens.accessToken}`;
          }
          return apiClient(original);
        } catch {
          // fall through to clear auth
        }
      }

      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);
