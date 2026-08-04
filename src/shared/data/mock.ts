export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'blocked';
  trips: number;
  joinedAt: string;
  city: string;
}

export interface DriverRow {
  id: string;
  name: string;
  phone: string;
  status: 'online' | 'offline' | 'busy' | 'suspended';
  vehicle: string;
  rating: number;
  trips: number;
  earnings: number;
  city: string;
  joinedAt: string;
}

export interface VehicleRow {
  id: string;
  plate: string;
  make: string;
  model: string;
  type: 'mini' | 'sedan' | 'suv' | 'premium';
  driver: string;
  status: 'active' | 'inactive' | 'maintenance';
  year: number;
  city: string;
}

export interface TripRow {
  id: string;
  rider: string;
  driver: string;
  pickup: string;
  dropoff: string;
  fare: number;
  status: 'completed' | 'cancelled' | 'ongoing' | 'scheduled';
  distanceKm: number;
  createdAt: string;
}

export interface PaymentRow {
  id: string;
  tripId: string;
  user: string;
  method: 'upi' | 'card' | 'wallet' | 'cash';
  amount: number;
  status: 'success' | 'failed' | 'refunded' | 'pending';
  createdAt: string;
}

export interface CouponRow {
  id: string;
  code: string;
  title: string;
  type: 'percent' | 'flat';
  value: number;
  status: 'active' | 'expired' | 'draft';
  usage: number;
  maxUsage: number;
  expiresAt: string;
}

export interface CmsRow {
  id: string;
  title: string;
  slug: string;
  type: 'page' | 'banner' | 'faq' | 'policy';
  status: 'published' | 'draft';
  updatedAt: string;
  author: string;
}

export interface NotificationRow {
  id: string;
  title: string;
  audience: 'all' | 'customers' | 'drivers' | 'admins';
  channel: 'push' | 'email' | 'sms';
  status: 'sent' | 'scheduled' | 'draft';
  sentAt: string;
}

export interface RoleRow {
  id: string;
  name: string;
  slug: string;
  users: number;
  permissions: number;
  description: string;
  updatedAt: string;
}

export interface PermissionRow {
  id: string;
  name: string;
  slug: string;
  module: string;
  description: string;
}

export interface AuditRow {
  id: string;
  actor: string;
  actorType: 'admin' | 'system' | 'user';
  action: string;
  resource: string;
  ip: string;
  success: boolean;
  createdAt: string;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

export const USERS: UserRow[] = Array.from({ length: 48 }, (_, i) => ({
  id: `usr-${1000 + i}`,
  name: ['Aarav Mehta', 'Priya Nair', 'Kabir Shah', 'Ananya Rao', 'Rohan Das', 'Isha Kapoor'][i % 6]!,
  email: `user${i + 1}@mail.com`,
  phone: `98765${String(10000 + i).slice(-5)}`,
  status: (['active', 'active', 'active', 'inactive', 'blocked'] as const)[i % 5]!,
  trips: 3 + ((i * 7) % 120),
  joinedAt: daysAgo(i + 1),
  city: ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai'][i % 5]!,
}));

export const DRIVERS: DriverRow[] = Array.from({ length: 36 }, (_, i) => ({
  id: `drv-${2000 + i}`,
  name: ['Rahul Verma', 'Suresh Patil', 'Imran Ali', 'Deepak Yadav', 'Manoj Singh'][i % 5]!,
  phone: `99887${String(10000 + i).slice(-5)}`,
  status: (['online', 'offline', 'busy', 'online', 'suspended'] as const)[i % 5]!,
  vehicle: `KA 0${(i % 9) + 1} AB ${4200 + i}`,
  rating: Number((3.8 + (i % 12) * 0.1).toFixed(1)),
  trips: 40 + i * 17,
  earnings: 12000 + i * 850,
  city: ['Bengaluru', 'Mumbai', 'Delhi', 'Pune'][i % 4]!,
  joinedAt: daysAgo(i * 2 + 3),
}));

export const VEHICLES: VehicleRow[] = Array.from({ length: 32 }, (_, i) => ({
  id: `veh-${3000 + i}`,
  plate: `KA 0${(i % 9) + 1} AB ${4200 + i}`,
  make: ['Maruti', 'Hyundai', 'Toyota', 'Honda', 'Tata'][i % 5]!,
  model: ['Dzire', 'i20', 'Innova', 'City', 'Nexon'][i % 5]!,
  type: (['mini', 'sedan', 'suv', 'premium'] as const)[i % 4]!,
  driver: DRIVERS[i % DRIVERS.length]!.name,
  status: (['active', 'active', 'inactive', 'maintenance'] as const)[i % 4]!,
  year: 2018 + (i % 7),
  city: ['Bengaluru', 'Mumbai', 'Delhi'][i % 3]!,
}));

export const TRIPS: TripRow[] = Array.from({ length: 60 }, (_, i) => ({
  id: `trip-${4000 + i}`,
  rider: USERS[i % USERS.length]!.name,
  driver: DRIVERS[i % DRIVERS.length]!.name,
  pickup: ['MG Road', 'Indiranagar', 'Koramangala', 'Whitefield', 'Airport'][i % 5]!,
  dropoff: ['HSR', 'Jayanagar', 'Electronic City', 'Hebbal', 'Majestic'][i % 5]!,
  fare: 120 + (i % 20) * 45,
  status: (['completed', 'completed', 'cancelled', 'ongoing', 'scheduled'] as const)[i % 5]!,
  distanceKm: Number((3 + (i % 25) * 1.4).toFixed(1)),
  createdAt: daysAgo(i % 20),
}));

export const PAYMENTS: PaymentRow[] = Array.from({ length: 55 }, (_, i) => ({
  id: `pay-${5000 + i}`,
  tripId: TRIPS[i % TRIPS.length]!.id,
  user: USERS[i % USERS.length]!.name,
  method: (['upi', 'card', 'wallet', 'cash'] as const)[i % 4]!,
  amount: 120 + (i % 18) * 50,
  status: (['success', 'success', 'failed', 'refunded', 'pending'] as const)[i % 5]!,
  createdAt: daysAgo(i % 15),
}));

export const COUPONS: CouponRow[] = [
  {
    id: 'cpn-1',
    code: 'RIDEZO50',
    title: 'Flat ₹50 off',
    type: 'flat',
    value: 50,
    status: 'active',
    usage: 1240,
    maxUsage: 5000,
    expiresAt: daysAgo(-20),
  },
  {
    id: 'cpn-2',
    code: 'FIRST20',
    title: '20% first ride',
    type: 'percent',
    value: 20,
    status: 'active',
    usage: 890,
    maxUsage: 2000,
    expiresAt: daysAgo(-40),
  },
  {
    id: 'cpn-3',
    code: 'WEEKEND15',
    title: 'Weekend special',
    type: 'percent',
    value: 15,
    status: 'expired',
    usage: 2100,
    maxUsage: 2100,
    expiresAt: daysAgo(5),
  },
  {
    id: 'cpn-4',
    code: 'AIRPORT100',
    title: 'Airport flat ₹100',
    type: 'flat',
    value: 100,
    status: 'draft',
    usage: 0,
    maxUsage: 1000,
    expiresAt: daysAgo(-60),
  },
  {
    id: 'cpn-5',
    code: 'MONSOON25',
    title: 'Monsoon 25% off',
    type: 'percent',
    value: 25,
    status: 'active',
    usage: 340,
    maxUsage: 3000,
    expiresAt: daysAgo(-10),
  },
];

export const CMS_ITEMS: CmsRow[] = [
  {
    id: 'cms-1',
    title: 'About Ridezo',
    slug: 'about',
    type: 'page',
    status: 'published',
    updatedAt: daysAgo(2),
    author: 'Admin',
  },
  {
    id: 'cms-2',
    title: 'Privacy Policy',
    slug: 'privacy',
    type: 'policy',
    status: 'published',
    updatedAt: daysAgo(10),
    author: 'Legal',
  },
  {
    id: 'cms-3',
    title: 'Terms of Service',
    slug: 'terms',
    type: 'policy',
    status: 'published',
    updatedAt: daysAgo(10),
    author: 'Legal',
  },
  {
    id: 'cms-4',
    title: 'Home Hero Banner',
    slug: 'home-hero',
    type: 'banner',
    status: 'published',
    updatedAt: daysAgo(1),
    author: 'Marketing',
  },
  {
    id: 'cms-5',
    title: 'How cancellations work',
    slug: 'faq-cancel',
    type: 'faq',
    status: 'draft',
    updatedAt: daysAgo(4),
    author: 'Support',
  },
  {
    id: 'cms-6',
    title: 'Safety guidelines',
    slug: 'safety',
    type: 'page',
    status: 'published',
    updatedAt: daysAgo(7),
    author: 'Ops',
  },
];

export const NOTIFICATIONS: NotificationRow[] = Array.from({ length: 24 }, (_, i) => ({
  id: `ntf-${6000 + i}`,
  title: [
    'Weekend surge alert',
    'New coupon unlocked',
    'Driver payout processed',
    'App update available',
    'Safety checklist reminder',
  ][i % 5]!,
  audience: (['all', 'customers', 'drivers', 'admins'] as const)[i % 4]!,
  channel: (['push', 'email', 'sms'] as const)[i % 3]!,
  status: (['sent', 'scheduled', 'draft'] as const)[i % 3]!,
  sentAt: daysAgo(i),
}));

export const ROLES: RoleRow[] = [
  {
    id: 'role-1',
    name: 'Super Admin',
    slug: 'super-admin',
    users: 2,
    permissions: 42,
    description: 'Full platform access',
    updatedAt: daysAgo(1),
  },
  {
    id: 'role-2',
    name: 'Operations',
    slug: 'operations',
    users: 8,
    permissions: 24,
    description: 'Trips, drivers, vehicles',
    updatedAt: daysAgo(3),
  },
  {
    id: 'role-3',
    name: 'Finance',
    slug: 'finance',
    users: 4,
    permissions: 12,
    description: 'Payments, payouts, coupons',
    updatedAt: daysAgo(5),
  },
  {
    id: 'role-4',
    name: 'Support',
    slug: 'support',
    users: 12,
    permissions: 10,
    description: 'Users, tickets, notifications',
    updatedAt: daysAgo(2),
  },
  {
    id: 'role-5',
    name: 'Analyst',
    slug: 'analyst',
    users: 3,
    permissions: 6,
    description: 'Read-only analytics',
    updatedAt: daysAgo(8),
  },
];

export const PERMISSIONS: PermissionRow[] = [
  'users.read',
  'users.write',
  'drivers.read',
  'drivers.write',
  'vehicles.read',
  'vehicles.write',
  'trips.read',
  'trips.write',
  'payments.read',
  'payments.refund',
  'coupons.read',
  'coupons.write',
  'cms.read',
  'cms.write',
  'analytics.read',
  'notifications.send',
  'roles.read',
  'roles.write',
  'permissions.read',
  'audit.read',
  'settings.write',
].map((slug, i) => ({
  id: `perm-${i + 1}`,
  name: slug
    .split('.')
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(' '),
  slug,
  module: slug.split('.')[0]!,
  description: `Allows ${slug.replace('.', ' ')} on the platform`,
}));

export const AUDIT_LOGS: AuditRow[] = Array.from({ length: 40 }, (_, i) => ({
  id: `aud-${7000 + i}`,
  actor: ['admin@ridezo.com', 'ops@ridezo.com', 'system', 'finance@ridezo.com'][i % 4]!,
  actorType: (['admin', 'admin', 'system', 'admin'] as const)[i % 4]!,
  action: ['LOGIN', 'UPDATE', 'CREATE', 'DELETE', 'EXPORT', 'REFUND'][i % 6]!,
  resource: ['user', 'driver', 'trip', 'payment', 'coupon', 'role'][i % 6]!,
  ip: `103.21.${10 + (i % 40)}.${20 + i}`,
  success: i % 7 !== 0,
  createdAt: daysAgo(i % 12),
}));

export const REVENUE_SERIES = [
  { label: 'Mon', revenue: 42000, trips: 310 },
  { label: 'Tue', revenue: 48000, trips: 340 },
  { label: 'Wed', revenue: 51000, trips: 365 },
  { label: 'Thu', revenue: 47000, trips: 332 },
  { label: 'Fri', revenue: 62000, trips: 410 },
  { label: 'Sat', revenue: 78000, trips: 520 },
  { label: 'Sun', revenue: 71000, trips: 480 },
];

export const CITY_SHARE = [
  { name: 'Bengaluru', value: 38 },
  { name: 'Mumbai', value: 24 },
  { name: 'Delhi', value: 18 },
  { name: 'Hyderabad', value: 12 },
  { name: 'Others', value: 8 },
];

export const FUNNEL = [
  { stage: 'Searches', value: 12000 },
  { stage: 'Bookings', value: 8200 },
  { stage: 'Completed', value: 7400 },
  { stage: 'Rated', value: 5100 },
];
