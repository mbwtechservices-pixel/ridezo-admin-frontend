import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { adminApi, type AdminUserRow } from '@/shared/api/admin.api';
import type { UserRow } from '@/shared/data/mock';
import { formatShortDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const POLL_MS = 5000;
const col = createColumnHelper<UserRow>();

function toUserRow(user: AdminUserRow): UserRow {
  const status: UserRow['status'] = user.isOnline || user.status === 'active' ? 'active' : 'inactive';
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status,
    trips: user.trips,
    joinedAt: user.joinedAt,
    city: user.city,
    isOnline: status === 'active',
  };
}

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const result = await adminApi.listUsers();
      const items = Array.isArray(result.items) ? result.items : [];
      setRows(items.map(toUserRow));
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load users');
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
      rows.filter((user) => {
        const q = search.toLowerCase();
        return (
          !q ||
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.phone.includes(q) ||
          user.city.toLowerCase().includes(q)
        );
      }),
    [rows, search],
  );

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'User Name' }),
      col.accessor('phone', { header: 'Mobile' }),
      col.accessor('city', { header: 'City' }),
      col.accessor('trips', { header: 'Trips' }),
      col.accessor('joinedAt', {
        header: 'Joined Date',
        cell: (info) => formatShortDate(info.getValue()),
      }),
    ],
    [],
  );

  const exportCols: ExportColumn<UserRow>[] = [
    { header: 'User Name', accessor: (r) => r.name },
    { header: 'Mobile', accessor: (r) => r.phone },
    { header: 'City', accessor: (r) => r.city },
    { header: 'Trips', accessor: (r) => r.trips },
    { header: 'Joined Date', accessor: (r) => formatShortDate(r.joinedAt) },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Registered rider accounts from the live database."
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
        searchPlaceholder="Search name, mobile, city…"
      />
      {loading && rows.length === 0 ? (
        <p className="text-sm text-admin-muted">Loading users…</p>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          globalFilter={search}
          emptyMessage="No registered users yet."
        />
      )}
    </div>
  );
}
