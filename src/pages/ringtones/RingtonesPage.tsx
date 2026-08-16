import { createColumnHelper } from '@tanstack/react-table';
import { Pause, Pencil, Play, Plus, Power, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { adminApi, type AdminRingtoneRow } from '@/shared/api/admin.api';
import { formatDate } from '@/shared/lib/cn';

const col = createColumnHelper<AdminRingtoneRow>();

const API_ORIGIN = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.PROD
    ? 'https://ridezo-backend.onrender.com/api/v1'
    : 'http://localhost:4000/api/v1')
).replace(/\/api\/v\d+$/, '');

function resolveAudioUrl(fileUrl: string): string {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${API_ORIGIN}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveMimeType(file: File): string {
  if (file.type && file.type.startsWith('audio/')) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'ogg':
      return 'audio/ogg';
    case 'webm':
      return 'audio/webm';
    case 'm4a':
    case 'mp4':
      return 'audio/mp4';
    case 'aac':
      return 'audio/aac';
    default:
      return 'audio/mpeg';
  }
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Could not read audio file'));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Could not read audio file'));
    reader.readAsDataURL(file);
  });
}

type FormState = {
  name: string;
  file: File | null;
  isActive: boolean;
};

const emptyForm: FormState = { name: '', file: null, isActive: true };

export function RingtonesPage() {
  const [rows, setRows] = useState<AdminRingtoneRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPreview = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    }
    setPreviewId(null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await adminApi.listRingtones();
      setRows(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load ringtones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => stopPreview();
  }, [load, stopPreview]);

  const openCreate = () => {
    stopPreview();
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row: AdminRingtoneRow) => {
    stopPreview();
    setEditingId(row.id);
    setForm({ name: row.name, file: null, isActive: row.isActive });
    setShowForm(true);
  };

  const preview = async (row: AdminRingtoneRow) => {
    if (previewId === row.id) {
      stopPreview();
      return;
    }
    stopPreview();
    const audio = new Audio(resolveAudioUrl(row.fileUrl));
    audio.loop = true;
    audioRef.current = audio;
    setPreviewId(row.id);
    try {
      await audio.play();
    } catch (err) {
      stopPreview();
      setError(err instanceof Error ? err.message : 'Could not play ringtone');
    }
  };

  const toggleActive = async (row: AdminRingtoneRow) => {
    setError('');
    try {
      await adminApi.updateRingtone(row.id, { isActive: !row.isActive });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update ringtone');
    }
  };

  const remove = async (row: AdminRingtoneRow) => {
    if (!window.confirm(`Delete ringtone “${row.name}”?`)) return;
    setError('');
    if (previewId === row.id) stopPreview();
    try {
      await adminApi.deleteRingtone(row.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete ringtone');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const body: {
          name: string;
          isActive: boolean;
          fileBase64?: string;
          mimeType?: string;
          fileName?: string;
        } = {
          name: form.name.trim(),
          isActive: form.isActive,
        };
        if (form.file) {
          body.fileBase64 = await readFileAsBase64(form.file);
          body.mimeType = resolveMimeType(form.file);
          body.fileName = form.file.name;
        }
        await adminApi.updateRingtone(editingId, body);
      } else {
        if (!form.file) {
          setError('Choose an audio file to upload');
          setSaving(false);
          return;
        }
        await adminApi.createRingtone({
          name: form.name.trim(),
          fileBase64: await readFileAsBase64(form.file),
          mimeType: resolveMimeType(form.file),
          fileName: form.file.name,
          isActive: form.isActive,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save ringtone');
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      col.accessor('name', { header: 'Name' }),
      col.accessor('mimeType', { header: 'Type' }),
      col.accessor('fileSizeBytes', {
        header: 'Size',
        cell: (info) => formatBytes(info.getValue()),
      }),
      col.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <StatusBadge
            label={info.getValue() ? 'Active' : 'Disabled'}
            tone={info.getValue() ? 'success' : 'neutral'}
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
        cell: ({ row }) => {
          const item = row.original;
          const playing = previewId === item.id;
          return (
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                className="admin-btn-ghost text-xs"
                onClick={() => void preview(item)}
                title={playing ? 'Stop preview' : 'Preview'}
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {playing ? 'Stop' : 'Preview'}
              </button>
              <button
                type="button"
                className="admin-btn-ghost text-xs"
                onClick={() => void toggleActive(item)}
                title={item.isActive ? 'Disable' : 'Enable'}
              >
                <Power className="h-3.5 w-3.5" />
                {item.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                type="button"
                className="admin-btn-ghost text-xs"
                onClick={() => openEdit(item)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
              <button
                type="button"
                className="admin-btn-ghost text-xs text-admin-rose"
                onClick={() => void remove(item)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          );
        },
      }),
    ],
    [previewId],
  );

  return (
    <div>
      <PageHeader
        title="Driver Ride Ringtones"
        description="Upload and manage the ringtone played on the driver app for incoming ride requests."
        actions={
          <button type="button" className="admin-btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add ringtone
          </button>
        }
      />

      {showForm && (
        <form onSubmit={(e) => void submit(e)} className="admin-panel mb-6 grid gap-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-admin-muted">Name</span>
              <input
                className="admin-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Classic ring"
                required
                maxLength={100}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-admin-muted">
                Audio file {editingId ? '(optional replace)' : ''}
              </span>
              <input
                className="admin-input"
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,audio/aac,audio/x-m4a,.mp3,.wav,.ogg,.m4a,.aac"
                required={!editingId}
                onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
              />
              <span className="mt-1 block text-xs text-admin-muted">
                MP3, WAV, OGG, or M4A up to 5MB.
              </span>
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <span>Set as active ringtone for drivers</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="admin-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update' : 'Upload'}
            </button>
            <button
              type="button"
              className="admin-btn-ghost"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      <p className="mb-4 text-sm text-admin-muted">
        Only one ringtone can be active. If none is active, drivers hear the built-in default tone.
      </p>
      {loading ? (
        <p className="text-sm text-admin-muted">Loading ringtones…</p>
      ) : (
        <DataTable data={rows} columns={columns} />
      )}
    </div>
  );
}
