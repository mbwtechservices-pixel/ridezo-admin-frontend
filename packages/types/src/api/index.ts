import type { RazorpayCheckoutPayload } from '../domain';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export type AuthActorType = 'user' | 'admin';

export interface JwtPayload {
  sub: string;
  role: string;
  actorType: AuthActorType;
  email?: string;
  phone?: string;
  permissions?: string[];
  tokenType: 'access' | 'refresh';
  jti?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthUserResponse {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
}

export interface AuthAdminResponse {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  status: string;
  roleIds: string[];
  permissions: string[];
  avatarUrl?: string;
}

export interface AuthResponse {
  user: AuthUserResponse;
  tokens: AuthTokens;
}

export interface AdminAuthResponse {
  admin: AuthAdminResponse;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'driver';
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface OtpRequest {
  phone?: string;
  email?: string;
  purpose: string;
}

export interface OtpVerifyRequest {
  phone?: string;
  email?: string;
  otp: string;
  purpose: string;
}

export interface ForgotPasswordRequest {
  email?: string;
  phone?: string;
}

export interface ResetPasswordRequest {
  email?: string;
  phone?: string;
  otp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface VerifyPhoneRequest {
  phone: string;
  otp: string;
}

export interface RideRequestSocketPayload {
  requestId: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  bookedForOther?: boolean;
  bookerName?: string;
  passengerName?: string;
  passengerPhone?: string;
  vehicleType: string;
  pickup: { latitude: number; longitude: number; address: string };
  dropoff: { latitude: number; longitude: number; address: string };
  estimatedFare: number;
  estimatedDistanceMeters?: number;
  estimatedDurationSeconds?: number;
  expiresAt?: string;
  paymentMethod: string;
}

export interface TripSocketPayload {
  tripId: string;
  requestId: string;
  status: string;
  customerId: string;
  driverId: string;
  vehicleId: string;
  pickup: { latitude: number; longitude: number; address: string };
  dropoff: { latitude: number; longitude: number; address: string };
  fareTotal?: number;
  otp?: string;
  bookedForOther?: boolean;
  bookerName?: string;
  passengerName?: string;
  passengerPhone?: string;
  driver?: {
    name: string;
    rating: number;
    phone?: string;
    vehicleModel?: string;
    plateNumber?: string;
  };
}

export interface DriverLocationSocketPayload {
  tripId: string;
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  updatedAt: string;
}

export interface SocketEvents {
  'ride:request': (data: RideRequestSocketPayload) => void;
  'ride:taken': (data: { requestId: string; tripId: string }) => void;
  'ride:expired': (data: { requestId: string }) => void;
  'ride:cancelled': (data: {
    requestId?: string;
    tripId?: string;
    reason?: string;
    initiator?: string;
  }) => void;
  'ride:matched': (data: TripSocketPayload) => void;
  'ride:status': (data: TripSocketPayload) => void;
  'ride:completed': (data: TripSocketPayload & {
    receiptId?: string;
    checkout?: RazorpayCheckoutPayload;
    paymentStatus?: string;
    invoiceId?: string;
  }) => void;
  'driver:location': (data: DriverLocationSocketPayload) => void;
  'driver:online': (data: { driverId: string; latitude: number; longitude: number }) => void;
  'driver:offline': (data: { driverId: string }) => void;
  'trip:join': (data: { tripId: string }) => void;
  'notification:new': (data: { notificationId: string }) => void;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText?: string;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  formattedAddress: string;
  location: LatLng;
  postalCode?: string;
  city?: string;
  state?: string;
}

export interface GeocodeResult {
  formattedAddress: string;
  location: LatLng;
  placeId?: string;
  postalCode?: string;
  city?: string;
  state?: string;
}

export interface RouteLeg {
  distanceMeters: number;
  distanceText: string;
  durationSeconds: number;
  durationText: string;
  startAddress?: string;
  endAddress?: string;
}

export interface DirectionsResult {
  polyline: string;
  bounds?: {
    northeast: LatLng;
    southwest: LatLng;
  };
  legs: RouteLeg[];
  distanceMeters: number;
  durationSeconds: number;
  provider: 'google' | 'osrm' | 'haversine_fallback';
  cached: boolean;
}

export interface FareVehicleEstimate {
  vehicleType: string;
  name: string;
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
  etaMinutes: number;
}

export interface FareEstimateResult {
  origin: LatLng;
  destination: LatLng;
  distanceMeters: number;
  durationSeconds: number;
  distanceKm: number;
  durationMinutes: number;
  polyline?: string;
  provider: 'google' | 'osrm' | 'haversine_fallback';
  cached: boolean;
  vehicles: FareVehicleEstimate[];
}

export interface NearbyDriverResult {
  id: string;
  latitude: number;
  longitude: number;
  rating: number;
  status: string;
  distanceMeters: number;
  etaSeconds?: number;
  etaText?: string;
  /** Raw vehicle type from the driver's active vehicle (e.g. bike, auto, economy). */
  vehicleType?: string;
  /** UI category used for map icons: bike | auto | car. */
  vehicleCategory?: 'bike' | 'auto' | 'car';
}

export interface MapsConfigResponse {
  enabled: boolean;
  region: string;
  language: string;
  fallbackMode: boolean;
  basemap: 'mapcn';
  styles?: {
    light: string;
    dark: string;
  };
}
