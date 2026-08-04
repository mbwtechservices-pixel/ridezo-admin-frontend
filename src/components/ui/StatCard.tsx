import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import type { StatusTone } from '@/shared/data/mock';

const tones: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-admin-emerald ring-emerald-200',
  warning: 'bg-amber-50 text-admin-amber ring-amber-200',
  danger: 'bg-rose-50 text-admin-rose ring-rose-200',
  info: 'bg-sky-50 text-admin-sky ring-sky-200',
  neutral: 'bg-slate-100 text-admin-muted ring-slate-200',
};

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: StatusTone;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset capitalize',
        tones[tone],
      )}
    >
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  trend?: string;
}) {
  return (
    <div className="admin-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-admin-muted">{label}</p>
          <p className="mt-2 font-sans text-2xl font-bold tracking-tight text-admin-ink">{value}</p>
          {(hint || trend) && (
            <p className="mt-2 text-xs text-admin-muted">
              {trend && <span className="font-semibold text-admin-emerald">{trend} </span>}
              {hint}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-admin-teal/10 text-admin-teal">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
