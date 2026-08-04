import type { AdminAuthResponse, ApiResponse } from '@ridezo/types';
import axios from 'axios';
import { apiClient } from '@/shared/api/client';

export async function adminLogin(input: {
  email: string;
  password: string;
}): Promise<AdminAuthResponse> {
  try {
    const { data } = await apiClient.post<ApiResponse<AdminAuthResponse>>('/admin/auth/login', input);
    if (!data.data) throw new Error(data.message || 'Login failed');
    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message;
      if (typeof message === 'string') throw new Error(message);
    }
    throw error instanceof Error ? error : new Error('Login failed');
  }
}
