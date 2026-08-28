import { createColumnHelper } from '@tanstack/react-table';
import { MapPin, Plus, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import {
  adminApi,
  type RecommendedPlaceRow,
  type ServiceAreaRow,
} from '@/shared/api/admin.api';

const col = createColumnHelper<RecommendedPlaceRow>();

const EMPTY_FORM = {
  pincode: '',
  name: '',
  address: '',
  latitude: 16.5062,
  longitude: 80.648,
  sortOrder: 0,
  isActive: true,
};

export function RecommendedPlacesPage() {
  const [areas, setAreas] = useState<ServiceAreaRow[]>([]);
  const [rows, setRows] = useState<RecommendedPlaceRow[]>([]);
  const [filterPincode, setFilterPincode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadAreas = useCallback(async () => {
    try {
      const result = await adminApi.listLocations();
      setAreas(result.items.filter((item) => item.isActive));
    } catch {
      setAreas([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listRecommendedPlaces(
        filterPincode ? { pincode: filterPincode } : undefined,
      );
      setRows(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load recommended places');
    } finally {
      setLoading(false);
    }
  }, [filterPincode]);

  useEffect(() => {
    void loadAreas();
  }, [loadAreas]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = useCallback(() => {
    setForm({
      ...EMPTY_FORM,
      pincode: filterPincode || areas[0]?.pincode || '',
    });
    setEditingId(null);
    setShowForm(false);
  }, [areas, filterPincode]);

  const startCreate = () => {
    if (showForm && !editingId) {
      resetForm();
      return;
    }
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      pincode: filterPincode || areas[0]?.pincode || '',
    });
    setError('');
    setShowForm(true);
  };

  const startEdit = useCallback((row: RecommendedPlaceRow) => {
    setEditingId(row.id);
    setForm({
      pincode: row.pincode,
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    });
    setError('');
    setShowForm(true);
  }, []);

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Place' }),
      col.accessor('pincode', { header: 'Pincode' }),
      col.accessor('address', {
        header: 'Address',
        cell: (info) => (
          <span className="line-clamp-2 max-w-xs text-xs text-admin-muted">{info.getValue()}</span>
        ),
      }),
      col.accessor('sortOrder', { header: 'Order' }),
      col.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <button
            type="button"
            onClick={() =>
              void adminApi
                .updateRecommendedPlace(info.row.original.id, { isActive: !info.getValue() })
                .then(load)
                .catch((err: unknown) =>
                  setError(err instanceof Error ? err.message : 'Could not update status'),
                )
            }
          >
            <StatusBadge
              label={info.getValue() ? 'active' : 'disabled'}
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
                  .deleteRecommendedPlace(row.original.id)
                  .then(() => {
                    if (editingId === row.original.id) resetForm();
                    return load();
                  })
                  .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : 'Could not remove place'),
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
        await adminApi.updateRecommendedPlace(editingId, form);
      } else {
        await adminApi.createRecommendedPlace(form);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save recommended place');
    }
  };

  return (
    <div>
      <PageHeader
        title="Recommended Places"
        description="Curate popular drop-off destinations for each service pincode. Users see these on Home for quick booking."
        actions={
          <button
            type="button"
            className="admin-btn-primary"
            onClick={startCreate}
            disabled={areas.length === 0}
          >
            <Plus className="h-4 w-4" />
            Add place
          </button>
        }
      />

      <div className="admin-panel mb-6 flex flex-wrap items-end gap-4 p-5">
        <label className="block min-w-[12rem] text-sm">
          <span className="mb-1 block text-admin-muted">Filter by pincode</span>
          <select
            className="admin-input"
            value={filterPincode}
            onChange={(e) => setFilterPincode(e.target.value)}
          >
            <option value="">All pincodes</option>
            {areas.map((area) => (
              <option key={area.id} value={area.pincode}>
                {area.pincode} — {area.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-admin-muted">
          {rows.length} place{rows.length === 1 ? '' : 's'}
          {filterPincode ? ` in ${filterPincode}` : ''}
        </p>
      </div>

      {areas.length === 0 && (
        <p className="mb-4 text-sm text-admin-muted">
          Add an active service location first under Locations before creating recommended places.
        </p>
      )}

      {showForm && (
        <form onSubmit={(e) => void save(e)} className="admin-panel mb-6 grid gap-4 p-5 md:grid-cols-2">
          <p className="md:col-span-2 flex items-center gap-2 text-sm font-medium text-admin-ink">
            <Sparkles className="h-4 w-4 text-admin-teal" />
            {editingId ? 'Edit recommended place' : 'Add recommended place'}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Pincode / area</span>
            <select
              className="admin-input"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              required
            >
              <option value="" disabled>
                Select pincode
              </option>
              {areas.map((area) => (
                <option key={area.id} value={area.pincode}>
                  {area.pincode} — {area.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Place name</span>
            <input
              className="admin-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Railway Station"
              required
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-admin-muted">Address</span>
            <input
              className="admin-input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Full address shown to riders"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Latitude</span>
            <input
              className="admin-input"
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Longitude</span>
            <input
              className="admin-input"
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Sort order</span>
            <input
              className="admin-input"
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            />
          </label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Enabled (visible to users in this pincode)
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="admin-btn-primary">
              {editingId ? 'Update place' : 'Save place'}
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
        <p className="text-sm text-admin-muted">Loading recommended places…</p>
      ) : (
        <DataTable data={rows} columns={columns} />
      )}
    </div>
  );
}
