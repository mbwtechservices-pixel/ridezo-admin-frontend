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
import { CITY_SHARE, REVENUE_SERIES, TRIPS, PAYMENTS, DRIVERS, USERS } from '@/shared/data/mock';
import { formatCurrency } from '@/shared/lib/cn';

export function DashboardPage() {
  const revenue = PAYMENTS.filter((p) => p.status === 'success').reduce(
    (sum, p) => sum + p.amount,
    0,
  );
  const completed = TRIPS.filter((t) => t.status === 'completed').length;
  const onlineDrivers = DRIVERS.filter((d) => d.status === 'online' || d.status === 'busy').length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live operations overview across riders, drivers, and revenue."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Gross revenue"
          value={formatCurrency(revenue)}
          trend="+12.4%"
          hint="vs last week"
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatCard
          label="Active users"
          value={String(USERS.filter((u) => u.status === 'active').length)}
          hint={`${USERS.length} total registered`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Drivers online"
          value={String(onlineDrivers)}
          hint={`${DRIVERS.length} total partners`}
          icon={<CarFront className="h-5 w-5" />}
        />
        <StatCard
          label="Completed trips"
          value={String(completed)}
          hint={`${TRIPS.length} in sample window`}
          icon={<Route className="h-5 w-5" />}
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={REVENUE_SERIES} />
        </div>
        <CityShareChart data={CITY_SHARE} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-panel p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="h-4 w-4 text-admin-teal" /> Recent payments
          </h3>
          <ul className="space-y-3">
            {PAYMENTS.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-admin-ink">{p.user}</p>
                  <p className="text-xs text-admin-muted">{p.method.toUpperCase()} · {p.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(p.amount)}</p>
                  <p className="text-xs capitalize text-admin-muted">{p.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="admin-panel p-5">
          <h3 className="mb-4 text-sm font-semibold">Live trip feed</h3>
          <ul className="space-y-3">
            {TRIPS.filter((t) => t.status === 'ongoing' || t.status === 'completed')
              .slice(0, 6)
              .map((t) => (
                <li key={t.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-admin-ink">
                      {t.pickup} → {t.dropoff}
                    </p>
                    <p className="text-xs text-admin-muted">
                      {t.rider} · {t.driver}
                    </p>
                  </div>
                  <p className="font-semibold capitalize text-admin-teal">{t.status}</p>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
