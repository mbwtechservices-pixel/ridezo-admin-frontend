import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { ROLES, type RoleRow } from '@/shared/data/mock';
import { formatDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const col = createColumnHelper<RoleRow>();

export function RolesPage() {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      ROLES.filter((r) => {
        const q = search.toLowerCase();
        return (
          !q ||
          r.name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      }),
    [search],
  );

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Role' }),
      col.accessor('slug', { header: 'Slug' }),
      col.accessor('description', { header: 'Description' }),
      col.accessor('users', { header: 'Users' }),
      col.accessor('permissions', { header: 'Permissions' }),
      col.accessor('updatedAt', {
        header: 'Updated',
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [],
  );

  const exportCols: ExportColumn<RoleRow>[] = [
    { header: 'Name', accessor: (r) => r.name },
    { header: 'Slug', accessor: (r) => r.slug },
    { header: 'Users', accessor: (r) => r.users },
    { header: 'Permissions', accessor: (r) => r.permissions },
    { header: 'Description', accessor: (r) => r.description },
  ];

  return (
    <div>
      <PageHeader
        title="Roles"
        description="RBAC role definitions assigned to admin users."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-roles"
            title="Ridezo Roles"
          />
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search roles…"
      />
      <DataTable data={filtered} columns={columns} />
    </div>
  );
}
