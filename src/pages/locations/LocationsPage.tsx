import { createColumnHelper } from '@tanstack/react-table';
import { MapPin, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type ServiceAreaRow } from '@/shared/api/admin.api';

const col = createColumnHelper<ServiceAreaRow>();

export function LocationsPage() {
  const [rows, setRows] = useState<ServiceAreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    city: '',
    state: '',
    country: 'India',
    latitude: 12.9716,
    longitude: 77.5946,
    radiusKm: 25,
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listLocations();
      setRows(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load locations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Area' }),
      col.accessor('city', { header: 'City' }),
      col.accessor('state', { header: 'State' }),
      col.accessor('radiusKm', { header: 'Radius (km)' }),
      col.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge
            label={info.getValue() ? 'active' : 'inactive'}
            tone={info.getValue() ? 'success' : 'neutral'}
          />
        ),
      }),
      col.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            type="button"
            className="admin-btn-ghost text-xs text-admin-rose"
            onClick={() =>
              void adminApi.deleteLocation(row.original.id).then(load).catch(console.error)
            }
          >
            Remove
          </button>
        ),
      }),
    ],
    [load],
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createLocation(form);
      setShowForm(false);
      setForm({
        name: '',
        city: '',
        state: '',
        country: 'India',
        latitude: 12.9716,
        longitude: 77.5946,
        radiusKm: 25,
        isActive: true,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create location');
    }
  };

  return (
    <div>
      <PageHeader
        title="Service Locations"
        description="Manage cities and regions where Ridezo operates."
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            Add location
          </button>
        }
      />

      {showForm && (
        <form onSubmit={(e) => void create(e)} className="admin-panel mb-6 grid gap-4 p-5 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Area name</span>
            <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">City</span>
            <input className="admin-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">State</span>
            <input className="admin-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Radius (km)</span>
            <input className="admin-input" type="number" min={1} value={form.radiusKm} onChange={(e) => setForm({ ...form, radiusKm: Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Latitude</span>
            <input className="admin-input" type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Longitude</span>
            <input className="admin-input" type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="admin-btn-primary">Save location</button>
            <button type="button" className="admin-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {error && (
        <p className="mb-4 flex items-center gap-2 text-sm text-admin-rose">
          <MapPin className="h-4 w-4" />
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-admin-muted">Loading locations…</p>
      ) : (
        <DataTable data={rows} columns={columns} />
      )}
    </div>
  );
}
