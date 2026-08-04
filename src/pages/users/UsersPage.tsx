import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { USERS, type UserRow } from '@/shared/data/mock';
import { formatShortDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const col = createColumnHelper<UserRow>();

const statusTone = {
  active: 'success',
  inactive: 'neutral',
  blocked: 'danger',
} as const;

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(
    () =>
      USERS.filter((u) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.city.toLowerCase().includes(q);
        const matchesStatus = status === 'all' || u.status === status;
        return matchesSearch && matchesStatus;
      }),
    [search, status],
  );

  const columns = useMemo(
    () => [
      col.accessor('id', { header: 'ID' }),
      col.accessor('name', { header: 'Name' }),
      col.accessor('email', { header: 'Email' }),
      col.accessor('phone', { header: 'Phone' }),
      col.accessor('city', { header: 'City' }),
      col.accessor('trips', { header: 'Trips' }),
      col.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge label={info.getValue()} tone={statusTone[info.getValue()]} />
        ),
      }),
      col.accessor('joinedAt', {
        header: 'Joined',
        cell: (info) => formatShortDate(info.getValue()),
      }),
    ],
    [],
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
        description="Manage customer accounts across cities."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-users"
            title="Ridezo Users"
          />
        }
      />
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
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'blocked', label: 'Blocked' },
            ]}
          />
        }
      />
      <DataTable data={filtered} columns={columns} globalFilter={search} />
    </div>
  );
}
