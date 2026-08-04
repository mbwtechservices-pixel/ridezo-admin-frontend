import { createColumnHelper } from '@tanstack/react-table';
import { Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminNotificationRow } from '@/shared/api/admin.api';
import { formatDate } from '@/shared/lib/cn';

const col = createColumnHelper<AdminNotificationRow>();

const statusTone = {
  sent: 'success',
  queued: 'info',
  failed: 'danger',
} as const;

export function NotificationsPage() {
  const [rows, setRows] = useState<AdminNotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'customers' as 'customers' | 'drivers' | 'all_users',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listNotifications();
      setRows(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications');
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
      col.accessor('audience', { header: 'Audience' }),
      col.accessor('channel', { header: 'Channel' }),
      col.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge label={info.getValue()} tone={statusTone[info.getValue() as keyof typeof statusTone] ?? 'neutral'} />
        ),
      }),
      col.accessor('sentAt', {
        header: 'When',
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [],
  );

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.sendNotification({
        ...form,
        channels: ['push', 'in_app'],
      });
      setShowForm(false);
      setForm({ title: '', body: '', audience: 'customers' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send notification');
    }
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Send push and in-app messages to customers and drivers."
        actions={
          <button type="button" className="admin-btn-primary" onClick={() => setShowForm((s) => !s)}>
            <Send className="h-4 w-4" />
            Send notification
          </button>
        }
      />

      {showForm && (
        <form onSubmit={(e) => void send(e)} className="admin-panel mb-6 grid gap-4 p-5">
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Title</span>
            <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Message</span>
            <textarea className="admin-input min-h-24" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Audience</span>
            <select className="admin-input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as typeof form.audience })}>
              <option value="customers">Customers</option>
              <option value="drivers">Drivers</option>
              <option value="all_users">All users</option>
            </select>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="admin-btn-primary">Send</button>
            <button type="button" className="admin-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      {loading ? <p className="text-sm text-admin-muted">Loading notifications…</p> : <DataTable data={rows} columns={columns} />}
    </div>
  );
}
