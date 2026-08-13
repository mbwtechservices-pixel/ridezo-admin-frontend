import { z } from 'zod';
import { EMAIL_REGEX, INDIAN_PHONE_REGEX, PASSWORD_MIN_LENGTH } from '../constants';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .regex(EMAIL_REGEX, 'Invalid email address');

export const phoneSchema = z
  .string()
  .min(10, 'Phone number must be at least 10 digits')
  .regex(INDIAN_PHONE_REGEX, 'Invalid Indian phone number');

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters');

export const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const registerSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: z.enum(['customer', 'driver']),
});

export const loginSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: 'Email or phone is required',
    path: ['email'],
  });

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const sendOtpSchema = z
  .object({
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    purpose: z.enum([
      'registration',
      'login',
      'password_reset',
      'phone_verification',
      'email_verification',
    ]),
  })
  .refine((data) => Boolean(data.phone || data.email), {
    message: 'Phone or email is required',
    path: ['phone'],
  });

export const verifyOtpSchema = z
  .object({
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    otp: otpSchema,
    purpose: z.enum([
      'registration',
      'login',
      'password_reset',
      'phone_verification',
      'email_verification',
    ]),
  })
  .refine((data) => Boolean(data.phone || data.email), {
    message: 'Phone or email is required',
    path: ['phone'],
  });

export const forgotPasswordSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: 'Email or phone is required',
    path: ['email'],
  });

export const resetPasswordSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    otp: otpSchema,
    newPassword: passwordSchema,
  })
  .refine((data) => Boolean(data.email || data.phone), {
    message: 'Email or phone is required',
    path: ['email'],
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  otp: otpSchema,
});

export const verifyPhoneSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const mapsAutocompleteSchema = z.object({
  input: z.string().min(2, 'Enter at least 2 characters').max(200),
  sessionToken: z.string().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const mapsPlaceDetailsSchema = z.object({
  placeId: z.string().min(3, 'placeId is required'),
  sessionToken: z.string().max(100).optional(),
});

export const mapsGeocodeSchema = z.object({
  address: z.string().min(3, 'Address is required').max(300),
});

export const mapsReverseGeocodeSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const mapsDirectionsSchema = z.object({
  origin: coordinatesSchema,
  destination: coordinatesSchema,
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).default('driving'),
});

export const mapsDistanceSchema = z.object({
  origins: z.array(coordinatesSchema).min(1).max(10),
  destinations: z.array(coordinatesSchema).min(1).max(10),
  mode: z.enum(['driving', 'walking', 'bicycling', 'transit']).default('driving'),
});

export const mapsFareEstimateSchema = z.object({
  origin: coordinatesSchema,
  destination: coordinatesSchema,
  vehicleType: z.enum(['bike', 'auto', 'mini', 'sedan', 'suv', 'premium']).optional(),
  couponCode: z.string().max(32).optional(),
});

export const mapsNearbyDriversSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().int().min(200).max(20000).default(5000),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type CoordinatesInput = z.infer<typeof coordinatesSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type MapsAutocompleteInput = z.infer<typeof mapsAutocompleteSchema>;
export type MapsPlaceDetailsInput = z.infer<typeof mapsPlaceDetailsSchema>;
export type MapsGeocodeInput = z.infer<typeof mapsGeocodeSchema>;
export type MapsReverseGeocodeInput = z.infer<typeof mapsReverseGeocodeSchema>;
export type MapsDirectionsInput = z.infer<typeof mapsDirectionsSchema>;
export type MapsDistanceInput = z.infer<typeof mapsDistanceSchema>;
export type MapsFareEstimateInput = z.infer<typeof mapsFareEstimateSchema>;
export type MapsNearbyDriversInput = z.infer<typeof mapsNearbyDriversSchema>;

const locationInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(3).max(300),
  label: z.string().max(100).optional(),
});

export const bookRideSchema = z
  .object({
    pickup: locationInputSchema,
    dropoff: locationInputSchema,
    vehicleType: z.enum(['bike', 'auto', 'mini', 'sedan', 'suv', 'premium', 'economy', 'comfort']),
    paymentMethod: z.enum(['cash', 'card', 'upi', 'wallet']).default('cash'),
    estimatedFare: z.number().positive().optional(),
    estimatedDistanceMeters: z.number().nonnegative().optional(),
    estimatedDurationSeconds: z.number().nonnegative().optional(),
    couponId: objectIdSchema.optional(),
    notes: z.string().max(500).optional(),
    bookForOther: z.boolean().optional().default(false),
    passengerName: z.string().trim().min(2).max(80).optional(),
    passengerPhone: phoneSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.bookForOther) return;
    if (!value.passengerName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passengerName'],
        message: 'Friend name is required',
      });
    }
    if (!value.passengerPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passengerPhone'],
        message: 'Friend mobile number is required',
      });
    }
  });

export const rideIdParamSchema = z.object({
  id: objectIdSchema,
});

export const idParamSchema = rideIdParamSchema;

export const cancelRideSchema = z.object({
  reason: z.string().min(2).max(300).default('Cancelled by user'),
});

export const acceptRideSchema = z.object({
  requestId: objectIdSchema,
  vehicleId: objectIdSchema.optional(),
});

export const rejectRideSchema = z.object({
  requestId: objectIdSchema,
  reason: z.string().max(200).optional(),
});

export const updateTripStatusSchema = z.object({
  status: z.enum([
    'driver_arriving',
    'driver_arrived',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  reason: z.string().max(300).optional(),
});

export const driverLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  tripId: objectIdSchema.optional(),
});

export const driverPresenceSchema = z.object({
  status: z.enum(['online', 'offline']),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const createReviewSchema = z.object({
  tripId: objectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  tags: z.array(z.string().max(40)).max(8).optional(),
  isAnonymous: z.boolean().optional(),
});

export const rateTripBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  tags: z.array(z.string().max(40)).max(8).optional(),
  isAnonymous: z.boolean().optional(),
});

export const walletTopUpSchema = z.object({
  amount: z.number().positive().min(50).max(100000),
});

export const paginationQuerySchema = paginationSchema;

export type BookRideInput = z.infer<typeof bookRideSchema>;
export type CancelRideInput = z.infer<typeof cancelRideSchema>;
export type AcceptRideInput = z.infer<typeof acceptRideSchema>;
export type RejectRideInput = z.infer<typeof rejectRideSchema>;
export type UpdateTripStatusInput = z.infer<typeof updateTripStatusSchema>;
export type DriverLocationInput = z.infer<typeof driverLocationSchema>;
export type DriverPresenceInput = z.infer<typeof driverPresenceSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type RateTripBodyInput = z.infer<typeof rateTripBodySchema>;
export type WalletTopUpInput = z.infer<typeof walletTopUpSchema>;

export const paymentVerifySchema = z.object({
  razorpayOrderId: z.string().min(3),
  razorpayPaymentId: z.string().min(3),
  razorpaySignature: z.string().min(3),
});

export const paymentTripOrderSchema = z.object({
  tripId: objectIdSchema,
});

export const paymentWalletTopUpOrderSchema = z.object({
  amount: z.number().positive().min(50).max(100000),
  method: z.enum(['upi', 'card']).default('upi'),
});

export const paymentRefundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(2).max(300).optional(),
});

export type PaymentVerifyInput = z.infer<typeof paymentVerifySchema>;
export type PaymentTripOrderInput = z.infer<typeof paymentTripOrderSchema>;
export type PaymentWalletTopUpOrderInput = z.infer<typeof paymentWalletTopUpOrderSchema>;
export type PaymentRefundInput = z.infer<typeof paymentRefundSchema>;

const notificationChannelEnum = z.enum(['push', 'email', 'sms', 'in_app']);

export const fcmTokenSchema = z.object({
  token: z.string().min(10).max(512),
});

export const sendNotificationSchema = z.object({
  userIds: z.array(objectIdSchema).min(1).max(200).optional(),
  title: z.string().min(1).max(150),
  body: z.string().min(1).max(1000),
  type: z
    .enum([
      'ride_update',
      'payment',
      'promotion',
      'system',
      'document',
      'wallet',
      'admin_alert',
      'driver_alert',
    ])
    .default('system'),
  channels: z.array(notificationChannelEnum).min(1).max(4).optional(),
  data: z.record(z.string()).optional(),
  delayMs: z.number().int().min(0).max(7 * 24 * 60 * 60 * 1000).optional(),
});

export const promotionNotificationSchema = z.object({
  title: z.string().min(1).max(150),
  body: z.string().min(1).max(1000),
  audience: z.enum(['customers', 'drivers', 'all_users', 'user_ids']),
  userIds: z.array(objectIdSchema).max(500).optional(),
  channels: z.array(notificationChannelEnum).min(1).max(4).optional(),
  data: z.record(z.string()).optional(),
  campaignId: z.string().max(64).optional(),
  delayMs: z.number().int().min(0).max(7 * 24 * 60 * 60 * 1000).optional(),
});

export const adminBroadcastSchema = z.object({
  title: z.string().min(1).max(150),
  body: z.string().min(1).max(1000),
  channels: z.array(notificationChannelEnum).min(1).max(4).optional(),
  data: z.record(z.string()).optional(),
});

export type FcmTokenInput = z.infer<typeof fcmTokenSchema>;
export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type PromotionNotificationInput = z.infer<typeof promotionNotificationSchema>;
export type AdminBroadcastInput = z.infer<typeof adminBroadcastSchema>;

export const otpLoginSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
  role: z.enum(['customer', 'driver']).default('customer'),
});

export const createServiceAreaSchema = z.object({
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  country: z.string().min(2).max(100).default('India'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be a 6-digit Indian PIN'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(500).default(25),
  isActive: z.boolean().default(true),
});

export const updateServiceAreaSchema = createServiceAreaSchema.partial();

export const createCouponAdminSchema = z.object({
  code: z.string().min(3).max(32),
  title: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().default(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  isPublic: z.boolean().default(true),
});

export const createCmsContentSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens'),
  type: z.enum(['page', 'banner', 'faq', 'policy']),
  content: z.string().min(1).max(50000),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const updateCmsContentSchema = createCmsContentSchema.partial();

export const driverVerificationSchema = z.object({
  status: z.enum(['approved', 'rejected', 'under_review', 'pending']),
  note: z.string().max(500).optional(),
});

export type OtpLoginInput = z.infer<typeof otpLoginSchema>;

export const otpRegisterSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  otp: otpSchema,
  role: z.enum(['customer', 'driver']),
});

export type OtpRegisterInput = z.infer<typeof otpRegisterSchema>;
export type CreateServiceAreaInput = z.infer<typeof createServiceAreaSchema>;
export type UpdateServiceAreaInput = z.infer<typeof updateServiceAreaSchema>;
export type CreateCouponAdminInput = z.infer<typeof createCouponAdminSchema>;
export type CreateCmsContentInput = z.infer<typeof createCmsContentSchema>;
export type UpdateCmsContentInput = z.infer<typeof updateCmsContentSchema>;
export type DriverVerificationInput = z.infer<typeof driverVerificationSchema>;
