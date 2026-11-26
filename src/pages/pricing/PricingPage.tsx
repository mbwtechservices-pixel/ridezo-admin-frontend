import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  adminApi,
  type PricingConfig,
  type PricingReport,
  type SurgeRule,
} from '@/shared/api/admin.api';

const VEHICLE_TYPES = ['bike', 'auto', 'mini', 'sedan', 'suv', 'premium'];
const inr = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString('en-IN')}`;

const CONFIG_FIELDS: Array<{ key: keyof PricingConfig; label: string; hint: string; step?: string }> = [
  {
    key: 'minDriverWalletBalance',
    label: 'Minimum driver wallet (₹)',
    hint: 'Drivers below this balance cannot receive rides until they recharge.',
  },
  {
    key: 'platformChargePerRide',
    label: 'Platform charge per ride (₹)',
    hint: 'Flat charge taken from the driver on each ride (Per-Ride model).',
  },
  {
    key: 'commissionPercent',
    label: 'Commission / service charge (%)',
    hint: 'Percent of the customer fare (Per-Ride model). Driver earning = fare − all charges.',
    step: '0.1',
  },
  {
    key: 'additionalChargePerRide',
    label: 'Additional charge per ride (₹)',
    hint: 'Any extra flat charge per ride (Per-Ride model).',
  },
  {
    key: 'dailyCharge',
    label: 'Per-day charge (₹)',
    hint: 'Charged once per confirmation window when the driver picks Per-Day; no per-ride charges apply.',
  },
  {
    key: 'confirmationHours',
    label: 'Model confirmation window (hours)',
    hint: 'How long a driver’s Per-Ride / Per-Day choice stays valid (default 24).',
  },
];

interface RuleForm {
  id?: string;
  name: string;
  scope: 'all' | 'pincode';
  pincodes: string;
  vehicleTypes: string[];
  type: 'percent' | 'fixed';
  value: string;
  demandThreshold: string;
  startHour: string;
  endHour: string;
  isActive: boolean;
}

const EMPTY_RULE: RuleForm = {
  name: '',
  scope: 'all',
  pincodes: '',
  vehicleTypes: [],
  type: 'percent',
  value: '',
  demandThreshold: '0',
  startHour: '',
  endHour: '',
  isActive: true,
};

function ConfigPanel() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const c = await adminApi.getPricingConfig();
      setConfig(c);
      setDraft(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, String(v)])));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load pricing config');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const body = Object.fromEntries(
        CONFIG_FIELDS.map((f) => [f.key, Number(draft[f.key] ?? 0)]),
      ) as Partial<PricingConfig>;
      const next = await adminApi.updatePricingConfig(body);
      setConfig(next);
      setMessage('Saved. New values apply to the next ride and the next driver confirmation.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="admin-panel p-6">
      <h2 className="text-base font-semibold text-admin-ink">Driver charges &amp; wallet rules</h2>
      <p className="mt-1 text-sm text-admin-muted">
        Used for the driver ride request breakdown, trip settlement, and the 24-hour Per-Ride /
        Per-Day confirmation. Changes are validated and applied on the server.
      </p>
      {!config ? (
        <p className="mt-4 text-sm text-admin-muted">{error || 'Loading…'}</p>
      ) : (
        <>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {CONFIG_FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1.5 block text-sm font-medium text-admin-ink">{f.label}</span>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  step={f.step ?? '1'}
                  value={draft[f.key] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                />
                <span className="mt-1 block text-xs text-admin-muted">{f.hint}</span>
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" className="admin-btn-primary" disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save pricing rules'}
            </button>
            {message && <span className="text-sm text-admin-muted">{message}</span>}
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </>
      )}
    </section>
  );
}

function SurgePanel() {
  const [rules, setRules] = useState<SurgeRule[]>([]);
  const [form, setForm] = useState<RuleForm | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRules(await adminApi.listSurgeRules());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load surge rules');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const edit = (rule: SurgeRule) =>
    setForm({
      id: rule.id,
      name: rule.name,
      scope: rule.scope,
      pincodes: rule.pincodes.join(', '),
      vehicleTypes: rule.vehicleTypes,
      type: rule.type,
      value: String(rule.value),
      demandThreshold: String(rule.demandThreshold),
      startHour: rule.startHour === null ? '' : String(rule.startHour),
      endHour: rule.endHour === null ? '' : String(rule.endHour),
      isActive: rule.isActive,
    });

  const save = async () => {
    if (!form) return;
    setBusy(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        scope: form.scope,
        pincodes: form.scope === 'pincode' ? form.pincodes.split(/[\s,]+/).filter(Boolean) : [],
        vehicleTypes: form.vehicleTypes,
        type: form.type,
        value: Number(form.value),
        demandThreshold: Number(form.demandThreshold || 0),
        startHour: form.startHour === '' ? null : Number(form.startHour),
        endHour: form.endHour === '' ? null : Number(form.endHour),
        isActive: form.isActive,
      };
      if (form.id) await adminApi.updateSurgeRule(form.id, body);
      else await adminApi.createSurgeRule(body);
      setForm(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save rule');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (rule: SurgeRule) => {
    setError('');
    try {
      await adminApi.updateSurgeRule(rule.id, { isActive: !rule.isActive });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update rule');
    }
  };

  const remove = async (rule: SurgeRule) => {
    if (!window.confirm(`Delete surge rule “${rule.name}”?`)) return;
    try {
      await adminApi.deleteSurgeRule(rule.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete rule');
    }
  };

  return (
    <section className="admin-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-admin-ink">Surge rules</h2>
          <p className="mt-1 text-sm text-admin-muted">
            Surge is always shown to the customer before booking and to the driver on the request.
            When several rules match, the highest surge applies.
          </p>
        </div>
        <button type="button" className="admin-btn-primary" onClick={() => setForm({ ...EMPTY_RULE })}>
          Add surge rule
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {form && (
        <div className="mt-5 grid gap-4 rounded-2xl border border-admin-line p-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Rule name</span>
            <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Applies to</span>
            <select
              className="admin-input"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value as 'all' | 'pincode' })}
            >
              <option value="all">All service areas</option>
              <option value="pincode">Specific service-area pincodes</option>
            </select>
          </label>
          {form.scope === 'pincode' && (
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block text-admin-muted">Pincodes (comma separated)</span>
              <input
                className="admin-input"
                placeholder="560001, 560034"
                value={form.pincodes}
                onChange={(e) => setForm({ ...form, pincodes: e.target.value })}
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">Surge type</span>
            <select
              className="admin-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}
            >
              <option value="percent">Percentage of fare</option>
              <option value="fixed">Fixed amount (₹)</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">
              Value {form.type === 'percent' ? '(%)' : '(₹)'}
            </span>
            <input
              className="admin-input"
              type="number"
              min={0}
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-admin-muted">
              Demand trigger — open requests in pickup pincode (0 = always)
            </span>
            <input
              className="admin-input"
              type="number"
              min={0}
              value={form.demandThreshold}
              onChange={(e) => setForm({ ...form, demandThreshold: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <label className="block">
              <span className="mb-1 block text-admin-muted">From hour (IST, 0-23)</span>
              <input
                className="admin-input"
                type="number"
                min={0}
                max={23}
                value={form.startHour}
                onChange={(e) => setForm({ ...form, startHour: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-admin-muted">To hour (IST, 0-23)</span>
              <input
                className="admin-input"
                type="number"
                min={0}
                max={23}
                value={form.endHour}
                onChange={(e) => setForm({ ...form, endHour: e.target.value })}
              />
            </label>
          </div>
          <div className="text-sm md:col-span-2">
            <span className="mb-1 block text-admin-muted">Vehicle types (none selected = all)</span>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_TYPES.map((t) => {
                const on = form.vehicleTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    className={on ? 'admin-btn-primary' : 'admin-btn-ghost'}
                    onClick={() =>
                      setForm({
                        ...form,
                        vehicleTypes: on
                          ? form.vehicleTypes.filter((v) => v !== t)
                          : [...form.vehicleTypes, t],
                      })
                    }
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
          <div className="flex gap-3 md:col-span-2">
            <button type="button" className="admin-btn-primary" disabled={busy} onClick={() => void save()}>
              {busy ? 'Saving…' : form.id ? 'Update rule' : 'Create rule'}
            </button>
            <button type="button" className="admin-btn-ghost" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase text-admin-muted">
            <tr>
              <th className="py-2 pr-3">Rule</th>
              <th className="py-2 pr-3">Area</th>
              <th className="py-2 pr-3">Surge</th>
              <th className="py-2 pr-3">Conditions</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-admin-muted">
                  No surge rules. Customers are charged the normal fare.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="border-t border-admin-line">
                  <td className="py-2 pr-3 font-medium text-admin-ink">{rule.name}</td>
                  <td className="py-2 pr-3">
                    {rule.scope === 'all' ? 'All areas' : rule.pincodes.join(', ')}
                  </td>
                  <td className="py-2 pr-3">
                    {rule.type === 'percent' ? `+${rule.value}%` : `+₹${rule.value}`}
                  </td>
                  <td className="py-2 pr-3 text-xs text-admin-muted">
                    {rule.vehicleTypes.length ? rule.vehicleTypes.join(', ') : 'All vehicles'}
                    {rule.demandThreshold > 0 ? ` · ≥${rule.demandThreshold} open requests` : ''}
                    {rule.startHour !== null && rule.endHour !== null
                      ? ` · ${rule.startHour}:00–${rule.endHour}:59 IST`
                      : ''}
                  </td>
                  <td className="py-2 pr-3">{rule.isActive ? 'Active' : 'Off'}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button type="button" className="admin-btn-ghost" onClick={() => edit(rule)}>
                        Edit
                      </button>
                      <button type="button" className="admin-btn-ghost" onClick={() => void toggle(rule)}>
                        {rule.isActive ? 'Turn off' : 'Turn on'}
                      </button>
                      <button type="button" className="admin-btn-ghost" onClick={() => void remove(rule)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ReportPanel() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<PricingReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getPricingReport(days)
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load report');
      });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const s = report?.summary;
  const cards: Array<[string, string]> = s
    ? [
        ['Rides settled', String(s.rides)],
        ['Customer payments', inr(s.customerPaid)],
        ['Surge collected', inr(s.surgeCollected)],
        ['Driver earnings', inr(s.driverEarnings)],
        ['Platform charges', inr(s.platformCharges)],
        ['Commission', inr(s.commission)],
        ['Additional charges', inr(s.additionalCharges)],
        ['Per-day charges', inr(s.dailyCharges)],
        ['Platform revenue', inr(s.platformRevenue)],
      ]
    : [];

  return (
    <section className="admin-panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-admin-ink">Revenue split</h2>
          <p className="mt-1 text-sm text-admin-muted">
            Customer payments, surge, driver earnings and platform revenue are stored separately.
          </p>
        </div>
        <select className="admin-input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[7, 30, 90, 365].map((d) => (
            <option key={d} value={d}>
              Last {d} days
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {s && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-admin-line p-3">
              <p className="text-xs text-admin-muted">{label}</p>
              <p className="mt-1 text-lg font-semibold text-admin-ink">{value}</p>
            </div>
          ))}
        </div>
      )}
      {report && report.rides.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase text-admin-muted">
              <tr>
                <th className="py-2 pr-3">Settled</th>
                <th className="py-2 pr-3">Pincode</th>
                <th className="py-2 pr-3">Base</th>
                <th className="py-2 pr-3">Surge</th>
                <th className="py-2 pr-3">Customer paid</th>
                <th className="py-2 pr-3">Model</th>
                <th className="py-2 pr-3">Platform</th>
                <th className="py-2">Driver</th>
              </tr>
            </thead>
            <tbody>
              {report.rides.map((r) => (
                <tr key={r.id} className="border-t border-admin-line">
                  <td className="py-2 pr-3">{new Date(r.settledAt).toLocaleString('en-IN')}</td>
                  <td className="py-2 pr-3">{r.pincode ?? '—'}</td>
                  <td className="py-2 pr-3">{inr(r.baseFare)}</td>
                  <td className="py-2 pr-3">{r.surgeFee > 0 ? inr(r.surgeFee) : '—'}</td>
                  <td className="py-2 pr-3">{inr(r.customerFare)}</td>
                  <td className="py-2 pr-3">{r.chargeModel === 'per_day' ? 'Per-Day' : 'Per-Ride'}</td>
                  <td className="py-2 pr-3">
                    {inr(r.platformCharge + r.commission + r.additionalCharge)}
                  </td>
                  <td className="py-2">{inr(r.driverNet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function PricingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing & Surge"
        description="Driver wallet threshold, platform charges, per-day charge, surge rules and revenue reports."
      />
      <ConfigPanel />
      <SurgePanel />
      <ReportPanel />
    </div>
  );
}
