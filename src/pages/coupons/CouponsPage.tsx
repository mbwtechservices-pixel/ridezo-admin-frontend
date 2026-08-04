import { createColumnHelper } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminCouponRow } from '@/shared/api/admin.api';
import { formatShortDate } from '@/shared/lib/cn';

const col = createColumnHelper<AdminCouponRow>();

const statusTone = {
  active: 'success',
  expired: 'danger',
  inactive: 'neutral',
} as const;

export function CouponsPage() {
  const [rows, setRows] = useState<AdminCouponRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    title: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    minOrderAmount: 0,
    usageLimit: 100,
    startsAt: new Date().toISOString().slice(0, 10),
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listCoupons();
      setRows(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(
    () => [
      col.accessor('code', { header: 'Code' }),
      col.accessor('title', { header: 'Title' }),
      col.accessor('type', { header: 'Type' }),
      col.accessor('value', {
        header: 'Value',
        cell: (info) =>
          info.row.original.type === 'percentage' ? `${info.getValue()}%` : `₹${info.getValue()}`,
      }),
      col.accessor('usageCount', {
        header: 'Usage',
        cell: (info) => `${info.getValue()} / ${info.row.original.usageLimit ?? '∞'}`,
      }),
      col.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge label={info.getValue()} tone={statusTone[info.getValue() as keyof typeof statusTone] ?? 'neutral'} />
        ),
      }),
      col.accessor('endsAt', {
        header: 'Expires',
        cell: (info) => formatShortDate(info.getValue()),
      }),
    ],
    [],
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createCoupon({
        ...form,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        isPublic: true,
      });
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create coupon');
    }
  };

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Create and manage promotional discount codes."
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            Create coupon
          </button>
        }
      />

      {showForm && (
        <form onSubmit={(e) => void create(e)} className="admin-panel mb-6 grid gap-4 p-5 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Code</span>
            <input className="admin-input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Title</span>
            <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Type</span>
            <select className="admin-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percentage' | 'fixed' })}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Value</span>
            <input className="admin-input" type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Starts</span>
            <input className="admin-input" type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Ends</span>
            <input className="admin-input" type="date" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="admin-btn-primary">Create</button>
            <button type="button" className="admin-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      {loading ? <p className="text-sm text-admin-muted">Loading coupons…</p> : <DataTable data={rows} columns={columns} />}
    </div>
  );
}
