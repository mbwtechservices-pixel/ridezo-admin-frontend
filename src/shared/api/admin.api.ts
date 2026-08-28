import type { ApiResponse } from '@ridezo/types';
import axios from 'axios';
import { apiClient } from '@/shared/api/client';

function toApiError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { message?: string } | undefined;
    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return new Error(payload.message);
    }
    if (!error.response && (error.message === 'Network Error' || error.code === 'ERR_NETWORK')) {
      return new Error('Cannot reach the Ridezo API. Make sure the backend is running.');
    }
    return new Error(fallback);
  }
  return error instanceof Error ? error : new Error(fallback);
}

interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function getData<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const { data } = await apiClient.get<ApiResponse<T>>(path, { params });
    if (!data.data) throw new Error(data.message || 'Request failed');
    return data.data;
  } catch (error) {
    throw toApiError(error, 'Request failed');
  }
}

async function postData<T>(path: string, body: unknown): Promise<T> {
  try {
    const { data } = await apiClient.post<ApiResponse<T>>(path, body);
    if (!data.data) throw new Error(data.message || 'Request failed');
    return data.data;
  } catch (error) {
    throw toApiError(error, 'Request failed');
  }
}

async function patchData<T>(path: string, body: unknown): Promise<T> {
  try {
    const { data } = await apiClient.patch<ApiResponse<T>>(path, body);
    if (!data.data) throw new Error(data.message || 'Request failed');
    return data.data;
  } catch (error) {
    throw toApiError(error, 'Request failed');
  }
}

async function deleteData<T>(path: string): Promise<T> {
  try {
    const { data } = await apiClient.delete<ApiResponse<T>>(path);
    if (!data.data) throw new Error(data.message || 'Request failed');
    return data.data;
  } catch (error) {
    throw toApiError(error, 'Request failed');
  }
}

export interface ServiceAreaRow {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  isActive: boolean;
}

export interface RecommendedPlaceRow {
  id: string;
  pincode: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  sortOrder: number;
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

export interface AdminRingtoneRow {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  fileSizeBytes: number;
  isActive: boolean;
  createdAt: string;
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

export interface AppAvailability {
  unavailable: boolean;
  message: string;
}

export interface ReferralCommissions {
  userToUser: number;
  userToDriver: number;
  driverToAny: number;
}

export interface AdsBannersSetting {
  enabled: boolean;
}

export interface AdminAdBannerRow {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  mimeType: string;
  fileSizeBytes: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const adminApi = {
  listLocations: () =>
    getData<Paginated<ServiceAreaRow>>('/admin/locations', {
      limit: 100,
      sortBy: 'pincode',
      sortOrder: 'asc',
    }),
  createLocation: (body: Omit<ServiceAreaRow, 'id'>) =>
    postData<ServiceAreaRow>('/admin/locations', body),
  updateLocation: (id: string, body: Partial<ServiceAreaRow>) =>
    patchData<ServiceAreaRow>(`/admin/locations/${id}`, body),
  deleteLocation: (id: string) => deleteData<{ deleted: boolean }>(`/admin/locations/${id}`),

  listRecommendedPlaces: (params?: { pincode?: string }) =>
    getData<Paginated<RecommendedPlaceRow>>('/admin/recommended-places', {
      limit: 200,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
      ...params,
    }),
  createRecommendedPlace: (body: Omit<RecommendedPlaceRow, 'id'>) =>
    postData<RecommendedPlaceRow>('/admin/recommended-places', body),
  updateRecommendedPlace: (id: string, body: Partial<RecommendedPlaceRow>) =>
    patchData<RecommendedPlaceRow>(`/admin/recommended-places/${id}`, body),
  deleteRecommendedPlace: (id: string) =>
    deleteData<{ deleted: boolean }>(`/admin/recommended-places/${id}`),

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

  listRingtones: () => getData<Paginated<AdminRingtoneRow>>('/admin/ringtones', { limit: 50 }),
  createRingtone: (body: {
    name: string;
    fileBase64: string;
    mimeType: string;
    fileName?: string;
    isActive?: boolean;
  }) => postData<AdminRingtoneRow>('/admin/ringtones', body),
  updateRingtone: (
    id: string,
    body: {
      name?: string;
      isActive?: boolean;
      fileBase64?: string;
      mimeType?: string;
      fileName?: string;
    },
  ) => patchData<AdminRingtoneRow>(`/admin/ringtones/${id}`, body),
  deleteRingtone: (id: string) => deleteData<{ deleted: boolean }>(`/admin/ringtones/${id}`),

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

  getAppAvailability: () => getData<AppAvailability>('/admin/settings/availability'),
  updateAppAvailability: (body: { unavailable: boolean }) =>
    patchData<AppAvailability>('/admin/settings/availability', body),

  getAdsBannersEnabled: () => getData<AdsBannersSetting>('/admin/settings/ad-banners'),
  updateAdsBannersEnabled: (body: { enabled: boolean }) =>
    patchData<AdsBannersSetting>('/admin/settings/ad-banners', body),

  listAdBanners: () => getData<Paginated<AdminAdBannerRow>>('/admin/ad-banners', { limit: 50 }),
  createAdBanner: (body: Record<string, unknown>) =>
    postData<AdminAdBannerRow>('/admin/ad-banners', body),
  updateAdBanner: (id: string, body: Record<string, unknown>) =>
    patchData<AdminAdBannerRow>(`/admin/ad-banners/${id}`, body),
  deleteAdBanner: (id: string) => deleteData<{ deleted: boolean }>(`/admin/ad-banners/${id}`),

  getReferralCommissions: () =>
    getData<ReferralCommissions>('/admin/settings/referral-commissions'),
  updateReferralCommissions: (body: Partial<ReferralCommissions>) =>
    patchData<ReferralCommissions>('/admin/settings/referral-commissions', body),
};
