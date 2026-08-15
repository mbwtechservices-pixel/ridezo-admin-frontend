import { createColumnHelper } from '@tanstack/react-table';
import { MapPin, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type ServiceAreaRow } from '@/shared/api/admin.api';

const col = createColumnHelper<ServiceAreaRow>();

const EMPTY_FORM = {
  name: '',
  city: 'Vijayawada',
  state: 'Andhra Pradesh',
  country: 'India',
  pincode: '',
  latitude: 16.5062,
  longitude: 80.648,
  radiusKm: 5,
  isActive: true,
};

export function LocationsPage() {
  const [rows, setRows] = useState<ServiceAreaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

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

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const startCreate = () => {
    if (showForm && !editingId) {
      resetForm();
      return;
    }
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const startEdit = useCallback((row: ServiceAreaRow) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? '',
      city: row.city ?? '',
      state: row.state ?? '',
      country: row.country || 'India',
      pincode: row.pincode ?? '',
      latitude: row.latitude,
      longitude: row.longitude,
      radiusKm: row.radiusKm,
      isActive: row.isActive,
    });
    setError('');
    setShowForm(true);
  }, []);

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Area' }),
      col.accessor('pincode', { header: 'Pincode' }),
      col.accessor('city', { header: 'City' }),
      col.accessor('state', { header: 'State' }),
      col.accessor('radiusKm', { header: 'Radius (km)' }),
      col.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <button
            type="button"
            onClick={() =>
              void adminApi
                .updateLocation(info.row.original.id, { isActive: !info.getValue() })
                .then(load)
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : 'Could not update status'),
                )
            }
          >
            <StatusBadge
              label={info.getValue() ? 'active' : 'inactive'}
              tone={info.getValue() ? 'success' : 'neutral'}
            />
          </button>
        ),
      }),
      col.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className="admin-btn-ghost text-xs"
              onClick={() => startEdit(row.original)}
            >
              Edit
            </button>
            <button
              type="button"
              className="admin-btn-ghost text-xs text-admin-rose"
              onClick={() =>
                void adminApi
                  .deleteLocation(row.original.id)
                  .then(() => {
                    if (editingId === row.original.id) resetForm();
                    return load();
                  })
                  .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : 'Could not remove location'),
                  )
              }
            >
              Remove
            </button>
          </div>
        ),
      }),
    ],
    [editingId, load, resetForm, startEdit],
  );

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await adminApi.updateLocation(editingId, form);
      } else {
        await adminApi.createLocation(form);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save location');
    }
  };

  return (
    <div>
      <PageHeader
        title="Service Locations"
        description="Manage active pincodes. Riders and drivers can only operate in these PINs."
        actions={
          <button type="button" className="admin-btn-primary" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add location
          </button>
        }
      />

      {showForm && (
        <form onSubmit={(e) => void save(e)} className="admin-panel mb-6 grid gap-4 p-5 md:grid-cols-2">
          <p className="md:col-span-2 text-sm font-medium text-admin-ink">
            {editingId ? 'Edit location' : 'Add location'}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Area name</span>
            <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Pincode</span>
            <input
              className="admin-input"
              inputMode="numeric"
              maxLength={6}
              pattern="\d{6}"
              placeholder="520001"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              required
            />
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
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active (bookings allowed in this pincode)
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="admin-btn-primary">
              {editingId ? 'Update location' : 'Save location'}
            </button>
            <button type="button" className="admin-btn-ghost" onClick={resetForm}>
              Cancel
            </button>
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
