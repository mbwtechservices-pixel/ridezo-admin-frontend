import { createColumnHelper } from '@tanstack/react-table';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminAdBannerRow } from '@/shared/api/admin.api';
import { resolveMediaUrl } from '@/shared/lib/media';

const col = createColumnHelper<AdminAdBannerRow>();

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read image file'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

function resolveMimeType(file: File): string {
  if (file.type.startsWith('image/')) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

const EMPTY_FORM = {
  title: '',
  linkUrl: '',
  sortOrder: 0,
  isActive: true,
};

export function AdBannersPage() {
  const [rows, setRows] = useState<AdminAdBannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listAdBanners();
      setRows(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load ad banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setError('');
    setShowForm(true);
  };

  const startEdit = useCallback((row: AdminAdBannerRow) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      linkUrl: row.linkUrl ?? '',
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    });
    setImageFile(null);
    setPreviewUrl(resolveMediaUrl(row.imageUrl));
    setError('');
    setShowForm(true);
  }, []);

  const columns = useMemo(
    () => [
      col.display({
        id: 'preview',
        header: 'Banner',
        cell: ({ row }) => (
          <img
            src={resolveMediaUrl(row.original.imageUrl)}
            alt={row.original.title}
            className="h-14 w-28 rounded-lg object-cover"
          />
        ),
      }),
      col.accessor('title', { header: 'Title' }),
      col.accessor('sortOrder', { header: 'Order' }),
      col.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <button
            type="button"
            onClick={() =>
              void adminApi
                .updateAdBanner(info.row.original.id, { isActive: !info.getValue() })
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
            <button type="button" className="admin-btn-ghost text-xs" onClick={() => startEdit(row.original)}>
              <Pencil className="mr-1 inline h-3 w-3" />
              Edit
            </button>
            <button
              type="button"
              className="admin-btn-ghost text-xs text-admin-rose"
              onClick={() =>
                void adminApi
                  .deleteAdBanner(row.original.id)
                  .then(() => {
                    if (editingId === row.original.id) resetForm();
                    return load();
                  })
                  .catch((err: unknown) =>
                    setError(err instanceof Error ? err.message : 'Could not remove banner'),
                  )
              }
            >
              <Trash2 className="mr-1 inline h-3 w-3" />
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
        const body: Record<string, unknown> = { ...form, linkUrl: form.linkUrl || undefined };
        if (imageFile) {
          body.imageBase64 = await readFileAsBase64(imageFile);
          body.mimeType = resolveMimeType(imageFile);
          body.fileName = imageFile.name;
        }
        await adminApi.updateAdBanner(editingId, body);
      } else {
        if (!imageFile) {
          setError('Choose a banner image');
          return;
        }
        await adminApi.createAdBanner({
          ...form,
          linkUrl: form.linkUrl || undefined,
          imageBase64: await readFileAsBase64(imageFile),
          mimeType: resolveMimeType(imageFile),
          fileName: imageFile.name,
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save ad banner');
    }
  };

  return (
    <div>
      <PageHeader
        title="Ad Banners"
        description="Upload promotional banners shown on the User app Home screen when Ads Banner is ON in Settings."
        actions={
          <div className="flex gap-2">
            <Link to="/settings" className="admin-btn-ghost">
              Ads ON/OFF in Settings
            </Link>
            <button type="button" className="admin-btn-primary" onClick={startCreate}>
              <Plus className="h-4 w-4" />
              Add banner
            </button>
          </div>
        }
      />

      {showForm && (
        <form onSubmit={(e) => void save(e)} className="admin-panel mb-6 grid gap-4 p-5 md:grid-cols-2">
          <p className="md:col-span-2 text-sm font-medium text-admin-ink">
            {editingId ? 'Edit ad banner' : 'Add ad banner'}
          </p>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Title</span>
            <input
              className="admin-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
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
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-admin-muted">Link URL (optional)</span>
            <input
              className="admin-input"
              type="url"
              placeholder="https://example.com/offer"
              value={form.linkUrl}
              onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            />
          </label>
          <div className="md:col-span-2">
            <span className="mb-1 block text-sm text-admin-muted">Banner image (JPEG, PNG, WebP · max 2MB)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus className="mr-2 inline h-4 w-4" />
              {imageFile ? imageFile.name : editingId ? 'Replace image' : 'Choose image'}
            </button>
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="mt-3 max-h-32 rounded-xl border border-slate-200" />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active (shown when Ads Banner is ON)
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="admin-btn-primary">
              {editingId ? 'Update banner' : 'Save banner'}
            </button>
            <button type="button" className="admin-btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}

      {loading ? (
        <p className="text-sm text-admin-muted">Loading ad banners…</p>
      ) : (
        <DataTable data={rows} columns={columns} />
      )}
    </div>
  );
}
