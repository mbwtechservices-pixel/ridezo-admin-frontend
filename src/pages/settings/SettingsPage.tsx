import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

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
      { key: 'maintenance', label: 'Maintenance mode', type: 'toggle', value: false },
    ],
  },
];

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
