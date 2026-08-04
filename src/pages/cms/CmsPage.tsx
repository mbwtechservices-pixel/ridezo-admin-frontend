import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminCmsRow } from '@/shared/api/admin.api';
import { formatDate } from '@/shared/lib/cn';

const col = createColumnHelper<AdminCmsRow>();

export function CmsPage() {
  const [rows, setRows] = useState<AdminCmsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    type: 'page' as 'page' | 'banner' | 'faq' | 'policy',
    content: '',
    status: 'draft' as 'draft' | 'published',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listCms();
      setRows(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load CMS content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(
    () => [
      col.accessor('title', { header: 'Title' }),
      col.accessor('slug', { header: 'Slug' }),
      col.accessor('type', { header: 'Type' }),
      col.accessor('authorName', { header: 'Author' }),
      col.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge
            label={info.getValue()}
            tone={info.getValue() === 'published' ? 'success' : 'neutral'}
          />
        ),
      }),
      col.accessor('updatedAt', {
        header: 'Updated',
        cell: (info) => formatDate(info.getValue()),
      }),
      col.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            type="button"
            className="admin-btn-ghost text-xs text-admin-rose"
            onClick={() =>
              void adminApi.deleteCms(row.original.id).then(load).catch(console.error)
            }
          >
            Delete
          </button>
        ),
      }),
    ],
    [load],
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createCms(form);
      setShowForm(false);
      setForm({ title: '', slug: '', type: 'page', content: '', status: 'draft' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create content');
    }
  };

  return (
    <div>
      <PageHeader
        title="CMS"
        description="Pages, banners, FAQs, and policy content."
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            Add content
          </button>
        }
      />

      {showForm && (
        <form onSubmit={(e) => void create(e)} className="admin-panel mb-6 grid gap-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-admin-muted">Title</span>
              <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-admin-muted">Slug</span>
              <input className="admin-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-admin-muted">Type</span>
              <select className="admin-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}>
                <option value="page">Page</option>
                <option value="banner">Banner</option>
                <option value="faq">FAQ</option>
                <option value="policy">Policy</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-admin-muted">Status</span>
              <select className="admin-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Content</span>
            <textarea className="admin-input min-h-32" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="admin-btn-primary">Save</button>
            <button type="button" className="admin-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      {loading ? <p className="text-sm text-admin-muted">Loading content…</p> : <DataTable data={rows} columns={columns} />}
    </div>
  );
}
