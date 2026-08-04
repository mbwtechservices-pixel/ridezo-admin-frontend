import { Suspense, lazy, type ComponentType, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/app/guards';
import { AdminLayout } from '@/layouts/AdminLayout';

function lazyPage(factory: () => Promise<{ [key: string]: ComponentType }>, exportName: string) {
  return lazy(async () => {
    const mod = await factory();
    return { default: mod[exportName] as ComponentType };
  });
}

const LoginPage = lazyPage(() => import('@/pages/login/LoginPage'), 'LoginPage');
const DashboardPage = lazyPage(() => import('@/pages/dashboard/DashboardPage'), 'DashboardPage');
const UsersPage = lazyPage(() => import('@/pages/users/UsersPage'), 'UsersPage');
const DriversPage = lazyPage(() => import('@/pages/drivers/DriversPage'), 'DriversPage');
const VehiclesPage = lazyPage(() => import('@/pages/vehicles/VehiclesPage'), 'VehiclesPage');
const TripsPage = lazyPage(() => import('@/pages/trips/TripsPage'), 'TripsPage');
const PaymentsPage = lazyPage(() => import('@/pages/payments/PaymentsPage'), 'PaymentsPage');
const CouponsPage = lazyPage(() => import('@/pages/coupons/CouponsPage'), 'CouponsPage');
const LocationsPage = lazyPage(() => import('@/pages/locations/LocationsPage'), 'LocationsPage');
const CmsPage = lazyPage(() => import('@/pages/cms/CmsPage'), 'CmsPage');
const AnalyticsPage = lazyPage(() => import('@/pages/analytics/AnalyticsPage'), 'AnalyticsPage');
const NotificationsPage = lazyPage(
  () => import('@/pages/notifications/NotificationsPage'),
  'NotificationsPage',
);
const RolesPage = lazyPage(() => import('@/pages/roles/RolesPage'), 'RolesPage');
const PermissionsPage = lazyPage(() => import('@/pages/permissions/PermissionsPage'), 'PermissionsPage');
const AuditLogsPage = lazyPage(() => import('@/pages/audit-logs/AuditLogsPage'), 'AuditLogsPage');
const SettingsPage = lazyPage(() => import('@/pages/settings/SettingsPage'), 'SettingsPage');
const NotFoundPage = lazyPage(() => import('@/pages/not-found/NotFoundPage'), 'NotFoundPage');

function RouteFallback(): ReactNode {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
      <span className="text-sm opacity-70">Loading…</span>
    </div>
  );
}

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/drivers" element={<DriversPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/cms" element={<CmsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/permissions" element={<PermissionsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
