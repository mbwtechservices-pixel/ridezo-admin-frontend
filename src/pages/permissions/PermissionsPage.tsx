import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { PERMISSIONS, type PermissionRow } from '@/shared/data/mock';
import type { ExportColumn } from '@/shared/lib/export';

const col = createColumnHelper<PermissionRow>();

export function PermissionsPage() {
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('all');

  const modules = useMemo(
    () => ['all', ...Array.from(new Set(PERMISSIONS.map((p) => p.module)))],
    [],
  );

  const filtered = useMemo(
    () =>
      PERMISSIONS.filter((p) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q);
        return matchesSearch && (module === 'all' || p.module === module);
      }),
    [search, module],
  );

  const columns = useMemo(
    () => [
      col.accessor('slug', { header: 'Slug' }),
      col.accessor('name', { header: 'Name' }),
      col.accessor('module', { header: 'Module' }),
      col.accessor('description', { header: 'Description' }),
    ],
    [],
  );

  const exportCols: ExportColumn<PermissionRow>[] = [
    { header: 'Slug', accessor: (r) => r.slug },
    { header: 'Name', accessor: (r) => r.name },
    { header: 'Module', accessor: (r) => r.module },
    { header: 'Description', accessor: (r) => r.description },
  ];

  return (
    <div>
      <PageHeader
        title="Permissions"
        description="Fine-grained capability catalog for roles."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-permissions"
            title="Ridezo Permissions"
          />
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search permissions…"
        filters={
          <SelectFilter
            label="Module"
            value={module}
            onChange={setModule}
            options={modules.map((m) => ({
              value: m,
              label: m === 'all' ? 'All modules' : m,
            }))}
          />
        }
      />
      <DataTable data={filtered} columns={columns} />
    </div>
  );
}
