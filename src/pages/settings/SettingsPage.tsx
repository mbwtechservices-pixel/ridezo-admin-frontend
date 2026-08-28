import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { adminApi, type AppAvailability, type AdsBannersSetting, type Greetings, type ReferralCommissions } from '@/shared/api/admin.api';

function friendlySettingsError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : fallback;
  if (
    message === 'Network Error' ||
    message.includes('Cannot reach the Ridezo API') ||
    message.includes('ERR_NETWORK')
  ) {
    return 'Could not reach the Ridezo API. Check that the backend is running.';
  }
  return message || fallback;
}

interface SettingGroup {
  title: string;
  description: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'toggle';
    value: string | number | boolean;
  }>;
}

const INITIAL: SettingGroup[] = [
  {
    title: 'General',
    description: 'Brand and platform defaults',
    fields: [
      { key: 'appName', label: 'App name', type: 'text', value: 'Ridezo' },
      { key: 'supportEmail', label: 'Support email', type: 'text', value: 'support@ridezo.com' },
      { key: 'defaultCity', label: 'Default city', type: 'text', value: 'Bengaluru' },
    ],
  },
  {
    title: 'Ride economics',
    description: 'Base fare and commission controls',
    fields: [
      { key: 'baseFare', label: 'Base fare (₹)', type: 'number', value: 49 },
      { key: 'commission', label: 'Platform commission (%)', type: 'number', value: 18 },
      { key: 'cancelFee', label: 'Cancel fee (₹)', type: 'number', value: 30 },
    ],
  },
  {
    title: 'Feature flags',
    description: 'Toggle operational features',
    fields: [
      { key: 'surge', label: 'Surge pricing', type: 'toggle', value: true },
      { key: 'wallet', label: 'Wallet payments', type: 'toggle', value: true },
    ],
  },
];

const GREETING_MAX = 60;

function GreetingsPanel() {
  const [greetings, setGreetings] = useState<Greetings>({ user: '', driver: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setGreetings(await adminApi.getGreetings());
    } catch (err) {
      setError(friendlySettingsError(err, 'Could not load greetings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      setGreetings(await adminApi.updateGreetings(greetings));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(friendlySettingsError(err, 'Could not save greetings'));
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<{ key: keyof Greetings; label: string; hint: string }> = [
    { key: 'user', label: 'Rider app greeting', hint: 'Shown above the rider name on Home' },
    { key: 'driver', label: 'Driver app greeting', hint: 'Shown above the driver name on Dashboard' },
  ];

  const isEmpty = fields.some((f) => !greetings[f.key].trim());

  return (
    <section className="admin-panel p-6">
      <h2 className="text-base font-semibold text-admin-ink">Home screen greetings</h2>
      <p className="mt-1 text-sm text-admin-muted">
        The label shown above each user&apos;s name when they open the app.
      </p>

      {loading ? (
        <p className="mt-5 text-sm text-admin-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1.5 block text-sm font-medium text-admin-muted">
                  {field.label}
                </span>
                <input
                  className="admin-input"
                  type="text"
                  maxLength={GREETING_MAX}
                  value={greetings[field.key]}
                  onChange={(e) => {
                    setGreetings((prev) => ({ ...prev, [field.key]: e.target.value }));
                    setSaved(false);
                  }}
                />
                <span className="mt-1 block text-xs text-admin-muted">
                  {field.hint} · {greetings[field.key].length}/{GREETING_MAX}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              className="admin-btn-primary"
              disabled={saving || isEmpty}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save greetings'}
            </button>
            {isEmpty && <span className="text-sm text-admin-muted">Greetings cannot be empty.</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </>
      )}
    </section>
  );
}

function AdsBannerPanel() {
  const [setting, setSetting] = useState<AdsBannersSetting>({ enabled: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSetting(await adminApi.getAdsBannersEnabled());
    } catch (err) {
      setError(friendlySettingsError(err, 'Could not load ads banner setting'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    const next = !setting.enabled;
    setSaving(true);
    setError('');
    try {
      setSetting(await adminApi.updateAdsBannersEnabled({ enabled: next }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(friendlySettingsError(err, 'Could not update ads banner setting'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel p-6">
      <h2 className="text-base font-semibold text-admin-ink">Ads Banner</h2>
      <p className="mt-1 text-sm text-admin-muted">
        When ON, active ad banners appear on the User app Home screen near Saved and Recent
        Places. When OFF, ads are hidden completely. Upload and manage banner images on the{' '}
        <Link to="/ad-banners" className="font-medium text-admin-teal underline">
          Ad Banners
        </Link>{' '}
        page.
      </p>

      {loading ? (
        <p className="mt-5 text-sm text-admin-muted">Loading…</p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-admin-ink">
                {setting.enabled ? 'Ads are visible in the User app' : 'Ads are hidden'}
              </p>
              <p className="mt-0.5 text-xs text-admin-muted">
                Toggle ON to show uploaded banners · Toggle OFF to hide all ads
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={setting.enabled}
              disabled={saving}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                setting.enabled ? 'bg-admin-teal' : 'bg-slate-300'
              }`}
              onClick={() => void toggle()}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${
                  setting.enabled ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          {saved && <p className="text-sm text-admin-teal">Ads banner setting saved.</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </section>
  );
}

function AppAvailabilityPanel() {
  const [availability, setAvailability] = useState<AppAvailability>({
    unavailable: false,
    message: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAvailability(await adminApi.getAppAvailability());
    } catch (err) {
      setError(friendlySettingsError(err, 'Could not load app availability'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    const next = !availability.unavailable;
    setSaving(true);
    setError('');
    try {
      setAvailability(await adminApi.updateAppAvailability({ unavailable: next }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(friendlySettingsError(err, 'Could not update app availability'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel p-6">
      <h2 className="text-base font-semibold text-admin-ink">App Availability</h2>
      <p className="mt-1 text-sm text-admin-muted">
        Visible only to Admin. When turned ON, User and Driver apps show a friendly temporary
        unavailable message and cannot be used. When OFF, both apps work normally. The Admin
        panel stays available either way.
      </p>

      {loading ? (
        <p className="mt-5 text-sm text-admin-muted">Loading…</p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-admin-ink">
                {availability.unavailable
                  ? 'Apps are temporarily unavailable'
                  : 'Apps are available'}
              </p>
              <p className="mt-0.5 text-xs text-admin-muted">
                Toggle ON to disable User &amp; Driver apps · Toggle OFF to restore access
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={availability.unavailable}
              aria-label="App Availability"
              disabled={saving}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                availability.unavailable ? 'bg-admin-teal' : 'bg-slate-300'
              }`}
              onClick={() => void toggle()}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${
                  availability.unavailable ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {availability.unavailable && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                Message shown to Users &amp; Drivers
              </p>
              <p className="mt-1 text-sm text-admin-ink">{availability.message}</p>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm">
            {saving && <span className="text-admin-muted">Saving…</span>}
            {saved && <span className="text-admin-teal">Saved</span>}
            {error && <span className="text-red-600">{error}</span>}
          </div>
        </div>
      )}
    </section>
  );
}

function ReferralCommissionPanel() {
  const [commissions, setCommissions] = useState<ReferralCommissions>({
    userToUser: 50,
    userToDriver: 100,
    driverToAny: 75,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCommissions(await adminApi.getReferralCommissions());
    } catch (err) {
      setError(friendlySettingsError(err, 'Could not load referral commissions'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      setCommissions(await adminApi.updateReferralCommissions(commissions));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(friendlySettingsError(err, 'Could not save referral commissions'));
    } finally {
      setSaving(false);
    }
  };

  const fields: Array<{
    key: keyof ReferralCommissions;
    label: string;
    hint: string;
  }> = [
    {
      key: 'userToUser',
      label: 'User → User',
      hint: 'Ridezo Wallet credits when a user refers another user',
    },
    {
      key: 'userToDriver',
      label: 'User → Driver',
      hint: 'Ridezo Wallet credits when a user refers a driver',
    },
    {
      key: 'driverToAny',
      label: 'Driver → User / Driver',
      hint: 'Ridezo Wallet credits when a driver refers a user or driver',
    },
  ];

  const invalid = fields.some((f) => !Number.isFinite(commissions[f.key]) || commissions[f.key] < 0);

  return (
    <section className="admin-panel p-6">
      <h2 className="text-base font-semibold text-admin-ink">Referral Commission</h2>
      <p className="mt-1 text-sm text-admin-muted">
        Set Ridezo Wallet credit amounts for each referral type. Rewards are credited to the
        referrer&apos;s wallet after the referred person completes their first successful trip.
      </p>

      {loading ? (
        <p className="mt-5 text-sm text-admin-muted">Loading…</p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1.5 block text-sm font-medium text-admin-muted">
                  {field.label}
                </span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  step={1}
                  value={commissions[field.key]}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setCommissions((prev) => ({
                      ...prev,
                      [field.key]: Number.isFinite(next) ? next : 0,
                    }));
                    setSaved(false);
                  }}
                />
                <span className="mt-1 block text-xs text-admin-muted">{field.hint}</span>
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              className="admin-btn-primary"
              disabled={saving || invalid}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save commissions'}
            </button>
            {invalid && (
              <span className="text-sm text-admin-muted">Amounts must be zero or greater.</span>
            )}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </>
      )}
    </section>
  );
}

export function SettingsPage() {
  const [groups, setGroups] = useState(INITIAL);
  const [saved, setSaved] = useState(false);

  const updateField = (groupIdx: number, fieldKey: string, value: string | number | boolean) => {
    setGroups((prev) =>
      prev.map((group, gi) =>
        gi !== groupIdx
          ? group
          : {
              ...group,
              fields: group.fields.map((f) =>
                f.key === fieldKey ? { ...f, value } : f,
              ),
            },
      ),
    );
    setSaved(false);
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Platform configuration and feature flags."
        actions={
          <button
            type="button"
            className="admin-btn-primary"
            onClick={() => {
              setSaved(true);
              window.setTimeout(() => setSaved(false), 2000);
            }}
          >
            {saved ? 'Saved' : 'Save changes'}
          </button>
        }
      />

      <div className="space-y-4">
        <AppAvailabilityPanel />
        <AdsBannerPanel />
        <ReferralCommissionPanel />
        <GreetingsPanel />

        {groups.map((group, gi) => (
          <section key={group.title} className="admin-panel p-6">
            <h2 className="text-base font-semibold text-admin-ink">{group.title}</h2>
            <p className="mt-1 text-sm text-admin-muted">{group.description}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {group.fields.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-1.5 block text-sm font-medium text-admin-muted">
                    {field.label}
                  </span>
                  {field.type === 'toggle' ? (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(field.value)}
                      className={`relative h-7 w-12 rounded-full transition-colors ${
                        field.value ? 'bg-admin-teal' : 'bg-slate-300'
                      }`}
                      onClick={() => updateField(gi, field.key, !field.value)}
                    >
                      <span
                        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-all ${
                          field.value ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  ) : (
                    <input
                      className="admin-input"
                      type={field.type}
                      value={String(field.value)}
                      onChange={(e) =>
                        updateField(
                          gi,
                          field.key,
                          field.type === 'number' ? Number(e.target.value) : e.target.value,
                        )
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
