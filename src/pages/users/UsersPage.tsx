import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminUserRow } from '@/shared/api/admin.api';
import { USERS, type UserRow } from '@/shared/data/mock';
import { formatShortDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const POLL_MS = 5000;
const col = createColumnHelper<UserRow>();

const statusTone = {
  active: 'success',
  inactive: 'neutral',
  blocked: 'danger',
} as const;

function toUserRow(user: AdminUserRow): UserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    trips: user.trips,
    joinedAt: user.joinedAt,
    city: user.city,
    isDemo: false,
    isOnline: user.isOnline,
  };
}

function statusLabel(row: UserRow): string {
  if (row.status === 'blocked') return 'Blocked';
  if (row.status === 'active') return 'Active';
  return 'Inactive';
}

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [realUsers, setRealUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await adminApi.listUsers();
      setRealUsers(result.items.map(toUserRow));
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load users');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const rows = useMemo(() => {
    const demoRows: UserRow[] = USERS.map((user) => ({ ...user, isDemo: true }));
    const realIds = new Set(realUsers.map((user) => user.id));
    return [...realUsers, ...demoRows.filter((user) => !realIds.has(user.id))];
  }, [realUsers]);

  const filtered = useMemo(
    () =>
      rows.filter((user) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.phone.includes(q) ||
          user.city.toLowerCase().includes(q);
        const matchesStatus = status === 'all' || user.status === status;
        return matchesSearch && matchesStatus;
      }),
    [rows, search, status],
  );

  const applyStatusUpdate = useCallback(async (id: string, nextStatus: 'active' | 'blocked') => {
    setUpdatingId(id);
    setError('');
    try {
      const updated = await adminApi.updateUserStatus(id, nextStatus);
      setRealUsers((current) => {
        const next = toUserRow(updated);
        const exists = current.some((user) => user.id === id);
        if (exists) return current.map((user) => (user.id === id ? next : user));
        return [next, ...current];
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : nextStatus === 'blocked'
            ? 'Could not block user'
            : 'Could not unblock user',
      );
    } finally {
      setUpdatingId(null);
    }
  }, []);

  const blockUser = useCallback(
    async (id: string, name: string) => {
      const confirmed = window.confirm(
        `Block ${name}? They will not be able to sign in until you unblock them.`,
      );
      if (!confirmed) return;
      await applyStatusUpdate(id, 'blocked');
    },
    [applyStatusUpdate],
  );

  const unblockUser = useCallback(
    async (id: string) => {
      await applyStatusUpdate(id, 'active');
    },
    [applyStatusUpdate],
  );

  const columns = useMemo(
    () => [
      col.accessor('id', {
        header: 'ID',
        cell: (info) => (
          <span className="font-mono text-xs text-admin-muted">{info.getValue()}</span>
        ),
      }),
      col.accessor('name', {
        header: 'Name',
        cell: ({ row, getValue }) => (
          <div className="flex flex-col">
            <span>{getValue()}</span>
            {row.original.isDemo ? (
              <span className="text-[10px] uppercase tracking-wide text-admin-muted">Demo</span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide text-admin-teal">Live</span>
            )}
          </div>
        ),
      }),
      col.accessor('email', { header: 'Email' }),
      col.accessor('phone', { header: 'Phone' }),
      col.accessor('city', { header: 'City' }),
      col.accessor('trips', { header: 'Trips' }),
      col.accessor('status', {
        header: 'Status',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <StatusBadge
              label={statusLabel(row.original)}
              tone={statusTone[row.original.status]}
            />
            {!row.original.isDemo && row.original.isOnline && row.original.status !== 'blocked' ? (
              <span className="text-[10px] font-medium text-admin-teal">Online now</span>
            ) : null}
          </div>
        ),
      }),
      col.accessor('joinedAt', {
        header: 'Joined',
        cell: (info) => formatShortDate(info.getValue()),
      }),
      col.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          if (row.original.isDemo) return <span className="text-xs text-admin-muted">—</span>;

          const busy = updatingId === row.original.id;

          if (row.original.status === 'blocked') {
            return (
              <button
                type="button"
                className="admin-btn-ghost text-xs text-admin-teal"
                disabled={busy}
                onClick={() => void unblockUser(row.original.id)}
              >
                {busy ? 'Unblocking…' : 'Unblock'}
              </button>
            );
          }

          return (
            <button
              type="button"
              className="admin-btn-ghost text-xs text-admin-rose"
              disabled={busy}
              onClick={() => void blockUser(row.original.id, row.original.name)}
            >
              {busy ? 'Blocking…' : 'Block'}
            </button>
          );
        },
      }),
    ],
    [updatingId, blockUser, unblockUser],
  );

  const exportCols: ExportColumn<UserRow>[] = [
    { header: 'ID', accessor: (r) => r.id },
    { header: 'Name', accessor: (r) => r.name },
    { header: 'Email', accessor: (r) => r.email },
    { header: 'Phone', accessor: (r) => r.phone },
    { header: 'City', accessor: (r) => r.city },
    { header: 'Trips', accessor: (r) => r.trips },
    { header: 'Status', accessor: (r) => r.status },
    { header: 'Joined', accessor: (r) => formatShortDate(r.joinedAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Demo accounts stay for reference. New rider signups appear here automatically."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-users"
            title="Ridezo Users"
          />
        }
      />
      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, email, phone, city…"
        filters={
          <SelectFilter
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active (online)' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'blocked', label: 'Blocked' },
            ]}
          />
        }
      />
      {loading && realUsers.length === 0 ? (
        <p className="text-sm text-admin-muted">Loading users…</p>
      ) : (
        <DataTable data={filtered} columns={columns} globalFilter={search} />
      )}
    </div>
  );
}
