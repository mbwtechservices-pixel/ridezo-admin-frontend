import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminTripRow } from '@/shared/api/admin.api';
import { formatCurrency, formatDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const POLL_MS = 5000;
const col = createColumnHelper<AdminTripRow>();

const statusTone = {
  ONGOING: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
} as const;

export function TripsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [rows, setRows] = useState<AdminTripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const result = await adminApi.listTrips();
      setRows(Array.isArray(result.items) ? result.items : []);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load trips');
        setRows([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  const filtered = useMemo(
    () =>
      rows.filter((trip) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          trip.id.toLowerCase().includes(q) ||
          trip.rideId.toLowerCase().includes(q) ||
          trip.rider.toLowerCase().includes(q) ||
          trip.driver.toLowerCase().includes(q) ||
          trip.pickup.toLowerCase().includes(q) ||
          trip.dropoff.toLowerCase().includes(q) ||
          (trip.riderPhone ?? '').includes(search) ||
          (trip.driverPhone ?? '').includes(search);
        return matchesSearch && (status === 'all' || trip.status === status);
      }),
    [rows, search, status],
  );

  const columns = useMemo(
    () => [
      col.accessor('id', {
        header: 'Trip ID',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      col.accessor('rider', { header: 'User' }),
      col.accessor('driver', { header: 'Driver' }),
      col.accessor('pickup', { header: 'Pickup' }),
      col.accessor('dropoff', { header: 'Dropoff' }),
      col.accessor('distanceKm', { header: 'Km' }),
      col.accessor('fare', {
        header: 'Amount',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      col.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge label={info.getValue()} tone={statusTone[info.getValue()]} />
        ),
      }),
      col.accessor('createdAt', {
        header: 'Date / Time',
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [],
  );

  const exportCols: ExportColumn<AdminTripRow>[] = [
    { header: 'Trip ID', accessor: (r) => r.id },
    { header: 'Ride ID', accessor: (r) => r.rideId },
    { header: 'User', accessor: (r) => r.rider },
    { header: 'User Mobile', accessor: (r) => r.riderPhone ?? '' },
    { header: 'Driver', accessor: (r) => r.driver },
    { header: 'Driver Mobile', accessor: (r) => r.driverPhone ?? '' },
    { header: 'Pickup', accessor: (r) => r.pickup },
    { header: 'Dropoff', accessor: (r) => r.dropoff },
    { header: 'Distance', accessor: (r) => r.distanceKm },
    { header: 'Amount', accessor: (r) => r.fare },
    { header: 'Status', accessor: (r) => r.status },
    { header: 'Date / Time', accessor: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Trips"
        description="Live ride transactions from the database. Status is Ongoing, Completed, or Cancelled."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-trips"
            title="Ridezo Trips"
          />
        }
      />
      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search trip, user, driver, places…"
        filters={
          <SelectFilter
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'ONGOING', label: 'Ongoing' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
          />
        }
      />
      {loading && rows.length === 0 ? (
        <p className="text-sm text-admin-muted">Loading trips…</p>
      ) : (
        <DataTable data={filtered} columns={columns} emptyMessage="No ride transactions yet." />
      )}
    </div>
  );
}
