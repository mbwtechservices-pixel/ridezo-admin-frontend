import { createColumnHelper } from '@tanstack/react-table';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminRentalCarRow } from '@/shared/api/admin.api';
import { formatCurrency } from '@/shared/lib/cn';
import { resolveMediaUrl } from '@/shared/lib/media';

const POLL_MS = 5000;
const col = createColumnHelper<AdminRentalCarRow>();

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read image file'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

function resolveMimeType(file: File): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (file.type === 'image/png') return 'image/png';
  if (file.type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

const EMPTY_FORM = {
  name: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  location: '',
  seatingCapacity: 5,
  transmission: 'manual' as const,
  fuelType: 'petrol' as const,
  featuresText: '',
  availability: 'available' as const,
  isActive: true,
  securityDeposit: 5000,
  pricePerDay: 2000,
  priceTwoDays: 3500,
  description: '',
  color: '',
  sortOrder: 0,
};

export function CarRentalsPage() {
  const [rows, setRows] = useState<AdminRentalCarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [existingPhotos, setExistingPhotos] = useState<Array<{ url: string; mimeType?: string }>>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const result = await adminApi.listRentalCars();
      setRows(Array.isArray(result.items) ? result.items : []);
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load rental cars');
        setRows([]);
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

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setExistingPhotos([]);
    setNewFiles([]);
    setEditingId(null);
    setShowForm(false);
  };

  const startCreate = () => {
    resetForm();
    setError('');
    setShowForm(true);
  };

  const startEdit = (row: AdminRentalCarRow) => {
    setEditingId(row.id);
    setForm({
      name: row.name,
      brand: row.brand,
      model: row.model,
      year: row.year,
      location: row.location,
      seatingCapacity: row.seatingCapacity,
      transmission: row.transmission,
      fuelType: row.fuelType,
      featuresText: (row.features ?? []).join(', '),
      availability: row.availability,
      isActive: row.isActive,
      securityDeposit: row.securityDeposit,
      pricePerDay: row.pricePerDay,
      priceTwoDays: row.priceTwoDays,
      description: row.description ?? '',
      color: row.color ?? '',
      sortOrder: row.sortOrder ?? 0,
    });
    setExistingPhotos(row.photos ?? []);
    setNewFiles([]);
    setError('');
    setShowForm(true);
  };

  const toggleActive = async (row: AdminRentalCarRow) => {
    try {
      await adminApi.updateRentalCar(row.id, { isActive: !row.isActive });
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update rental car');
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this rental car? Users will no longer see it.')) return;
    try {
      await adminApi.deleteRentalCar(id);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete rental car');
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const features = form.featuresText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    try {
      const uploaded = await Promise.all(
        newFiles.map(async (file) => ({
          fileBase64: await readFileAsBase64(file),
          mimeType: resolveMimeType(file),
          fileName: file.name,
        })),
      );
      const photos = [...existingPhotos.map((photo) => ({ url: photo.url })), ...uploaded];
      if (!photos.length) {
        setError('Add at least one car photo');
        return;
      }
      const body = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: Number(form.year),
        location: form.location.trim(),
        seatingCapacity: Number(form.seatingCapacity),
        transmission: form.transmission,
        fuelType: form.fuelType,
        features,
        availability: form.availability,
        isActive: form.isActive,
        securityDeposit: Number(form.securityDeposit),
        pricePerDay: Number(form.pricePerDay),
        priceTwoDays: Number(form.priceTwoDays),
        description: form.description.trim(),
        color: form.color.trim(),
        sortOrder: Number(form.sortOrder),
        photos,
      };
      if (editingId) {
        await adminApi.updateRentalCar(editingId, body);
      } else {
        await adminApi.createRentalCar(body);
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save rental car');
    }
  };

  const columns = useMemo(
    () => [
      col.accessor('name', {
        header: 'Car',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.photos[0]?.url ? (
              <img
                src={resolveMediaUrl(row.original.photos[0].url)}
                alt=""
                className="h-12 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="h-12 w-16 rounded-lg bg-slate-100" />
            )}
            <div>
              <p className="font-medium text-admin-ink">{row.original.name}</p>
              <p className="text-xs text-admin-muted">
                {row.original.brand} {row.original.model} · {row.original.year}
              </p>
            </div>
          </div>
        ),
      }),
      col.accessor('location', { header: 'Location' }),
      col.accessor('pricePerDay', {
        header: 'Per day',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      col.accessor('priceTwoDays', {
        header: '2 days',
        cell: (info) => formatCurrency(info.getValue()),
      }),
      col.accessor('availability', {
        header: 'Availability',
        cell: (info) => (
          <StatusBadge
            label={info.getValue()}
            tone={info.getValue() === 'available' ? 'success' : 'neutral'}
          />
        ),
      }),
      col.accessor('isActive', {
        header: 'Listing',
        cell: ({ row }) => (
          <StatusBadge
            label={row.original.isActive ? 'Enabled' : 'Disabled'}
            tone={row.original.isActive ? 'success' : 'danger'}
          />
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
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <button
              type="button"
              className="admin-btn-ghost text-xs"
              onClick={() => void toggleActive(row.original)}
            >
              {row.original.isActive ? 'Disable' : 'Enable'}
            </button>
            <button
              type="button"
              className="admin-btn-ghost text-xs text-admin-rose"
              onClick={() => void remove(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        ),
      }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Car Rentals"
        description="Manage rental cars shown to every User. Disabled or deleted cars disappear from the User app immediately."
        actions={
          <button type="button" className="admin-btn-primary" onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Add rental car
          </button>
        }
      />
      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}

      {showForm && (
        <form onSubmit={(event) => void save(event)} className="admin-panel mb-6 grid gap-4 p-5 md:grid-cols-2">
          <p className="md:col-span-2 text-sm font-medium text-admin-ink">
            {editingId ? 'Edit rental car' : 'Add rental car'}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Car name</span>
            <input className="admin-input" value={form.name} required onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Brand</span>
            <input className="admin-input" value={form.brand} required onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Model</span>
            <input className="admin-input" value={form.model} required onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Year</span>
            <input className="admin-input" type="number" min={1990} value={form.year} required onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Location</span>
            <input className="admin-input" value={form.location} required onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Seating capacity</span>
            <input className="admin-input" type="number" min={2} max={12} value={form.seatingCapacity} required onChange={(e) => setForm({ ...form, seatingCapacity: Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Transmission</span>
            <select className="admin-input" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value as 'manual' | 'automatic' })}>
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Fuel type</span>
            <select className="admin-input" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value as typeof form.fuelType })}>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="cng">CNG</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Rental price per day (₹)</span>
            <input className="admin-input" type="number" min={1} value={form.pricePerDay} required onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">2-day price (₹)</span>
            <input className="admin-input" type="number" min={1} value={form.priceTwoDays} required onChange={(e) => setForm({ ...form, priceTwoDays: Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Security deposit (₹)</span>
            <input className="admin-input" type="number" min={0} value={form.securityDeposit} required onChange={(e) => setForm({ ...form, securityDeposit: Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Color</span>
            <input className="admin-input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Availability</span>
            <select className="admin-input" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value as 'available' | 'unavailable' })}>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Enabled for Users
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-admin-muted">Features (comma separated)</span>
            <input className="admin-input" placeholder="AC, Bluetooth, Reverse camera" value={form.featuresText} onChange={(e) => setForm({ ...form, featuresText: e.target.value })} />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-admin-muted">Description</span>
            <textarea className="admin-input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <div className="md:col-span-2">
            <span className="mb-1 block text-sm text-admin-muted">Photos (JPEG, PNG, WebP · max 8 · 2MB each)</span>
            <div className="mb-3 flex flex-wrap gap-2">
              {existingPhotos.map((photo) => (
                <button
                  key={photo.url}
                  type="button"
                  className="relative"
                  onClick={() => setExistingPhotos((current) => current.filter((item) => item.url !== photo.url))}
                  title="Remove photo"
                >
                  <img src={resolveMediaUrl(photo.url)} alt="" className="h-20 w-28 rounded-xl object-cover" />
                </button>
              ))}
              {newFiles.map((file) => (
                <span key={file.name} className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-admin-muted">
                  {file.name}
                </span>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setNewFiles((current) => [...current, ...files].slice(0, 8 - existingPhotos.length));
              }}
            />
            <button type="button" className="admin-btn-ghost" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> Add photos
            </button>
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button type="button" className="admin-btn-ghost" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">
              {editingId ? 'Save changes' : 'Create rental car'}
            </button>
          </div>
        </form>
      )}

      {loading && rows.length === 0 ? (
        <p className="text-sm text-admin-muted">Loading rental cars…</p>
      ) : (
        <DataTable data={rows} columns={columns} emptyMessage="No rental cars yet." />
      )}
    </div>
  );
}
