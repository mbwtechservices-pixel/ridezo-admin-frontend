import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  adminApi,
  type AdminDriverDocumentCard,
  type AdminDriverDocumentsRow,
} from '@/shared/api/admin.api';
import { resolveMediaUrl } from '@/shared/lib/media';

const POLL_MS = 5000;

const CARD_LABELS: Record<string, string> = {
  driving_license: 'Driving License',
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  profile_photo: 'Profile Photo',
};

function cardLabel(type: string): string {
  return CARD_LABELS[type] ?? type;
}

export function DriverDocumentsPage() {
  const [rows, setRows] = useState<AdminDriverDocumentsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [identityOk, setIdentityOk] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveTarget, setApproveTarget] = useState<AdminDriverDocumentsRow | null>(null);
  const [approveIdentityOk, setApproveIdentityOk] = useState(false);
  const [preview, setPreview] = useState<{
    driver: AdminDriverDocumentsRow;
    card: AdminDriverDocumentCard;
  } | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const result = await adminApi.listDriverDocuments();
      setRows(result.items);
      setPreview((current) => {
        if (!current) return current;
        const nextDriver = result.items.find((row) => row.driverId === current.driver.driverId);
        if (!nextDriver) return current;
        const nextCard = nextDriver.documents.find((doc) => doc.type === current.card.type);
        return nextCard ? { driver: nextDriver, card: nextCard } : current;
      });
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load driver documents');
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

  const verify = async (status: 'approved' | 'rejected') => {
    if (!preview?.card.id) return;
    if (status === 'approved' && !identityOk) {
      setError('Confirm that these documents belong to this driver and match their details.');
      return;
    }
    if (status === 'rejected' && rejectReason.trim().length < 5) {
      setError('Enter a rejection reason (at least 5 characters).');
      return;
    }
    setBusyId(preview.card.id);
    setError('');
    try {
      await adminApi.verifyDriverDocument(preview.driver.driverId, preview.card.id, {
        status,
        note: status === 'rejected' ? rejectReason.trim() : undefined,
      });
      setIdentityOk(false);
      setRejectReason('');
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update document');
    } finally {
      setBusyId(null);
    }
  };

  const approveDriver = async () => {
    if (!approveTarget) return;
    const mismatch = approveTarget.documents.some(
      (doc) => !doc.fileUrl || doc.status !== 'approved',
    );
    if (mismatch) {
      setError(
        'Verify all four documents first. Do not approve if they belong to different people or the details do not match.',
      );
      return;
    }
    if (!approveIdentityOk) {
      setError(
        'Confirm that Aadhaar, PAN, Driving License, and Profile Photo belong to the same person before approving.',
      );
      return;
    }
    setError('');
    try {
      await adminApi.updateDriverVerification(approveTarget.driverId, 'approved', {
        identityConfirmed: true,
      });
      setApproveTarget(null);
      setApproveIdentityOk(false);
      await load(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not approve driver');
    }
  };

  return (
    <div>
      <PageHeader
        title="Driver Documents"
        description="Open each file and verify it belongs to this driver. Approve the account only after Aadhaar, PAN, Driving License, and Profile Photo are confirmed as the same person."
      />
      {error && <p className="mb-4 text-sm text-admin-rose">{error}</p>}
      {loading && rows.length === 0 ? (
        <p className="text-sm text-admin-muted">Loading driver documents…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-admin-muted">No drivers yet. Uploaded documents appear here in real time.</p>
      ) : (
        <div className="space-y-6">
          {rows.map((driver) => (
            <section key={driver.driverId} className="rounded-2xl border border-admin-line bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-admin-ink">{driver.name}</h2>
                  <p className="text-sm text-admin-muted">
                    {driver.phone || 'No phone'}
                    {driver.email ? ` · ${driver.email}` : ''} · {driver.verificationStatus}
                  </p>
                </div>
                {driver.verificationStatus !== 'approved' ? (
                  <button
                    type="button"
                    className="admin-btn-primary text-sm"
                    onClick={() => {
                      setApproveTarget(driver);
                      setApproveIdentityOk(false);
                      setError('');
                    }}
                  >
                    Approve driver
                  </button>
                ) : (
                  <Link to="/drivers" className="text-xs font-medium text-admin-teal">
                    Approved · Ban/Unban on Drivers
                  </Link>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {driver.documents.map((card) => {
                  const uploaded = Boolean(card.fileUrl);
                  return (
                    <button
                      key={card.type}
                      type="button"
                      disabled={!uploaded}
                      onClick={() => {
                        setIdentityOk(false);
                        setRejectReason('');
                        uploaded && setPreview({ driver, card });
                      }}
                      className="rounded-2xl border border-admin-line p-3 text-left transition hover:border-admin-teal disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <p className="text-sm font-semibold text-admin-ink">{cardLabel(card.type)}</p>
                      {uploaded ? (
                        <div className="mt-2 overflow-hidden rounded-xl bg-slate-100">
                          {card.mimeType === 'application/pdf' ? (
                            <div className="flex h-36 items-center justify-center text-xs text-admin-muted">
                              PDF uploaded · Open
                            </div>
                          ) : (
                            <img
                              src={resolveMediaUrl(card.fileUrl!)}
                              alt={cardLabel(card.type)}
                              className="h-36 w-full object-cover"
                            />
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-admin-muted">Not uploaded yet</p>
                      )}
                      <p className="mt-2 text-[11px] uppercase tracking-wide text-admin-muted">
                        {uploaded ? card.status : 'missing'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {preview?.card.fileUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-admin-ink">
                  {cardLabel(preview.card.type)}
                </h3>
                <p className="text-sm text-admin-muted">
                  {preview.driver.name}
                  {preview.driver.phone ? ` · ${preview.driver.phone}` : ''}
                  {preview.card.fileName ? ` · ${preview.card.fileName}` : ''}
                </p>
              </div>
              <button type="button" className="admin-btn-ghost" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
            {preview.card.mimeType === 'application/pdf' ? (
              <iframe
                title={cardLabel(preview.card.type)}
                src={resolveMediaUrl(preview.card.fileUrl)}
                className="h-[55vh] w-full rounded-xl border border-admin-line"
              />
            ) : (
              <img
                src={resolveMediaUrl(preview.card.fileUrl)}
                alt={cardLabel(preview.card.type)}
                className="max-h-[50vh] w-full rounded-xl object-contain"
              />
            )}

            <label className="mt-4 flex items-start gap-2 text-sm text-admin-ink">
              <input
                type="checkbox"
                className="mt-1"
                checked={identityOk}
                onChange={(event) => setIdentityOk(event.target.checked)}
              />
              <span>
                I verified this file belongs to {preview.driver.name}
                {preview.driver.phone ? ` (${preview.driver.phone})` : ''} and matches their submitted
                details.
              </span>
            </label>

            <label className="mt-3 block text-sm font-medium text-admin-ink">
              Rejection reason (required only if rejecting)
              <textarea
                className="admin-input mt-1 min-h-[72px] w-full"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Describe what is wrong or inconsistent"
              />
            </label>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="admin-btn-ghost text-admin-rose"
                disabled={Boolean(busyId)}
                onClick={() => void verify('rejected')}
              >
                Reject document
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={Boolean(busyId) || !identityOk || preview.card.status === 'approved'}
                onClick={() => void verify('approved')}
              >
                {preview.card.status === 'approved' ? 'Verified' : 'Verify document'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {approveTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setApproveTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-admin-ink">Approve {approveTarget.name}</h3>
            <p className="mt-1 text-sm text-admin-muted">
              Approve only if Aadhaar, PAN, Driving License, and Profile Photo belong to the same
              person and the details are consistent. If they do not match, reject the documents or
              the driver.
            </p>
            <label className="mt-4 flex items-start gap-2 text-sm text-admin-ink">
              <input
                type="checkbox"
                className="mt-1"
                checked={approveIdentityOk}
                onChange={(event) => setApproveIdentityOk(event.target.checked)}
              />
              <span>
                I confirm all four documents belong to the same person and match this driver.
              </span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="admin-btn-ghost"
                onClick={() => {
                  setApproveTarget(null);
                  setApproveIdentityOk(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-primary"
                disabled={!approveIdentityOk || !approveTarget.documentsVerified}
                onClick={() => void approveDriver()}
              >
                Confirm Approve
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
