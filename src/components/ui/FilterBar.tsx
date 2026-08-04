import { Search } from 'lucide-react';
import type { ReactNode } from 'react';

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
  trailing,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="admin-panel mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
      <label className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
        <input
          className="admin-input pl-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </label>
      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      {trailing && <div className="flex flex-wrap items-center gap-2 lg:ml-auto">{trailing}</div>}
    </div>
  );
}

export function SelectFilter({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-admin-muted">
      {label && <span className="hidden sm:inline">{label}</span>}
      <select
        className="admin-input w-auto min-w-[140px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
