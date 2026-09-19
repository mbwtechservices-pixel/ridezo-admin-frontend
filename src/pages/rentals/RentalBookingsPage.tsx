import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import {
  adminApi,
  type AdminRentalBookingRow,
  type AdminRentalCancellationPreview,
} from '@/shared/api/admin.api';
import { formatCurrency, formatDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const POLL_MS = 5000;
const col = createColumnHelper<AdminRentalBookingRow>();

const bookingTone = {
  PENDING: 'info',
  CONFIRMED: 'success',
  ACTIVE: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
} as const;

const paymentTone = {
  PENDING: 'info',
  SUCCESS: 'success',
  FAILED: 'danger',
  REFUND: 'warning',
} as const;

export function RentalBookingsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [rows, setRows] = useState<AdminRentalBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [cancelTarget, setCancelTarget] = useState<AdminRentalBookingRow | null>(null);
  const [preview, setPreview] = useState<AdminRentalCancellationPreview | null>(null);
  const [reason, setReason] = useState('Cancelled by admin');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const result = await adminApi.listRentalBookings();
      setRows(Array.isArray(result.items) ? result.items : []);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load rental bookings');
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
      rows.filter((row) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          row.id.toLowerCase().includes(q) ||
          row.userName.toLowerCase().includes(q) ||
          row.userEmail.toLowerCase().includes(q) ||
          row.userPhone.includes(search) ||
          row.carName.toLowerCase().includes(q) ||
          row.pickupLocation.toLowerCase().includes(q);
        return (
          matchesSearch &&
          (status === 'all' || row.status === status) &&
          (paymentStatus === 'all' || row.paymentStatus === paymentStatus)
        );
      }),
    [rows, search, status, paymentStatus],
  );

  const openCancel = useCallback(async (row: AdminRentalBookingRow) => {
    setCancelTarget(row);
    setReason('Cancelled by admin');
    setPreview(null);
    setError('');
    try {
      setPreview(await adminApi.previewRentalCancellation(row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load cancellation details');
    }
  }, []);

  const confirmCancel = useCallback(async () => {
    if (!cancelTarget) return;
    setBusyId(cancelTarget.id);
    setError('');
    try {
      await adminApi.cancelRentalBooking(cancelTarget.id, { reason: reason.trim() || 'Cancelled by admin' });
      setCancelTarget(null);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not cancel booking');
    } finally {
      setBusyId('');
    }
  }, [cancelTarget, reason, load]);

  const processRefund = useCallback(async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      await adminApi.refundRentalBooking(id, { reason: 'Admin processed rental refund' });
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not process refund');
    } finally {
      setBusyId('');
    }
  }, [load]);

  const columns = useMemo(
    () => [
      col.accessor('userName', {
        header: 'User',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.userName}</p>
            <p className="text-xs text-admin-muted">{row.original.userPhone || row.original.userEmail}</p>
          </div>
        ),
      }),
      col.accessor('carName', { header: 'Car' }),
      col.accessor('pickupLocation', { header: 'Pickup location' }),
      col.accessor('createdAt', {
        header: 'Booking date',
        cell: (info) => formatDate(info.row.original.bookingDate || info.getValue()),
      }),
      col.accessor('durationDays', {
        header: 'Duration',
        cell: ({ row }) =>
          `${row.original.durationDays} day${row.original.durationDays === 1 ? '' : 's'} (${row.original.startDate} → ${row.original.endDate})`,
      }),
      col.accessor('totalAmount', {
        header: 'Original',
        cell: ({ row }) => formatCurrency(row.original.originalAmount ?? row.original.totalAmount),
      }),
      col.accessor('refundableAmount', {
        header: 'Refundable',
        cell: (info) => formatCurrency(info.getValue() ?? 0),
      }),
      col.accessor('paymentStatus', {
        header: 'Payment',
        cell: (info) => (
          <StatusBadge
            label={info.getValue()}
            tone={paymentTone[info.getValue() as keyof typeof paymentTone] ?? 'neutral'}
          />
        ),
      }),
      col.accessor('refundStatus', {
        header: 'Refund',
        cell: (info) => (
          <StatusBadge
            label={info.getValue() || 'PENDING'}
            tone={paymentTone[(info.getValue() || 'PENDING') as keyof typeof paymentTone] ?? 'neutral'}
          />
        ),
      }),
      col.accessor('status', {
        header: 'Booking',
        cell: (info) => (
          <StatusBadge
            label={info.getValue()}
            tone={bookingTone[info.getValue() as keyof typeof bookingTone] ?? 'neutral'}
          />
        ),
      }),
      col.accessor('cancelledBy', {
        header: 'Cancelled by',
        cell: ({ row }) => {
          if (row.original.status !== 'CANCELLED') return '—';
          return (
            <div>
              <p>{row.original.cancelledBy || '—'}</p>
              <p className="text-xs text-admin-muted">
                {row.original.cancelledAt ? formatDate(row.original.cancelledAt) : ''}
              </p>
              {row.original.cancellationReason ? (
                <p className="text-xs text-admin-muted">{row.original.cancellationReason}</p>
              ) : null}
            </div>
          );
        },
      }),
      col.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const booking = row.original;
          const refundDue =
            booking.status === 'CANCELLED' &&
            (booking.refundableAmount ?? 0) > (booking.refundedAmount ?? 0) &&
            booking.refundStatus !== 'SUCCESS';
          return (
            <div className="flex flex-col items-end gap-1">
              {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-admin-rose disabled:opacity-50"
                  disabled={busyId === booking.id}
                  onClick={() => void openCancel(booking)}
                >
                  Cancel
                </button>
              ) : null}
              {refundDue ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-admin-teal disabled:opacity-50"
                  disabled={busyId === booking.id}
                  onClick={() => void processRefund(booking.id)}
                >
                  Process refund
                </button>
              ) : null}
            </div>
          );
        },
      }),
    ],
    [busyId, openCancel, processRefund],
  );

  const exportCols: ExportColumn<AdminRentalBookingRow>[] = [
    { header: 'User', accessor: (r) => r.userName },
    { header: 'Phone', accessor: (r) => r.userPhone },
    { header: 'Email', accessor: (r) => r.userEmail },
    { header: 'Car', accessor: (r) => r.carName },
    { header: 'Pickup location', accessor: (r) => r.pickupLocation },
    { header: 'Booking date', accessor: (r) => formatDate(r.bookingDate || r.createdAt) },
    { header: 'Duration', accessor: (r) => r.durationDays },
    { header: 'Original amount', accessor: (r) => r.originalAmount ?? r.totalAmount },
    { header: 'Refundable', accessor: (r) => r.refundableAmount ?? 0 },
    { header: 'Payment status', accessor: (r) => r.paymentStatus },
    { header: 'Refund status', accessor: (r) => r.refundStatus ?? '' },
    { header: 'Booking status', accessor: (r) => r.status },
    { header: 'Cancelled by', accessor: (r) => r.cancelledBy ?? '' },
    { header: 'Cancellation reason', accessor: (r) => r.cancellationReason ?? '' },
    { header: 'Cancellation time', accessor: (r) => (r.cancelledAt ? formatDate(r.cancelledAt) : '') },
  ];

  return (
    <div>
      <PageHeader
        title="Rental Bookings"
        description="Live rental bookings, cancellations, and refunds from the database."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-rental-bookings"
            title="Ridezo Rental Bookings"
          />
        }
      />
      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      {cancelTarget ? (
        <section className="admin-panel mb-4 p-5">
          <h2 className="text-sm font-semibold text-admin-ink">Cancel {cancelTarget.carName}</h2>
          <p className="mt-1 text-sm text-admin-muted">
            Original amount {formatCurrency(preview?.originalAmount ?? cancelTarget.totalAmount)}. Refundable{' '}
            {formatCurrency(preview?.refundableAmount ?? 0)}.
          </p>
          {preview?.policyNote ? <p className="mt-1 text-xs text-admin-muted">{preview.policyNote}</p> : null}
          <label className="mt-3 block">
            <span className="mb-1.5 block text-sm font-medium text-admin-muted">Cancellation reason</span>
            <input
              className="admin-input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
          <div className="mt-3 flex gap-2">
            <button type="button" className="admin-btn-primary" disabled={Boolean(busyId)} onClick={() => void confirmCancel()}>
              Confirm cancel
            </button>
            <button type="button" className="text-sm text-admin-muted" onClick={() => setCancelTarget(null)}>
              Close
            </button>
          </div>
        </section>
      ) : null}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search user, car, pickup…"
        filters={
          <>
            <SelectFilter
              label="Booking"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All bookings' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
            <SelectFilter
              label="Payment"
              value={paymentStatus}
              onChange={setPaymentStatus}
              options={[
                { value: 'all', label: 'All payments' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'SUCCESS', label: 'Success' },
                { value: 'FAILED', label: 'Failed' },
                { value: 'REFUND', label: 'Refund' },
              ]}
            />
          </>
        }
      />
      {loading && rows.length === 0 ? (
        <p className="text-sm text-admin-muted">Loading rental bookings…</p>
      ) : (
        <DataTable data={filtered} columns={columns} emptyMessage="No rental bookings yet." />
      )}
    </div>
  );
}
