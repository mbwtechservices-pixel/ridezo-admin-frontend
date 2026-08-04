import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { FilterBar, SelectFilter } from '@/components/ui/FilterBar';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatCard';
import { AUDIT_LOGS, type AuditRow } from '@/shared/data/mock';
import { formatDate } from '@/shared/lib/cn';
import type { ExportColumn } from '@/shared/lib/export';

const col = createColumnHelper<AuditRow>();

export function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [success, setSuccess] = useState('all');

  const filtered = useMemo(
    () =>
      AUDIT_LOGS.filter((row) => {
        const q = search.toLowerCase();
        const matchesSearch =
          !q ||
          row.actor.toLowerCase().includes(q) ||
          row.resource.toLowerCase().includes(q) ||
          row.action.toLowerCase().includes(q) ||
          row.ip.includes(q);
        return (
          matchesSearch &&
          (action === 'all' || row.action === action) &&
          (success === 'all' ||
            (success === 'yes' ? row.success : !row.success))
        );
      }),
    [search, action, success],
  );

  const columns = useMemo(
    () => [
      col.accessor('createdAt', {
        header: 'Time',
        cell: (info) => formatDate(info.getValue()),
      }),
      col.accessor('actor', { header: 'Actor' }),
      col.accessor('actorType', { header: 'Type' }),
      col.accessor('action', { header: 'Action' }),
      col.accessor('resource', { header: 'Resource' }),
      col.accessor('ip', { header: 'IP' }),
      col.accessor('success', {
        header: 'Result',
        cell: (info) => (
          <StatusBadge
            label={info.getValue() ? 'success' : 'failed'}
            tone={info.getValue() ? 'success' : 'danger'}
          />
        ),
      }),
    ],
    [],
  );

  const exportCols: ExportColumn<AuditRow>[] = [
    { header: 'Time', accessor: (r) => formatDate(r.createdAt) },
    { header: 'Actor', accessor: (r) => r.actor },
    { header: 'Type', accessor: (r) => r.actorType },
    { header: 'Action', accessor: (r) => r.action },
    { header: 'Resource', accessor: (r) => r.resource },
    { header: 'IP', accessor: (r) => r.ip },
    { header: 'Success', accessor: (r) => (r.success ? 'yes' : 'no') },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Immutable trail of privileged and system actions."
        actions={
          <ExportButtons
            rows={filtered}
            columns={exportCols}
            filename="ridezo-audit-logs"
            title="Ridezo Audit Logs"
          />
        }
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search actor, action, resource, IP…"
        filters={
          <>
            <SelectFilter
              label="Action"
              value={action}
              onChange={setAction}
              options={[
                { value: 'all', label: 'All actions' },
                { value: 'LOGIN', label: 'LOGIN' },
                { value: 'UPDATE', label: 'UPDATE' },
                { value: 'CREATE', label: 'CREATE' },
                { value: 'DELETE', label: 'DELETE' },
                { value: 'EXPORT', label: 'EXPORT' },
                { value: 'REFUND', label: 'REFUND' },
              ]}
            />
            <SelectFilter
              label="Result"
              value={success}
              onChange={setSuccess}
              options={[
                { value: 'all', label: 'All results' },
                { value: 'yes', label: 'Success' },
                { value: 'no', label: 'Failed' },
              ]}
            />
          </>
        }
      />
      <DataTable data={filtered} columns={columns} />
    </div>
  );
}
