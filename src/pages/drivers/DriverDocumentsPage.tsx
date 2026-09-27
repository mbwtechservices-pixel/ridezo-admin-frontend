import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  adminApi,
  type AdminDriverDocumentCard,
  type AdminDriverDocumentsRow,
} from '@/shared/api/admin.api';
import { resolveMediaUrl } from '@/shared/lib/media';
import { cn } from '@/shared/lib/cn';

const POLL_MS = 5000;

const CARD_LABELS: Record<string, string> = {
  driving_license: 'Driving License',
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  profile_photo: 'Profile Photo',
};

const DOCUMENT_ORDER = ['driving_license', 'aadhaar', 'pan', 'profile_photo'] as const;

function cardLabel(type: string): string {
  return CARD_LABELS[type] ?? type;
}

function orderedDocuments(documents: AdminDriverDocumentCard[]): AdminDriverDocumentCard[] {
  return DOCUMENT_ORDER.map((type) => documents.find((doc) => doc.type === type)).filter(
    (doc): doc is AdminDriverDocumentCard => Boolean(doc),
  );
}

function isCardUploaded(card: AdminDriverDocumentCard): boolean {
  const twoSided = card.type !== 'profile_photo';
  const front = Boolean(card.frontImage || card.fileUrl);
  const back = Boolean(card.backImage || card.fileUrlBack);
  return twoSided ? front && back : front;
}

function nextUnverifiedCard(driver: AdminDriverDocumentsRow): AdminDriverDocumentCard | null {
  return (
    orderedDocuments(driver.documents).find((card) => isCardUploaded(card) && card.status !== 'approved') ??
    null
  );
}

function documentStatusLabel(status: string, uploaded: boolean): string {
  if (!uploaded) return 'missing';
  if (status === 'approved') return 'Verified';
  return status;
}

export function DriverDocumentsPage() {
  const [rows, setRows] = useState<AdminDriverDocumentsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveTarget, setApproveTarget] = useState<AdminDriverDocumentsRow | null>(null);
  const [approveIdentityOk, setApproveIdentityOk] = useState(false);
  const [preview, setPreview] = useState<{
    driver: AdminDriverDocumentsRow;
    card: AdminDriverDocumentCard;
  } | null>(null);
  const skipPreviewSync = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError('');
    try {
      const result = await adminApi.listDriverDocuments();
      const items = result.items;
      setRows(items);
      if (!skipPreviewSync.current) {
        setPreview((current) => {
          if (!current) return current;
          const nextDriver = items.find((row) => row.driverId === current.driver.driverId);
          if (!nextDriver) return current;
          const nextCard = nextDriver.documents.find((doc) => doc.type === current.card.type);
          return nextCard ? { driver: nextDriver, card: nextCard } : current;
        });
      }
      return items;
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Could not load driver documents');
      }
      return [] as AdminDriverDocumentsRow[];
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
    if (status === 'approved' && preview.card.status === 'approved') {
      return;
    }
    if (status === 'rejected' && rejectReason.trim().length < 5) {
      setError('Enter a rejection reason (at least 5 characters).');
      return;
    }
    const driverId = preview.driver.driverId;
    setBusyId(preview.card.id);
    setError('');
    skipPreviewSync.current = true;
    try {
      await adminApi.verifyDriverDocument(driverId, preview.card.id, {
        status,
        note: status === 'rejected' ? rejectReason.trim() : undefined,
      });
      setRejectReason('');
      const items = await load(true);
      const driver = items.find((row) => row.driverId === driverId);
      if (status === 'rejected' || !driver) {
        setPreview(null);
        return;
      }
      const next = nextUnverifiedCard(driver);
      if (next) {
        setPreview({ driver, card: next });
        return;
      }
      setPreview(null);
      const allVerified = orderedDocuments(driver.documents).every((doc) => doc.status === 'approved');
      if (allVerified && driver.verificationStatus !== 'approved') {
        await adminApi.updateDriverVerification(driver.driverId, 'approved', {
          identityConfirmed: true,
        });
        await load(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update document');
    } finally {
      skipPreviewSync.current = false;
      setBusyId(null);
    }
  };

  const approveDriver = async () => {
    if (!approveTarget) return;
    const mismatch = approveTarget.documents.some((doc) => {
      const twoSided = doc.type !== 'profile_photo';
      const filesOk = twoSided ? Boolean(doc.fileUrl) && Boolean(doc.fileUrlBack) : Boolean(doc.fileUrl);
      return !filesOk || doc.status !== 'approved';
    });
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
                    {driver.email ? ` · ${driver.email}` : ''} ·{' '}
                    {driver.verificationStatus === 'approved' ? 'Verified' : driver.verificationStatus}
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
                {orderedDocuments(driver.documents).map((card) => {
                  const twoSided = card.type !== 'profile_photo';
                  const uploaded = isCardUploaded(card);
                  return (
                    <button
                      key={card.type}
                      type="button"
                      disabled={!uploaded}
                      onClick={() => {
                        setRejectReason('');
                        uploaded && setPreview({ driver, card });
                      }}
                      className="rounded-2xl border border-admin-line p-3 text-left transition hover:border-admin-teal disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <p className="text-sm font-semibold text-admin-ink">{cardLabel(card.type)}</p>
                      {uploaded ? (
                        <div
                          className={cn(
                            'mt-2 overflow-hidden rounded-xl bg-slate-100',
                            twoSided && 'grid grid-cols-2 gap-1',
                          )}
                        >
                          {card.mimeType === 'application/pdf' ? (
                            <div className="col-span-2 flex h-36 items-center justify-center text-xs text-admin-muted">
                              PDF uploaded · Open
                            </div>
                          ) : (
                            <>
                              <img
                                src={resolveMediaUrl(card.fileUrl!)}
                                alt={`${cardLabel(card.type)} front`}
                                className="h-36 w-full object-cover"
                              />
                              {twoSided && card.fileUrlBack ? (
                                <img
                                  src={resolveMediaUrl(card.fileUrlBack)}
                                  alt={`${cardLabel(card.type)} back`}
                                  className="h-36 w-full object-cover"
                                />
                              ) : null}
                            </>
                          )}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-admin-muted">Not uploaded yet</p>
                      )}
                      <p className="mt-2 text-[11px] uppercase tracking-wide text-admin-muted">
                        {documentStatusLabel(card.status, uploaded)}
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
              <div className="grid gap-3 md:grid-cols-2">
                <figure>
                  <figcaption className="mb-1 text-xs font-medium text-admin-muted">Front side</figcaption>
                  <img
                    src={resolveMediaUrl(preview.card.fileUrl)}
                    alt={`${cardLabel(preview.card.type)} front`}
                    className="max-h-[50vh] w-full rounded-xl object-contain"
                  />
                </figure>
                {preview.card.type !== 'profile_photo' && preview.card.fileUrlBack ? (
                  <figure>
                    <figcaption className="mb-1 text-xs font-medium text-admin-muted">Back side</figcaption>
                    <img
                      src={resolveMediaUrl(preview.card.fileUrlBack)}
                      alt={`${cardLabel(preview.card.type)} back`}
                      className="max-h-[50vh] w-full rounded-xl object-contain"
                    />
                  </figure>
                ) : null}
              </div>
            )}

            {preview.card.status === 'approved' ? (
              <p className="mt-4 text-sm font-medium text-admin-teal">Verified</p>
            ) : (
              <>
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
                    disabled={Boolean(busyId)}
                    onClick={() => void verify('approved')}
                  >
                    Verify
                  </button>
                </div>
              </>
            )}
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
