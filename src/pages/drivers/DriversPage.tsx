import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminDriverRow } from '@/shared/api/admin.api';
import { formatCurrency, formatShortDate } from '@/shared/lib/cn';

const col = createColumnHelper<AdminDriverRow>();

type BanDuration = '10_days' | '20_days' | '1_month' | '6_months' | '1_year';

const BAN_DURATIONS: { value: BanDuration; label: string }[] = [
  { value: '10_days', label: '10 days' },
  { value: '20_days', label: '20 days' },
  { value: '1_month', label: '1 month' },
  { value: '6_months', label: '6 months' },
  { value: '1_year', label: '1 year' },
];

const verificationTone = {
  approved: 'success',
  pending: 'warning',
  under_review: 'info',
  rejected: 'danger',
} as const;

function displayStatus(row: AdminDriverRow): { label: string; tone: 'success' | 'warning' | 'info' | 'danger' | 'neutral' } {
  if (row.isBanned) {
    return {
      label: row.banDurationLabel ? `banned · ${row.banDurationLabel}` : 'banned',
      tone: 'danger',
    };
  }
  const status = String(row.verificationStatus || 'pending').toLowerCase();
  if (status === 'approved') {
    const live = String(row.status || '').toLowerCase();
    if (live === 'online' || live === 'on_ride' || live === 'busy') {
      return { label: live.replace('_', ' '), tone: 'success' };
    }
    return { label: 'approved', tone: 'success' };
  }
  if (status === 'pending' || status === 'under_review') {
    return { label: 'Pending Verification', tone: 'warning' };
  }
  return {
    label: status,
    tone: verificationTone[status as keyof typeof verificationTone] ?? 'neutral',
  };
}

const POLL_MS = 5000;

export function DriversPage() {
  const [rows, setRows] = useState<AdminDriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banTarget, setBanTarget] = useState<AdminDriverRow | null>(null);
  const [banDuration, setBanDuration] = useState<BanDuration>('10_days');
  const [banReason, setBanReason] = useState('');
  const [banBusy, setBanBusy] = useState(false);
  const [approveTarget, setApproveTarget] = useState<AdminDriverRow | null>(null);
  const [identityConfirmed, setIdentityConfirmed] = useState(false);
  const [approveBusy, setApproveBusy] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const result = await adminApi.listDrivers();
      const items = Array.isArray(result.items) ? result.items : [];
      setRows(items);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load drivers');
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

  const updateVerification = useCallback(async (
    id: string,
    status: 'approved' | 'rejected' | 'under_review',
    extra?: { identityConfirmed?: boolean },
  ) => {
    try {
      await adminApi.updateDriverVerification(id, status, extra);
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update driver');
      return false;
    }
  }, [load]);

  const submitApprove = async () => {
    if (!approveTarget) return;
    if (!approveTarget.documentsVerified) {
      setError(
        'Verify Driving License, Aadhaar Card, Vehicle Insurance, Registration Certificate (RC), and Profile Photo first.',
      );
      return;
    }
    if (!identityConfirmed) {
      setError(
        'Confirm that Driving License, Aadhaar Card, Vehicle Insurance, Registration Certificate (RC), and Profile Photo match this driver before approving.',
      );
      return;
    }
    setApproveBusy(true);
    setError('');
    const ok = await updateVerification(approveTarget.id, 'approved', { identityConfirmed: true });
    if (ok) {
      setApproveTarget(null);
      setIdentityConfirmed(false);
    }
    setApproveBusy(false);
  };

  const submitBan = async () => {
    if (!banTarget) return;
    const reason = banReason.trim();
    if (reason.length < 5) {
      setError('Enter a ban reason (at least 5 characters).');
      return;
    }
    setBanBusy(true);
    setError('');
    try {
      await adminApi.banDriver(banTarget.id, { duration: banDuration, reason });
      setBanTarget(null);
      setBanReason('');
      setBanDuration('10_days');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not ban driver');
    } finally {
      setBanBusy(false);
    }
  };

  const unban = useCallback(async (id: string) => {
    try {
      await adminApi.unbanDriver(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not unban driver');
    }
  }, [load]);

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Driver' }),
      col.accessor('phone', { header: 'Phone' }),
      col.accessor('email', { header: 'Email' }),
      col.accessor('rating', { header: 'Rating' }),
      col.accessor('totalTrips', { header: 'Trips' }),
      col.accessor('totalEarnings', {
        header: 'Earnings',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      col.display({
        id: 'verificationStatus',
        header: 'Status',
        cell: ({ row }) => {
          const shown = displayStatus(row.original);
          return <StatusBadge label={shown.label} tone={shown.tone} />;
        },
      }),
      col.accessor('joinedAt', {
        header: 'Joined',
        cell: (info) => formatShortDate(info.getValue()),
      }),
      col.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const driver = row.original;
          const status = driver.verificationStatus;
          const isApproved = status === 'approved';
          const isRejected = status === 'rejected';

          if (isRejected) {
            return <span className="text-xs text-admin-muted">Permanently rejected</span>;
          }

          if (isApproved) {
            if (driver.isBanned) {
              return (
                <button
                  type="button"
                  className="admin-btn-ghost text-xs text-admin-teal"
                  onClick={() => void unban(driver.id)}
                >
                  Unban
                </button>
              );
            }
            return (
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className="admin-btn-ghost text-xs text-admin-rose"
                  onClick={() => {
                    setBanTarget(driver);
                    setBanReason('');
                    setBanDuration('10_days');
                  }}
                >
                  Ban
                </button>
              </div>
            );
          }

          const uploaded = Boolean(driver.documentsUploaded) || (driver.uploadedDocuments ?? 0) >= 5;
          const verified = Boolean(driver.documentsVerified);
          return (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                className="admin-btn-ghost text-xs text-admin-teal"
                title={
                  uploaded
                    ? 'Approve after verifying all required documents'
                    : 'Driver must upload Driving License, Aadhaar Card, Vehicle Insurance, Registration Certificate (RC), and Profile Photo first'
                }
                onClick={() => {
                  setApproveTarget(driver);
                  setIdentityConfirmed(false);
                  setError('');
                }}
              >
                Approve
              </button>
              <button
                type="button"
                className="admin-btn-ghost text-xs"
                onClick={() => void updateVerification(driver.id, 'under_review')}
              >
                Review
              </button>
              <button
                type="button"
                className="admin-btn-ghost text-xs text-admin-rose"
                onClick={() => void updateVerification(driver.id, 'rejected')}
              >
                Reject
              </button>
              <Link to="/driver-documents" className="admin-btn-ghost text-xs">
                {verified ? 'Documents verified' : `${driver.verifiedDocuments ?? 0}/5 docs`}
              </Link>
            </div>
          );
        },
      }),
    ],
    [unban, updateVerification],
  );

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="New drivers stay in Pending Verification until you verify Driving License, Aadhaar Card, Vehicle Insurance, Registration Certificate (RC), and Profile Photo, then Approve. Ban/Unban is available for approved drivers."
      />
      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      {loading && rows.length === 0 ? (
        <p className="text-sm text-admin-muted">Loading drivers…</p>
      ) : (
        <DataTable data={rows} columns={columns} emptyMessage="No registered drivers yet." />
      )}

      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-admin-ink">Approve {approveTarget.name}</h3>
            <p className="mt-1 text-sm text-admin-muted">
              Review Driving License, Aadhaar Card, Vehicle Insurance, Registration Certificate
              (RC), and Profile Photo. Approve only if the documents match this driver and the RC
              matches the registered vehicle. If they do not match, close this dialog and Reject the
              driver.
            </p>
            <p className="mt-3 text-sm text-admin-ink">
              Documents verified: {approveTarget.verifiedDocuments ?? 0}/5
              {approveTarget.documentsVerified ? ' · ready' : ' · open Driver Documents first'}
            </p>
            <label className="mt-4 flex items-start gap-2 text-sm text-admin-ink">
              <input
                type="checkbox"
                className="mt-1"
                checked={identityConfirmed}
                onChange={(event) => setIdentityConfirmed(event.target.checked)}
              />
              <span>
                I confirm Driving License, Aadhaar Card, Vehicle Insurance, Registration Certificate
                (RC), and Profile Photo match this driver.
              </span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn-ghost"
                disabled={approveBusy}
                onClick={() => {
                  setApproveTarget(null);
                  setIdentityConfirmed(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={approveBusy || !identityConfirmed || !approveTarget.documentsVerified}
                onClick={() => void submitApprove()}
              >
                {approveBusy ? 'Approving…' : 'Confirm Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-admin-ink">Ban {banTarget.name}</h3>
            <p className="mt-1 text-sm text-admin-muted">
              The driver is notified immediately with your reason and ban duration, and cannot go
              online until the ban ends or you unban them.
            </p>

            <label className="mt-4 block text-sm font-medium text-admin-ink">
              Duration
              <select
                className="admin-input mt-1 w-full"
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value as BanDuration)}
              >
                {BAN_DURATIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block text-sm font-medium text-admin-ink">
              Reason
              <textarea
                className="admin-input mt-1 min-h-[96px] w-full"
                placeholder="e.g. inappropriate behavior toward a user"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </label>

            <p className="mt-2 text-xs text-admin-muted">
              Preview: You were banned for{' '}
              {banReason.trim() || '…'}. Duration:{' '}
              {BAN_DURATIONS.find((d) => d.value === banDuration)?.label}.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn-ghost"
                disabled={banBusy}
                onClick={() => setBanTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={banBusy}
                onClick={() => void submitBan()}
              >
                {banBusy ? 'Banning…' : 'Confirm ban'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
