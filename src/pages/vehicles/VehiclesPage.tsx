import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { VEHICLES, type VehicleRow } from '@/shared/data/mock';
import type { ExportColumn } from '@/shared/lib/export';

const col = createColumnHelper<VehicleRow>();

const statusTone = {
  active: 'success',
  inactive: 'neutral',
  maintenance: 'warning',
} as const;

export function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(
    () =>
      VEHICLES.filter((v) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          v.plate.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.driver.toLowerCase().includes(q);
        return (
          matchesSearch &&
          (type === 'all' || v.type === type) &&
          (status === 'all' || v.status === status)
        );
      }),
    [search, type, status],
  );

  const columns = useMemo(
    () => [
      col.accessor('id', { header: 'ID' }),
      col.accessor('plate', { header: 'Plate' }),
      col.accessor('make', { header: 'Make' }),
      col.accessor('model', { header: 'Model' }),
      col.accessor('type', { header: 'Type' }),
      col.accessor('year', { header: 'Year' }),
      col.accessor('driver', { header: 'Driver' }),
      col.accessor('city', { header: 'City' }),
      col.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge label={info.getValue()} tone={statusTone[info.getValue()]} />
        ),
      }),
    ],
    [],
  );

  const exportCols: ExportColumn<VehicleRow>[] = [
    { header: 'ID', accessor: (r) => r.id },
    { header: 'Plate', accessor: (r) => r.plate },
    { header: 'Make', accessor: (r) => r.make },
    { header: 'Model', accessor: (r) => r.model },
    { header: 'Type', accessor: (r) => r.type },
    { header: 'Year', accessor: (r) => r.year },
    { header: 'Driver', accessor: (r) => r.driver },
    { header: 'Status', accessor: (r) => r.status },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Registered fleet inventory and assignment."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-vehicles"
            title="Ridezo Vehicles"
          />
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search plate, make, model, driver…"
        filters={
          <>
            <SelectFilter
              label="Type"
              value={type}
              onChange={setType}
              options={[
                { value: 'all', label: 'All types' },
                { value: 'mini', label: 'Mini' },
                { value: 'sedan', label: 'Sedan' },
                { value: 'suv', label: 'SUV' },
                { value: 'premium', label: 'Premium' },
              ]}
            />
            <SelectFilter
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'maintenance', label: 'Maintenance' },
              ]}
            />
          </>
        }
      />
      <DataTable data={filtered} columns={columns} />
    </div>
  );
}
