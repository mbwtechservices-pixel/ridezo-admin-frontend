import { createColumnHelper } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminVehicleRow } from '@/shared/api/admin.api';
import { VEHICLES, type VehicleRow } from '@/shared/data/mock';
import type { ExportColumn } from '@/shared/lib/export';

const POLL_MS = 5000;
const col = createColumnHelper<VehicleRow>();

const statusTone = {
  active: 'success',
  inactive: 'neutral',
  maintenance: 'warning',
} as const;

function toVehicleRow(vehicle: AdminVehicleRow): VehicleRow {
  return {
    id: vehicle.id,
    plate: vehicle.plate,
    make: vehicle.make,
    model: vehicle.model,
    type: vehicle.type,
    driver: vehicle.driver,
    driverPhone: vehicle.driverPhone,
    status: vehicle.status,
    year: vehicle.year,
    city: vehicle.city,
    isDemo: false,
  };
}

export function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [realVehicles, setRealVehicles] = useState<VehicleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const result = await adminApi.listVehicles();
      setRealVehicles(result.items.map(toVehicleRow));
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load vehicles');
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
    const demoRows: VehicleRow[] = VEHICLES.map((vehicle) => ({ ...vehicle, isDemo: true }));
    const realIds = new Set(realVehicles.map((vehicle) => vehicle.id));
    return [...realVehicles, ...demoRows.filter((vehicle) => !realIds.has(vehicle.id))];
  }, [realVehicles]);

  const filtered = useMemo(
    () =>
      rows.filter((vehicle) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          vehicle.plate.toLowerCase().includes(q) ||
          vehicle.make.toLowerCase().includes(q) ||
          vehicle.model.toLowerCase().includes(q) ||
          vehicle.driver.toLowerCase().includes(q) ||
          (vehicle.driverPhone ?? '').includes(q) ||
          vehicle.city.toLowerCase().includes(q);
        return (
          matchesSearch &&
          (type === 'all' || vehicle.type === type) &&
          (status === 'all' || vehicle.status === status)
        );
      }),
    [rows, search, type, status],
  );

  const columns = useMemo(
    () => [
      col.accessor('id', {
        header: 'ID',
        cell: (info) => (
          <span className="font-mono text-xs text-admin-muted">{info.getValue()}</span>
        ),
      }),
      col.accessor('plate', { header: 'Plate' }),
      col.accessor('make', { header: 'Make' }),
      col.accessor('model', { header: 'Model' }),
      col.accessor('type', {
        header: 'Type',
        cell: ({ getValue }) => getValue().toUpperCase(),
      }),
      col.accessor('year', { header: 'Year' }),
      col.accessor('driver', {
        header: 'Driver',
        cell: ({ row, getValue }) => (
          <div className="flex flex-col">
            <span>{getValue()}</span>
            {row.original.driverPhone ? (
              <span className="text-xs text-admin-muted">{row.original.driverPhone}</span>
            ) : null}
            {row.original.isDemo ? (
              <span className="text-[10px] uppercase tracking-wide text-admin-muted">Demo</span>
            ) : (
              <span className="text-[10px] uppercase tracking-wide text-admin-teal">Live</span>
            )}
          </div>
        ),
      }),
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
        description="Live driver registrations appear at the top. Demo fleet data stays below for reference."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-vehicles"
            title="Ridezo Vehicles"
          />
        }
      />
      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
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
                { value: 'bike', label: 'Bike' },
                { value: 'auto', label: 'Auto' },
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
      {loading && realVehicles.length === 0 ? (
        <p className="text-sm text-admin-muted">Loading vehicles…</p>
      ) : (
        <DataTable data={filtered} columns={columns} globalFilter={search} />
      )}
    </div>
  );
}
