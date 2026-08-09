import type { ApiResponse } from '@ridezo/types';
import { apiClient } from '@/shared/api/client';

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function getData<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await apiClient.get<ApiResponse<T>>(path, { params });
  if (!data.data) throw new Error(data.message || 'Request failed');
  return data.data;
}

async function postData<T>(path: string, body: unknown): Promise<T> {
  const { data } = await apiClient.post<ApiResponse<T>>(path, body);
  if (!data.data) throw new Error(data.message || 'Request failed');
  return data.data;
}

async function patchData<T>(path: string, body: unknown): Promise<T> {
  const { data } = await apiClient.patch<ApiResponse<T>>(path, body);
  if (!data.data) throw new Error(data.message || 'Request failed');
  return data.data;
}

async function deleteData<T>(path: string): Promise<T> {
  const { data } = await apiClient.delete<ApiResponse<T>>(path);
  if (!data.data) throw new Error(data.message || 'Request failed');
  return data.data;
}

export interface ServiceAreaRow {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  isActive: boolean;
}

export interface AdminDriverRow {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  verificationStatus: string;
  status: string;
  rating: number;
  totalTrips: number;
  totalEarnings: number;
  joinedAt: string;
}

export interface AdminCouponRow {
  id: string;
  code: string;
  title: string;
  type: string;
  value: number;
  usageCount: number;
  usageLimit?: number;
  status: string;
  startsAt: string;
  endsAt: string;
}

export interface AdminCmsRow {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  authorName?: string;
  updatedAt: string;
}

export interface AdminNotificationRow {
  id: string;
  title: string;
  body: string;
  audience: string;
  channel: string;
  status: string;
  sentAt: string;
}

export interface Greetings {
  user: string;
  driver: string;
}

export const adminApi = {
  listLocations: () => getData<Paginated<ServiceAreaRow>>('/admin/locations'),
  createLocation: (body: Omit<ServiceAreaRow, 'id'>) =>
    postData<ServiceAreaRow>('/admin/locations', body),
  updateLocation: (id: string, body: Partial<ServiceAreaRow>) =>
    patchData<ServiceAreaRow>(`/admin/locations/${id}`, body),
  deleteLocation: (id: string) => deleteData<{ deleted: boolean }>(`/admin/locations/${id}`),

  listDrivers: () => getData<Paginated<AdminDriverRow>>('/admin/drivers'),
  updateDriverVerification: (id: string, status: 'approved' | 'rejected' | 'under_review' | 'pending') =>
    patchData(`/admin/drivers/${id}/verification`, { status }),

  listCoupons: () => getData<Paginated<AdminCouponRow>>('/admin/coupons'),
  createCoupon: (body: Record<string, unknown>) => postData<AdminCouponRow>('/admin/coupons', body),

  listCms: () => getData<Paginated<AdminCmsRow>>('/admin/cms'),
  createCms: (body: Record<string, unknown>) => postData<AdminCmsRow>('/admin/cms', body),
  updateCms: (id: string, body: Record<string, unknown>) =>
    patchData<AdminCmsRow>(`/admin/cms/${id}`, body),
  deleteCms: (id: string) => deleteData<{ deleted: boolean }>(`/admin/cms/${id}`),

  listNotifications: () => getData<Paginated<AdminNotificationRow>>('/admin/notifications'),
  sendNotification: (body: {
    title: string;
    body: string;
    audience: 'customers' | 'drivers' | 'all_users';
    channels?: string[];
  }) => postData('/admin/notifications/send', body),

  getGreetings: () => getData<Greetings>('/admin/settings/greetings'),
  updateGreetings: (body: Partial<Greetings>) =>
    patchData<Greetings>('/admin/settings/greetings', body),
};
