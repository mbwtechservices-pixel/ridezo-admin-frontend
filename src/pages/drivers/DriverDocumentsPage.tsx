import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { InspectableDocumentImage } from '@/components/documents/InspectableDocumentImage';
import {
  adminApi,
  type AdminDriverDocumentCard,
  type AdminDriverDocumentsRow,
  type AdminDriverVehicle,
  type AdminPendingVehicle,
} from '@/shared/api/admin.api';
import { resolveMediaUrl } from '@/shared/lib/media';
import { cn } from '@/shared/lib/cn';

const POLL_MS = 5000;

const CARD_LABELS: Record<string, string> = {
  driving_license: 'Driving License',
  aadhaar: 'Aadhaar Card',
  vehicle_insurance: 'Vehicle Insurance',
  insurance: 'Vehicle Insurance',
  vehicle_registration: 'Registration Certificate (RC)',
  rc: 'Registration Certificate (RC)',
  profile_photo: 'Profile Photo',
};

const DRIVER_DOCUMENT_ORDER = ['driving_license', 'aadhaar', 'profile_photo'] as const;

function cardLabel(type: string): string {
  return CARD_LABELS[type] ?? type;
}

function vehicleSectionTitle(type: string): string {
  if (type === 'bike') return 'Bike Details';
  if (type === 'auto') return 'Auto Details';
  return 'Car Details';
}

function documentImageSrc(card: AdminDriverDocumentCard, side: 'front' | 'back'): string | null {
  if (side === 'back') {
    const url = card.backImage || card.fileUrlBack;
    return url ? resolveMediaUrl(url) : null;
  }
  const url = card.frontImage || card.fileUrl;
  return url ? resolveMediaUrl(url) : null;
}

function orderedDriverDocuments(documents: AdminDriverDocumentCard[]): AdminDriverDocumentCard[] {
  return DRIVER_DOCUMENT_ORDER.map((type) => documents.find((doc) => doc.type === type)).filter(
    (doc): doc is AdminDriverDocumentCard => Boolean(doc),
  );
}

function driverVehicles(driver: AdminDriverDocumentsRow): AdminDriverVehicle[] {
  return driver.vehicles ?? [];
}

function pendingEdits(driver: AdminDriverDocumentsRow): AdminPendingVehicle[] {
  return (driver.pendingVehicles ?? (driver.pendingVehicle ? [driver.pendingVehicle] : [])).filter(
    (item) => item.intent === 'edit' || Boolean(item.replacesVehicleId),
  );
}

function isCardUploaded(card: AdminDriverDocumentCard): boolean {
  const twoSided = card.type !== 'profile_photo';
  const front = Boolean(card.frontImage || card.fileUrl);
  const back = Boolean(card.backImage || card.fileUrlBack);
  return twoSided ? front && back : front;
}

function nextUnverifiedCard(
  driver: AdminDriverDocumentsRow,
): { card: AdminDriverDocumentCard; pendingVehicleId?: string } | null {
  const identity = orderedDriverDocuments(driver.documents).find(
    (card) => isCardUploaded(card) && card.status !== 'approved',
  );
  if (identity) return { card: identity };
  for (const vehicle of driverVehicles(driver)) {
    const card = vehicle.documents.find((item) => isCardUploaded(item) && item.status !== 'approved');
    if (card) {
      return {
        card,
        pendingVehicleId: card.scope === 'pending_vehicle' ? vehicle.id : undefined,
      };
    }
  }
  for (const pending of pendingEdits(driver)) {
    const card = pending.documents.find((item) => isCardUploaded(item) && item.status !== 'approved');
    if (card) return { card, pendingVehicleId: pending.id };
  }
  return null;
}

function documentStatusLabel(status: string, uploaded: boolean): string {
  if (!uploaded) return 'missing';
  if (status === 'approved') return 'Verified';
  return status;
}

function DocumentThumb({
  card,
  onOpen,
}: {
  card: AdminDriverDocumentCard;
  onOpen: () => void;
}) {
  const twoSided = card.type !== 'profile_photo';
  const uploaded = isCardUploaded(card);
  const front = documentImageSrc(card, 'front');
  const back = documentImageSrc(card, 'back');
  return (
    <button
      type="button"
      disabled={!uploaded}
      onClick={() => uploaded && onOpen()}
      className="rounded-2xl border border-admin-line bg-white p-3 text-left transition hover:border-admin-teal disabled:cursor-not-allowed disabled:opacity-70"
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
              {front ? (
                <img
                  src={front}
                  alt={`${cardLabel(card.type)} front`}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="flex h-36 items-center justify-center text-xs text-admin-muted">
                  Front missing
                </div>
              )}
              {twoSided ? (
                back ? (
                  <img
                    src={back}
                    alt={`${cardLabel(card.type)} back`}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center text-xs text-admin-muted">
                    Back missing
                  </div>
                )
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
}

export function DriverDocumentsPage() {
  const [rows, setRows] = useState<AdminDriverDocumentsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rcPlateOk, setRcPlateOk] = useState(false);
  const [approveTarget, setApproveTarget] = useState<AdminDriverDocumentsRow | null>(null);
  const [approveIdentityOk, setApproveIdentityOk] = useState(false);
  const [preview, setPreview] = useState<{
    driver: AdminDriverDocumentsRow;
    card: AdminDriverDocumentCard;
    pendingVehicleId?: string;
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
          const vehicleDocs = driverVehicles(nextDriver).flatMap((item) => item.documents);
          const pendingDocs = (nextDriver.pendingVehicles ?? []).flatMap((item) => item.documents);
          const nextCard =
            nextDriver.documents.find((doc) => doc.id && doc.id === current.card.id) ??
            nextDriver.documents.find((doc) => doc.type === current.card.type && !current.pendingVehicleId) ??
            vehicleDocs.find((doc) => doc.id && doc.id === current.card.id) ??
            pendingDocs.find((doc) => doc.id === current.card.id);
          return nextCard
            ? {
                driver: nextDriver,
                card: nextCard,
                pendingVehicleId: current.pendingVehicleId,
              }
            : current;
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
    const isPendingVehicle = preview.card.scope === 'pending_vehicle' && preview.pendingVehicleId;
    if (
      status === 'approved' &&
      preview.card.type === 'vehicle_registration' &&
      !rcPlateOk
    ) {
      setError(
        'Confirm that the RC details and vehicle number match the registered vehicle before verifying.',
      );
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
      if (isPendingVehicle) {
        await adminApi.verifyPendingVehicleDocument(
          driverId,
          preview.pendingVehicleId!,
          preview.card.id,
          {
            status,
            note: status === 'rejected' ? rejectReason.trim() : undefined,
            vehiclePlateMatches:
              status === 'approved' && preview.card.type === 'vehicle_registration'
                ? true
                : undefined,
          },
        );
      } else {
        await adminApi.verifyDriverDocument(driverId, preview.card.id, {
          status,
          note: status === 'rejected' ? rejectReason.trim() : undefined,
          vehiclePlateMatches:
            status === 'approved' && preview.card.type === 'vehicle_registration'
              ? true
              : undefined,
        });
      }
      setRejectReason('');
      setRcPlateOk(false);
      const items = await load(true);
      const driver = items.find((row) => row.driverId === driverId);
      if (status === 'rejected' || !driver) {
        setPreview(null);
        return;
      }
      const next = nextUnverifiedCard(driver);
      if (next) {
        setPreview({
          driver,
          card: next.card,
          pendingVehicleId: next.pendingVehicleId,
        });
        return;
      }
      setPreview(null);
      const allVerified = driver.documentsVerified;
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
        'Verify all required documents first, including Vehicle RC. Do not approve if the details do not match.',
      );
      return;
    }
    if (!approveIdentityOk) {
      setError(
        'Confirm that Driving License, Aadhaar Card, Vehicle Insurance, Registration Certificate (RC), and Profile Photo match this driver before approving.',
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

  const openCard = (
    driver: AdminDriverDocumentsRow,
    card: AdminDriverDocumentCard,
    pendingVehicleId?: string,
  ) => {
    setRejectReason('');
    setRcPlateOk(false);
    setPreview({ driver, card, pendingVehicleId });
  };

  return (
    <div>
      <PageHeader
        title="Driver Documents"
        description="Open each file and verify it. Driver identity documents stay at the top. Each registered vehicle has its own details, insurance, and RC. Approve the account only after Driving License, Aadhaar Card, Vehicle Insurance, Registration Certificate (RC), and Profile Photo are confirmed."
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
                    {driver.email ? ` · ${driver.email}` : ''}
                    {(() => {
                      const active = driverVehicles(driver).find((item) => item.isActive);
                      if (active?.plate) {
                        return ` · Active ${active.type} · ${active.plate}`;
                      }
                      if (driver.vehiclePlate) return ` · ${driver.vehiclePlate}`;
                      return '';
                    })()}
                    {driver.verificationStatus === 'approved' ? ' · Verified' : ` · ${driver.verificationStatus}`}
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
              <h3 className="mb-3 text-sm font-semibold text-admin-ink">Driver documents</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {orderedDriverDocuments(driver.documents).map((card) => (
                  <DocumentThumb
                    key={card.type}
                    card={card}
                    onOpen={() => openCard(driver, card)}
                  />
                ))}
              </div>
              {driverVehicles(driver).map((vehicle) => {
                const relatedEdits = pendingEdits(driver).filter(
                  (item) => item.replacesVehicleId === vehicle.id,
                );
                return (
                  <div
                    key={vehicle.id}
                    className="mt-4 rounded-2xl border border-admin-line bg-slate-50 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-admin-ink">
                          {vehicleSectionTitle(vehicle.type)}
                        </h3>
                        <p className="mt-1 text-sm text-admin-muted">
                          {vehicle.type.toUpperCase()} · {vehicle.plate || 'No plate'} · {vehicle.make}{' '}
                          {vehicle.model} · {vehicle.year} · {vehicle.color}
                          {vehicle.verificationStatus !== 'approved'
                            ? ` · ${vehicle.verificationStatus === 'pending' ? 'Awaiting verification' : vehicle.verificationStatus}`
                            : ''}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          vehicle.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-admin-muted'
                        }`}
                      >
                        {vehicle.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {vehicle.documents.map((card) => (
                        <DocumentThumb
                          key={`${vehicle.id}-${card.type}`}
                          card={card}
                          onOpen={() =>
                            openCard(
                              driver,
                              card,
                              card.scope === 'pending_vehicle' ? vehicle.id : undefined,
                            )
                          }
                        />
                      ))}
                    </div>
                    {relatedEdits.map((pending) => (
                      <div
                        key={pending.id}
                        className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                      >
                        <h4 className="text-sm font-semibold text-admin-ink">Pending vehicle edit</h4>
                        <p className="mt-1 text-sm text-admin-muted">
                          Proposed {pending.type.toUpperCase()} · {pending.make} {pending.model} ·{' '}
                          {pending.year} · {pending.color} · {pending.plate}. The current verified
                          vehicle stays active until Admin approves these updated details, RC, and
                          insurance.
                        </p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {pending.documents.map((card) => (
                            <DocumentThumb
                              key={`${pending.id}-${card.type}`}
                              card={card}
                              onOpen={() => openCard(driver, card, pending.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
              {pendingEdits(driver)
                .filter(
                  (pending) =>
                    !driverVehicles(driver).some((vehicle) => vehicle.id === pending.replacesVehicleId),
                )
                .map((pending) => (
                  <div
                    key={pending.id}
                    className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
                  >
                    <h3 className="text-sm font-semibold text-admin-ink">Pending vehicle edit</h3>
                    <p className="mt-1 text-sm text-admin-muted">
                      {pending.type.toUpperCase()} · {pending.make} {pending.model} · {pending.year} ·{' '}
                      {pending.color} · {pending.plate}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {pending.documents.map((card) => (
                        <DocumentThumb
                          key={`${pending.id}-${card.type}`}
                          card={card}
                          onOpen={() => openCard(driver, card, pending.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
            </section>
          ))}
        </div>
      )}

      {preview && documentImageSrc(preview.card, 'front') ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-auto rounded-2xl bg-white p-5"
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
                src={documentImageSrc(preview.card, 'front')!}
                className="h-[55vh] w-full rounded-xl border border-admin-line"
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <InspectableDocumentImage
                  src={documentImageSrc(preview.card, 'front')!}
                  alt={`${cardLabel(preview.card.type)} front`}
                  caption={preview.card.type === 'profile_photo' ? 'Profile Photo' : 'Front side'}
                />
                {preview.card.type !== 'profile_photo' && documentImageSrc(preview.card, 'back') ? (
                  <InspectableDocumentImage
                    src={documentImageSrc(preview.card, 'back')!}
                    alt={`${cardLabel(preview.card.type)} back`}
                    caption="Back side"
                  />
                ) : null}
              </div>
            )}

            {preview.card.status === 'approved' ? (
              <p className="mt-4 text-sm font-medium text-admin-teal">Verified</p>
            ) : (
              <>
                {preview.card.type === 'vehicle_registration' ? (
                  <label className="mt-4 flex items-start gap-2 text-sm text-admin-ink">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={rcPlateOk}
                      onChange={(event) => setRcPlateOk(event.target.checked)}
                    />
                    <span>
                      I confirm the RC details and vehicle number match this vehicle
                      {(() => {
                        const pending = (
                          preview.driver.pendingVehicles ??
                          (preview.driver.pendingVehicle ? [preview.driver.pendingVehicle] : [])
                        ).find((item) => item.id === preview.pendingVehicleId);
                        const vehicle = driverVehicles(preview.driver).find(
                          (item) =>
                            item.id === preview.pendingVehicleId ||
                            item.id === preview.card.vehicleId,
                        );
                        const plate =
                          preview.card.vehiclePlate ||
                          pending?.plate ||
                          vehicle?.plate ||
                          preview.driver.vehiclePlate;
                        return plate ? ` (${plate})` : '';
                      })()}
                      .
                    </span>
                  </label>
                ) : null}
                {!preview.driver.vehiclePlate &&
                preview.card.type === 'vehicle_registration' &&
                !preview.pendingVehicleId &&
                driverVehicles(preview.driver).length === 0 ? (
                  <p className="mt-2 text-xs text-admin-rose">
                    This driver has no vehicle on file yet. Add the vehicle before verifying RC.
                  </p>
                ) : null}
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
                    disabled={
                      Boolean(busyId) ||
                      (preview.card.type === 'vehicle_registration' && !rcPlateOk)
                    }
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
              Approve only if Driving License, Aadhaar Card, Vehicle Insurance, Registration
              Certificate (RC), and Profile Photo match this driver. Vehicle RC must match the
              registered vehicle number.
            </p>
            <label className="mt-4 flex items-start gap-2 text-sm text-admin-ink">
              <input
                type="checkbox"
                className="mt-1"
                checked={approveIdentityOk}
                onChange={(event) => setApproveIdentityOk(event.target.checked)}
              />
              <span>
                I confirm Driving License, Aadhaar Card, Vehicle Insurance, Registration Certificate
                (RC), and Profile Photo match this driver.
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
