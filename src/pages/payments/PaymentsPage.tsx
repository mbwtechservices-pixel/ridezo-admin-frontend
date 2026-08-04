import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { PAYMENTS, type PaymentRow } from '@/shared/data/mock';
import { formatCurrency, formatDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const col = createColumnHelper<PaymentRow>();

const statusTone = {
  success: 'success',
  failed: 'danger',
  refunded: 'warning',
  pending: 'info',
} as const;

export function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');

  const filtered = useMemo(
    () =>
      PAYMENTS.filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          p.id.toLowerCase().includes(q) ||
          p.tripId.toLowerCase().includes(q) ||
          p.user.toLowerCase().includes(q);
        return (
          matchesSearch &&
          (status === 'all' || p.status === status) &&
          (method === 'all' || p.method === method)
        );
      }),
    [search, status, method],
  );

  const columns = useMemo(
    () => [
      col.accessor('id', { header: 'Payment ID' }),
      col.accessor('tripId', { header: 'Trip' }),
      col.accessor('user', { header: 'User' }),
      col.accessor('method', {
        header: 'Method',
        cell: (info) => info.getValue().toUpperCase(),
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
      col.accessor('createdAt', {
        header: 'Created',
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [],
  );

  const exportCols: ExportColumn<PaymentRow>[] = [
    { header: 'Payment ID', accessor: (r) => r.id },
    { header: 'Trip', accessor: (r) => r.tripId },
    { header: 'User', accessor: (r) => r.user },
    { header: 'Method', accessor: (r) => r.method },
    { header: 'Amount', accessor: (r) => r.amount },
    { header: 'Status', accessor: (r) => r.status },
    { header: 'Created', accessor: (r) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Collections, refunds, and settlement status."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-payments"
            title="Ridezo Payments"
          />
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search payment, trip, user…"
        filters={
          <>
            <SelectFilter
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'success', label: 'Success' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
                { value: 'refunded', label: 'Refunded' },
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
      <DataTable data={filtered} columns={columns} />
    </div>
  );
}
