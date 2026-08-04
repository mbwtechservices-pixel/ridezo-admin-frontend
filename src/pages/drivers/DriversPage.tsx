import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminDriverRow } from '@/shared/api/admin.api';
import { formatCurrency, formatShortDate } from '@/shared/lib/cn';

const col = createColumnHelper<AdminDriverRow>();

const verificationTone = {
  approved: 'success',
  pending: 'warning',
  under_review: 'info',
  rejected: 'danger',
} as const;

export function DriversPage() {
  const [rows, setRows] = useState<AdminDriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listDrivers();
      setRows(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateVerification = async (
    id: string,
    status: 'approved' | 'rejected' | 'under_review',
  ) => {
    try {
      await adminApi.updateDriverVerification(id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update driver');
    }
  };

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Driver' }),
      col.accessor('phone', { header: 'Phone' }),
      col.accessor('rating', { header: 'Rating' }),
      col.accessor('totalTrips', { header: 'Trips' }),
      col.accessor('totalEarnings', {
        header: 'Earnings',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      col.accessor('verificationStatus', {
        header: 'Verification',
        cell: (info) => (
          <StatusBadge
            label={info.getValue()}
            tone={verificationTone[info.getValue() as keyof typeof verificationTone] ?? 'neutral'}
          />
        ),
      }),
      col.accessor('joinedAt', {
        header: 'Joined',
        cell: (info) => formatShortDate(info.getValue()),
      }),
      col.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="admin-btn-ghost text-xs text-admin-teal"
              onClick={() => void updateVerification(row.original.id, 'approved')}
            >
              Approve
            </button>
            <button
              type="button"
              className="admin-btn-ghost text-xs"
              onClick={() => void updateVerification(row.original.id, 'under_review')}
            >
              Review
            </button>
            <button
              type="button"
              className="admin-btn-ghost text-xs text-admin-rose"
              onClick={() => void updateVerification(row.original.id, 'rejected')}
            >
              Reject
            </button>
          </div>
        ),
      }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Review partner profiles and approve verification."
      />
      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      {loading ? (
        <p className="text-sm text-admin-muted">Loading drivers…</p>
      ) : (
        <DataTable data={rows} columns={columns} />
      )}
    </div>
  );
}
