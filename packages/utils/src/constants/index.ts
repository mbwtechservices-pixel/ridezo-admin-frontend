export const APP_NAME = 'Ridezo';

export const API_VERSION = 'v1';

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 100;

export const OTP_LENGTH = 6;

export const OTP_EXPIRY_MINUTES = 10;

export const JWT_ACCESS_TOKEN_EXPIRY = '15m';

export const JWT_REFRESH_TOKEN_EXPIRY = '7d';

export const PASSWORD_MIN_LENGTH = 8;

export const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export const RIDE_SEARCH_RADIUS_KM = 10;

export const MAX_RIDE_CANCELLATION_MINUTES = 5;

export const SOCKET_EVENTS = {
  RIDE_REQUEST: 'ride:request',
  RIDE_ACCEPT: 'ride:accept',
  RIDE_UPDATE: 'ride:update',
  RIDE_CANCEL: 'ride:cancel',
  DRIVER_LOCATION: 'driver:location',
  NOTIFICATION_NEW: 'notification:new',
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const AREA_NOT_SERVICEABLE_MESSAGE =
  'Ride booking is not available in this area. Please move to a nearby available location and book your ride.';

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;
