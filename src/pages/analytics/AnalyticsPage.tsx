import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { CityShareChart, FunnelChart, RevenueChart } from '@/components/charts/Charts';
import {
  CITY_SHARE,
  FUNNEL,
  PAYMENTS,
  REVENUE_SERIES,
  TRIPS,
  USERS,
  DRIVERS,
} from '@/shared/data/mock';
import { formatCurrency } from '@/shared/lib/cn';
import { ExportButtons } from '@/components/ui/ExportButtons';
import type { ExportColumn } from '@/shared/lib/export';

export function AnalyticsPage() {
  const successPayments = PAYMENTS.filter((p) => p.status === 'success');
  const gmv = successPayments.reduce((s, p) => s + p.amount, 0);
  const cancelRate = Math.round(
    (TRIPS.filter((t) => t.status === 'cancelled').length / TRIPS.length) * 100,
  );

  const exportRows = REVENUE_SERIES;
  const exportCols: ExportColumn<(typeof REVENUE_SERIES)[number]>[] = [
    { header: 'Day', accessor: (r) => r.label },
    { header: 'Revenue', accessor: (r) => r.revenue },
    { header: 'Trips', accessor: (r) => r.trips },
  ];

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Demand, conversion, and revenue performance."
        actions={
          <ExportButtons
            rows={exportRows}
            columns={exportCols}
            filename="ridezo-analytics-weekly"
            title="Ridezo Weekly Analytics"
          />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="GMV" value={formatCurrency(gmv)} hint="Successful payments" />
        <StatCard label="Avg trip fare" value={formatCurrency(Math.round(gmv / Math.max(successPayments.length, 1)))} />
        <StatCard label="Cancel rate" value={`${cancelRate}%`} hint="Sample period" />
        <StatCard
          label="Supply ratio"
          value={`${Math.round((DRIVERS.length / Math.max(USERS.length, 1)) * 100)}%`}
          hint="Drivers vs users"
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart data={REVENUE_SERIES} />
        </div>
        <CityShareChart data={CITY_SHARE} />
      </div>

      <FunnelChart data={FUNNEL} />
    </div>
  );
}
