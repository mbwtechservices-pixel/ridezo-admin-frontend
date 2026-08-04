import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { TRIPS, type TripRow } from '@/shared/data/mock';
import { formatCurrency, formatDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const col = createColumnHelper<TripRow>();

const statusTone = {
  completed: 'success',
  cancelled: 'danger',
  ongoing: 'info',
  scheduled: 'warning',
} as const;

export function TripsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(
    () =>
      TRIPS.filter((t) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          t.id.toLowerCase().includes(q) ||
          t.rider.toLowerCase().includes(q) ||
          t.driver.toLowerCase().includes(q) ||
          t.pickup.toLowerCase().includes(q) ||
          t.dropoff.toLowerCase().includes(q);
        return matchesSearch && (status === 'all' || t.status === status);
      }),
    [search, status],
  );

  const columns = useMemo(
    () => [
      col.accessor('id', { header: 'Trip ID' }),
      col.accessor('rider', { header: 'Rider' }),
      col.accessor('driver', { header: 'Driver' }),
      col.accessor('pickup', { header: 'Pickup' }),
      col.accessor('dropoff', { header: 'Dropoff' }),
      col.accessor('distanceKm', { header: 'Km' }),
      col.accessor('fare', {
        header: 'Fare',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      col.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge label={info.getValue()} tone={statusTone[info.getValue()]} />
        ),
      }),
      col.accessor('createdAt', {
        header: 'Created',
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [],
  );

  const exportCols: ExportColumn<TripRow>[] = [
    { header: 'Trip ID', accessor: (r) => r.id },
    { header: 'Rider', accessor: (r) => r.rider },
    { header: 'Driver', accessor: (r) => r.driver },
    { header: 'Pickup', accessor: (r) => r.pickup },
    { header: 'Dropoff', accessor: (r) => r.dropoff },
    { header: 'Distance', accessor: (r) => r.distanceKm },
    { header: 'Fare', accessor: (r) => r.fare },
    { header: 'Status', accessor: (r) => r.status },
    { header: 'Created', accessor: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Trips"
        description="Monitor booking lifecycle across the network."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-trips"
            title="Ridezo Trips"
          />
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search trip, rider, driver, places…"
        filters={
          <SelectFilter
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'completed', label: 'Completed' },
              { value: 'ongoing', label: 'Ongoing' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        }
      />
      <DataTable data={filtered} columns={columns} />
    </div>
  );
}
