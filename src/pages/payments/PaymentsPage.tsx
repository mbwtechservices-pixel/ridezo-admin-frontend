import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminPaymentRow } from '@/shared/api/admin.api';
import { formatCurrency, formatDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const POLL_MS = 5000;
const col = createColumnHelper<AdminPaymentRow>();

const statusTone = {
  SUCCESS: 'success',
  FAILED: 'danger',
  REFUND: 'warning',
  PENDING: 'info',
} as const;

export function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const result = await adminApi.listPayments();
      setRows(Array.isArray(result.items) ? result.items : []);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load payments');
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
      rows.filter((payment) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          payment.id.toLowerCase().includes(q) ||
          payment.tripId.toLowerCase().includes(q) ||
          payment.rideId.toLowerCase().includes(q) ||
          payment.user.toLowerCase().includes(q) ||
          payment.driver.toLowerCase().includes(q) ||
          payment.transactionId.toLowerCase().includes(q) ||
          (payment.userPhone ?? '').includes(search);
        const matchesMethod =
          method === 'all' || payment.method.toLowerCase() === method.toLowerCase();
        return matchesSearch && (status === 'all' || payment.status === status) && matchesMethod;
      }),
    [rows, search, status, method],
  );

  const columns = useMemo(
    () => [
      col.accessor('id', {
        header: 'Payment ID',
        cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
      }),
      col.accessor('tripId', {
        header: 'Trip / Ride',
        cell: ({ row }) => row.original.tripId || row.original.rideId || '—',
      }),
      col.accessor('user', { header: 'User' }),
      col.accessor('driver', { header: 'Driver' }),
      col.accessor('method', {
        header: 'Method',
        cell: (info) => (info.getValue() || '—').toUpperCase(),
      }),
      col.accessor('amount', {
        header: 'Amount',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      col.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge label={info.getValue()} tone={statusTone[info.getValue()]} />
        ),
      }),
      col.accessor('transactionId', {
        header: 'Transaction',
        cell: (info) => info.getValue() || '—',
      }),
      col.accessor('createdAt', {
        header: 'Date / Time',
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [],
  );

  const exportCols: ExportColumn<AdminPaymentRow>[] = [
    { header: 'Payment ID', accessor: (r) => r.id },
    { header: 'Trip', accessor: (r) => r.tripId },
    { header: 'Ride', accessor: (r) => r.rideId },
    { header: 'User', accessor: (r) => r.user },
    { header: 'User Mobile', accessor: (r) => r.userPhone ?? '' },
    { header: 'Driver', accessor: (r) => r.driver },
    { header: 'Method', accessor: (r) => r.method },
    { header: 'Amount', accessor: (r) => r.amount },
    { header: 'Status', accessor: (r) => r.status },
    { header: 'Transaction', accessor: (r) => r.transactionId },
    { header: 'Date / Time', accessor: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Live payment records from the database. Status is Success, Failed, Refund, or Pending."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-payments"
            title="Ridezo Payments"
          />
        }
      />
      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payment, trip, user, transaction…"
        filters={
          <>
            <SelectFilter
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'SUCCESS', label: 'Success' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'REFUND', label: 'Refund' },
                { value: 'PENDING', label: 'Pending' },
              ]}
            />
            <SelectFilter
              label="Method"
              value={method}
              onChange={setMethod}
              options={[
                { value: 'all', label: 'All methods' },
                { value: 'upi', label: 'UPI' },
                { value: 'card', label: 'Card' },
                { value: 'wallet', label: 'Wallet' },
                { value: 'cash', label: 'Cash' },
              ]}
            />
          </>
        }
      />
      {loading && rows.length === 0 ? (
        <p className="text-sm text-admin-muted">Loading payments…</p>
      ) : (
        <DataTable data={filtered} columns={columns} emptyMessage="No payment records yet." />
      )}
    </div>
  );
}
