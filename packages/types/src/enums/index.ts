export enum UserRole {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum RideStatus {
  REQUESTED = 'requested',
  SEARCHING = 'searching',
  ACCEPTED = 'accepted',
  DRIVER_ARRIVED = 'driver_arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum RideRequestStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  CONVERTED = 'converted',
}

export enum TripStatus {
  SCHEDULED = 'scheduled',
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_ARRIVING = 'driver_arriving',
  DRIVER_ARRIVED = 'driver_arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  WALLET = 'wallet',
}

export enum PaymentPurpose {
  TRIP = 'trip',
  WALLET_TOPUP = 'wallet_topup',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  PAID = 'paid',
  VOID = 'void',
  REFUNDED = 'refunded',
}

export enum VehicleType {
  ECONOMY = 'economy',
  COMFORT = 'comfort',
  PREMIUM = 'premium',
  SUV = 'suv',
  AUTO = 'auto',
  BIKE = 'bike',
}

export enum VehicleStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_MAINTENANCE = 'under_maintenance',
  REJECTED = 'rejected',
}

export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  ON_RIDE = 'on_ride',
  BUSY = 'busy',
}

export enum DriverVerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum NotificationType {
  RIDE_UPDATE = 'ride_update',
  PAYMENT = 'payment',
  PROMOTION = 'promotion',
  SYSTEM = 'system',
  DOCUMENT = 'document',
  WALLET = 'wallet',
  ADMIN_ALERT = 'admin_alert',
  DRIVER_ALERT = 'driver_alert',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export enum NotificationDeliveryStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENDING = 'sending',
  SENT = 'sent',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export enum NotificationAudience {
  USER = 'user',
  CUSTOMERS = 'customers',
  DRIVERS = 'drivers',
  ADMINS = 'admins',
  ALL_USERS = 'all_users',
}

export enum NotificationJobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
}

export enum OtpPurpose {
  REGISTRATION = 'registration',
  LOGIN = 'login',
  PASSWORD_RESET = 'password_reset',
  PHONE_VERIFICATION = 'phone_verification',
  EMAIL_VERIFICATION = 'email_verification',
}

export enum AuditAction {
  REGISTER = 'register',
  LOGIN = 'login',
  LOGOUT = 'logout',
  REFRESH_TOKEN = 'refresh_token',
  OTP_SENT = 'otp_sent',
  OTP_VERIFIED = 'otp_verified',
  OTP_FAILED = 'otp_failed',
  PASSWORD_FORGOT = 'password_forgot',
  PASSWORD_RESET = 'password_reset',
  PASSWORD_CHANGED = 'password_changed',
  EMAIL_VERIFIED = 'email_verified',
  PHONE_VERIFIED = 'phone_verified',
  LOGIN_FAILED = 'login_failed',
  ACCOUNT_LOCKED = 'account_locked',
  TOKEN_REVOKED = 'token_revoked',
}

export enum AuditActorType {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system',
}


export enum DocumentType {
  DRIVING_LICENSE = 'driving_license',
  VEHICLE_REGISTRATION = 'vehicle_registration',
  VEHICLE_INSURANCE = 'vehicle_insurance',
  AADHAAR = 'aadhaar',
  PAN = 'pan',
  PROFILE_PHOTO = 'profile_photo',
  VEHICLE_PHOTO = 'vehicle_photo',
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum DocumentOwnerType {
  DRIVER = 'driver',
  VEHICLE = 'vehicle',
  USER = 'user',
}

export enum CouponType {
  PERCENTAGE = 'percentage',
  FLAT = 'flat',
}

export enum CouponStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum WalletTransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum WalletTransactionSource {
  TOP_UP = 'top_up',
  RIDE_PAYMENT = 'ride_payment',
  RIDE_EARNING = 'ride_earning',
  REFUND = 'refund',
  CASHBACK = 'cashback',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  WITHDRAWAL = 'withdrawal',
}

export enum ReviewTargetType {
  DRIVER = 'driver',
  CUSTOMER = 'customer',
  TRIP = 'trip',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum CancellationInitiator {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

export enum SettingValueType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

export enum AdminStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
}
