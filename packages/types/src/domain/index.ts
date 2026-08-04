import type {
  AdminStatus,
  AuditAction,
  AuditActorType,
  CancellationInitiator,
  CouponStatus,
  CouponType,
  DocumentOwnerType,
  DocumentStatus,
  DocumentType,
  DriverStatus,
  DriverVerificationStatus,
  Gender,
  InvoiceStatus,
  NotificationAudience,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationType,
  PaymentMethod,
  PaymentPurpose,
  PaymentStatus,
  ReviewTargetType,
  RideRequestStatus,
  SettingValueType,
  TripStatus,
  UserRole,
  UserStatus,
  VehicleStatus,
  VehicleType,
  WalletTransactionSource,
  WalletTransactionType,
} from '../enums';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletable {
  isDeleted: boolean;
  deletedAt?: Date | null;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface Address {
  street?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  formattedAddress: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: Address;
  geo?: GeoPoint;
}

export interface User extends BaseEntity, SoftDeletable {
  email: string;
  phone: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  gender?: Gender;
  dateOfBirth?: Date;
  avatarUrl?: string;
  fcmTokens: string[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface Driver extends BaseEntity, SoftDeletable {
  userId: string;
  licenseNumber: string;
  licenseExpiry: Date;
  activeVehicleId?: string;
  status: DriverStatus;
  verificationStatus: DriverVerificationStatus;
  rating: number;
  ratingCount: number;
  totalTrips: number;
  totalEarnings: number;
  currentLocation?: Location;
  isDocumentsVerified: boolean;
  isAvailable: boolean;
  bankDetails?: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  joinedAt: Date;
}

export interface Vehicle extends BaseEntity, SoftDeletable {
  driverId: string;
  type: VehicleType;
  status: VehicleStatus;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  capacity: number;
  isDefault: boolean;
  registrationNumber?: string;
  insuranceExpiry?: Date;
  images: string[];
}

export interface RideRequest extends BaseEntity, SoftDeletable {
  customerId: string;
  vehicleType: VehicleType;
  status: RideRequestStatus;
  pickup: Location;
  dropoff: Location;
  estimatedDistanceMeters?: number;
  estimatedDurationSeconds?: number;
  estimatedFare?: number;
  couponId?: string;
  discountAmount?: number;
  paymentMethod: PaymentMethod;
  scheduledAt?: Date;
  expiresAt?: Date;
  notes?: string;
  matchedTripId?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancellationInitiator?: CancellationInitiator;
}

export interface TripFareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  taxes: number;
  discount: number;
  total: number;
  currency: string;
}

export interface Trip extends BaseEntity, SoftDeletable {
  rideRequestId: string;
  customerId: string;
  driverId: string;
  vehicleId: string;
  status: TripStatus;
  pickup: Location;
  dropoff: Location;
  actualPickup?: Location;
  actualDropoff?: Location;
  vehicleType: VehicleType;
  distanceMeters?: number;
  durationSeconds?: number;
  fare?: TripFareBreakdown;
  paymentMethod: PaymentMethod;
  couponId?: string;
  assignedAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  cancellationInitiator?: CancellationInitiator;
  polyline?: string;
  otp?: string;
}

export interface Payment extends BaseEntity, SoftDeletable {
  tripId?: string;
  customerId: string;
  driverId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  purpose: PaymentPurpose;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  razorpayRefundId?: string;
  transactionId?: string;
  invoiceId?: string;
  refundAmount?: number;
  refundedAt?: Date;
  paidAt?: Date;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Invoice extends BaseEntity, SoftDeletable {
  invoiceNumber: string;
  paymentId: string;
  userId: string;
  tripId?: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  lineItems: InvoiceLineItem[];
  billingName?: string;
  billingEmail?: string;
  billingPhone?: string;
  billingAddress?: string;
  notes?: string;
  issuedAt?: Date;
  paidAt?: Date;
  pdfUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface RazorpayCheckoutPayload {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: { color?: string };
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  source: WalletTransactionSource;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  description?: string;
  createdAt: Date;
}

export interface Wallet extends BaseEntity, SoftDeletable {
  userId: string;
  balance: number;
  currency: string;
  isLocked: boolean;
  transactions: WalletTransaction[];
}

export interface Coupon extends BaseEntity, SoftDeletable {
  code: string;
  title: string;
  description?: string;
  type: CouponType;
  value: number;
  status: CouponStatus;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perUserLimit: number;
  applicableVehicleTypes: VehicleType[];
  startsAt: Date;
  endsAt: Date;
  isPublic: boolean;
}

export interface Notification extends BaseEntity, SoftDeletable {
  userId: string;
  recipientType: 'user' | 'admin';
  title: string;
  body: string;
  type: NotificationType;
  channel: NotificationChannel;
  channels: NotificationChannel[];
  deliveryStatus: NotificationDeliveryStatus;
  audience?: NotificationAudience;
  campaignId?: string;
  jobId?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  sentAt?: Date;
  failedAt?: Date;
  attempts: number;
  lastError?: string;
  providerMessageIds?: string[];
}

export interface NotificationJobPayload {
  recipientIds: string[];
  recipientType: 'user' | 'admin';
  title: string;
  body: string;
  type: NotificationType;
  channels: NotificationChannel[];
  data?: Record<string, string>;
  campaignId?: string;
  audience?: NotificationAudience;
}

export interface NotifyOptions {
  channels?: NotificationChannel[];
  data?: Record<string, string>;
  campaignId?: string;
  delayMs?: number;
  priority?: number;
}

export interface Review extends BaseEntity, SoftDeletable {
  tripId: string;
  reviewerId: string;
  revieweeId: string;
  targetType: ReviewTargetType;
  rating: number;
  comment?: string;
  tags: string[];
  isAnonymous: boolean;
}

export interface Document extends BaseEntity, SoftDeletable {
  ownerType: DocumentOwnerType;
  ownerId: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string;
  publicId?: string;
  fileName?: string;
  mimeType?: string;
  expiryDate?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
}

export interface Permission extends BaseEntity, SoftDeletable {
  name: string;
  slug: string;
  module: string;
  description?: string;
  isSystem: boolean;
}

export interface Role extends BaseEntity, SoftDeletable {
  name: string;
  slug: string;
  description?: string;
  permissionIds: string[];
  isSystem: boolean;
}

export interface AdminUser extends BaseEntity, SoftDeletable {
  email: string;
  phone?: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: AdminStatus;
  roleIds: string[];
  avatarUrl?: string;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
}

export interface Setting extends BaseEntity, SoftDeletable {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  valueType: SettingValueType;
  group: string;
  description?: string;
  isPublic: boolean;
  isEditable: boolean;
}

export interface AuditLog extends BaseEntity {
  actorType: AuditActorType;
  actorId?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  success: boolean;
  message?: string;
}
