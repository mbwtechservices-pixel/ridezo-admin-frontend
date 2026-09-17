import { useCallback, useEffect, useState } from 'react';
import {
  CarFront,
  CreditCard,
  IndianRupee,
  Route,
  Users,
} from 'lucide-react';
import { CityShareChart, RevenueChart } from '@/components/charts/Charts';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import {
  adminApi,
  type AdminDashboardStats,
  type AdminPaymentRow,
  type AdminTripRow,
} from '@/shared/api/admin.api';
import { formatCurrency } from '@/shared/lib/cn';

const POLL_MS = 5000;

const EMPTY_STATS: AdminDashboardStats = {
  grossRevenue: 0,
  completedTrips: 0,
  userCount: 0,
  driverTotal: 0,
  driverOnline: 0,
  revenueSeries: [],
  cityShare: [],
};

export function DashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats>(EMPTY_STATS);
  const [trips, setTrips] = useState<AdminTripRow[]>([]);
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);

  const load = useCallback(async () => {
    const [dashboard, tripResult, paymentResult] = await Promise.all([
      adminApi.getDashboard().catch(() => EMPTY_STATS),
      adminApi.listTrips().catch(() => ({ items: [] as AdminTripRow[] })),
      adminApi.listPayments().catch(() => ({ items: [] as AdminPaymentRow[] })),
    ]);
    setStats(dashboard);
    setTrips(Array.isArray(tripResult.items) ? tripResult.items : []);
    setPayments(Array.isArray(paymentResult.items) ? paymentResult.items : []);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live operations overview across riders, drivers, and revenue."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross revenue"
          value={formatCurrency(stats.grossRevenue)}
          hint="Successful payments"
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatCard
          label="Registered users"
          value={String(stats.userCount)}
          hint="From live database"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Drivers online"
          value={String(stats.driverOnline)}
          hint={`${stats.driverTotal} total partners`}
          icon={<CarFront className="h-5 w-5" />}
        />
        <StatCard
          label="Completed trips"
          value={String(stats.completedTrips)}
          hint="Finished rides"
          icon={<Route className="h-5 w-5" />}
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={stats.revenueSeries} />
        </div>
        <CityShareChart data={stats.cityShare} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-panel p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="h-4 w-4 text-admin-teal" /> Recent payments
          </h3>
          {payments.length === 0 ? (
            <p className="text-sm text-admin-muted">No payment records yet.</p>
          ) : (
            <ul className="space-y-3">
              {payments.slice(0, 6).map((payment) => (
                <li key={payment.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-admin-ink">{payment.user}</p>
                    <p className="text-xs text-admin-muted">
                      {(payment.method || '—').toUpperCase()} · {payment.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    <p className="text-xs text-admin-muted">{payment.status}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="admin-panel p-5">
          <h3 className="mb-4 text-sm font-semibold">Live trip feed</h3>
          {trips.length === 0 ? (
            <p className="text-sm text-admin-muted">No ride transactions yet.</p>
          ) : (
            <ul className="space-y-3">
              {trips.slice(0, 6).map((trip) => (
                <li key={trip.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-admin-ink">
                      {trip.pickup} → {trip.dropoff}
                    </p>
                    <p className="text-xs text-admin-muted">
                      {trip.rider} · {trip.driver}
                    </p>
                  </div>
                  <p className="font-semibold text-admin-teal">{trip.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
