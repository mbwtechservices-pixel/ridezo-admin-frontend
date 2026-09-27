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

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  accountStatus: string;
  isOnline: boolean;
  trips: number;
  joinedAt: string;
  city: string;
}

export interface AdminVehicleRow {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  type: 'bike' | 'auto' | 'mini' | 'sedan' | 'suv' | 'premium';
  driver: string;
  driverPhone?: string;
  status: 'active' | 'inactive' | 'maintenance';
  city: string;
  createdAt: string;
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
  isBanned?: boolean;
  banReason?: string | null;
  banDurationLabel?: string | null;
  banExpiresAt?: string | null;
  bannedAt?: string | null;
  documentsVerified?: boolean;
  documentsUploaded?: boolean;
  uploadedDocuments?: number;
  verifiedDocuments?: number;
}

export interface AdminDriverDocumentCard {
  id: string | null;
  type: 'driving_license' | 'aadhaar' | 'pan' | 'profile_photo' | string;
  fileUrl: string | null;
  frontImage?: string | null;
  fileName: string | null;
  mimeType: string | null;
  fileUrlBack?: string | null;
  backImage?: string | null;
  fileNameBack?: string | null;
  mimeTypeBack?: string | null;
  status: string;
  uploadedAt: string | null;
}

export interface AdminDriverDocumentsRow {
  driverId: string;
  name: string;
  phone: string;
  email: string;
  verificationStatus: string;
  documentsUploaded?: boolean;
  documentsVerified?: boolean;
  documents: AdminDriverDocumentCard[];
}

export interface AdminDashboardStats {
  grossRevenue: number;
  completedTrips: number;
  userCount: number;
  driverTotal: number;
  driverOnline: number;
  revenueSeries: Array<{ label: string; revenue: number; trips: number }>;
  cityShare: Array<{ name: string; value: number; revenue: number; trips: number }>;
}

export interface AdminTripRow {
  id: string;
  rideId: string;
  rider: string;
  riderPhone?: string;
  driver: string;
  driverPhone?: string;
  pickup: string;
  dropoff: string;
  distanceKm: number;
  fare: number;
  status: 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  paymentMethod?: string;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  serviceKind?: string;
  parcelPhotos?: {
    senderName: string;
    senderPhone: string;
    pickup: Array<{ side: string; url: string; capturedAt: string; driverId: string }>;
    delivery: Array<{ side: string; url: string; capturedAt: string; driverId: string }>;
  } | null;
}

export interface AdminPaymentRow {
  id: string;
  tripId: string;
  rideId: string;
  user: string;
  userPhone?: string;
  driver: string;
  amount: number;
  method: string;
  status: 'SUCCESS' | 'FAILED' | 'REFUND' | 'PENDING';
  transactionId: string;
  createdAt: string;
  paidAt?: string | null;
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

export interface AdminRentalCarRow {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  photos: Array<{ url: string; mimeType?: string }>;
  location: string;
  seatingCapacity: number;
  transmission: 'manual' | 'automatic';
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid';
  features: string[];
  availability: 'available' | 'unavailable';
  isActive: boolean;
  securityDeposit: number;
  pricePerDay: number;
  priceTwoDays: number;
  description?: string;
  color?: string;
  sortOrder: number;
}

export interface AdminRentalBookingRow {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  carName: string;
  pickupLocation: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalAmount: number;
  originalAmount?: number;
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUND' | string;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | string;
  bookingDate?: string;
  createdAt: string;
  cancelledBy?: string;
  cancellationReason?: string;
  cancelledAt?: string | null;
  refundableAmount?: number;
  refundedAmount?: number;
  refundStatus?: string;
}

export interface RentalCancellationPolicy {
  fullRefundHoursBeforeStart: number;
  partialRefundHoursBeforeStart: number;
  partialFareRefundPercent: number;
  lateFareRefundPercent: number;
  depositRefundableBeforeStart: boolean;
  depositRefundableAfterStart: boolean;
}

export interface AdminRentalCancellationPreview {
  canCancel: boolean;
  blockReason: string;
  originalAmount: number;
  refundableAmount: number;
  remainingRefund: number;
  policyNote: string;
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
      limit: 100,
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

  listDrivers: () => getData<Paginated<AdminDriverRow>>('/admin/drivers', { limit: 100, sortOrder: 'desc' }),
  listDriverDocuments: () =>
    getData<{ items: AdminDriverDocumentsRow[]; total: number }>('/admin/driver-documents'),
  verifyDriverDocument: (
    driverId: string,
    documentId: string,
    body: { status: 'approved' | 'rejected'; note?: string },
  ) =>
    patchData(`/admin/drivers/${driverId}/documents/${documentId}/verify`, body),
  listUsers: (params?: { search?: string }) =>
    getData<Paginated<AdminUserRow>>('/admin/users', { limit: 100, sortOrder: 'desc', ...params }),
  getDashboard: () => getData<AdminDashboardStats>('/admin/dashboard'),
  listTrips: () =>
    getData<Paginated<AdminTripRow>>('/admin/trips', { limit: 100, sortOrder: 'desc' }),
  listPayments: () =>
    getData<Paginated<AdminPaymentRow>>('/admin/payments', { limit: 100, sortOrder: 'desc' }),
  updateUserStatus: (id: string, status: 'active' | 'inactive') =>
    patchData<AdminUserRow>(`/admin/users/${id}/status`, { status }),
  listVehicles: (params?: { search?: string }) =>
    getData<Paginated<AdminVehicleRow>>('/admin/vehicles', {
      limit: 100,
      sortOrder: 'desc',
      ...params,
    }),
  updateDriverVerification: (
    id: string,
    status: 'approved' | 'rejected' | 'under_review' | 'pending',
    extra?: { identityConfirmed?: boolean; note?: string },
  ) => patchData(`/admin/drivers/${id}/verification`, { status, ...extra }),
  banDriver: (
    id: string,
    body: {
      duration: '10_days' | '20_days' | '1_month' | '6_months' | '1_year';
      reason: string;
    },
  ) => postData(`/admin/drivers/${id}/ban`, body),
  unbanDriver: (id: string) => postData(`/admin/drivers/${id}/unban`, {}),

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

  listRentalCars: () =>
    getData<Paginated<AdminRentalCarRow>>('/admin/rentals', { limit: 100, sortOrder: 'asc' }),
  createRentalCar: (body: Record<string, unknown>) =>
    postData<AdminRentalCarRow>('/admin/rentals', body),
  updateRentalCar: (id: string, body: Record<string, unknown>) =>
    patchData<AdminRentalCarRow>(`/admin/rentals/${id}`, body),
  deleteRentalCar: (id: string) => deleteData<{ deleted: boolean }>(`/admin/rentals/${id}`),

  listRentalBookings: () =>
    getData<Paginated<AdminRentalBookingRow>>('/admin/rental-bookings', { limit: 500 }),
  updateRentalBooking: (id: string, body: { status: string; reason?: string }) =>
    patchData<AdminRentalBookingRow>(`/admin/rental-bookings/${id}`, body),
  previewRentalCancellation: (id: string) =>
    getData<AdminRentalCancellationPreview>(`/admin/rental-bookings/${id}/cancellation`),
  cancelRentalBooking: (id: string, body: { reason?: string }) =>
    postData<AdminRentalBookingRow>(`/admin/rental-bookings/${id}/cancel`, body),
  refundRentalBooking: (id: string, body?: { reason?: string }) =>
    postData<AdminRentalBookingRow>(`/admin/rental-bookings/${id}/refund`, body ?? {}),

  getRentalCancellationPolicy: () =>
    getData<RentalCancellationPolicy>('/admin/settings/rental-cancellation'),
  updateRentalCancellationPolicy: (body: Partial<RentalCancellationPolicy>) =>
    patchData<RentalCancellationPolicy>('/admin/settings/rental-cancellation', body),

  getReferralCommissions: () =>
    getData<ReferralCommissions>('/admin/settings/referral-commissions'),
  updateReferralCommissions: (body: Partial<ReferralCommissions>) =>
    patchData<ReferralCommissions>('/admin/settings/referral-commissions', body),
};
