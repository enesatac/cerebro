import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo, type ReactNode } from 'react';
import { paths } from '@/app/router/paths';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { editColumn } from '@/components/data-display/editColumn';
import { useApplicationRefs } from '@/domains/applications/api/queries';
import { usePrivilege } from '@/domains/auth/api/queries';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { MasterLabel } from '@/domains/master-data/components/MasterLabel';
import { usePeopleById } from '@/domains/people/api/queries';
import { useProjectRefs } from '@/domains/projects/api/queries';
import { formatDate, toIsoDate } from '@/lib/dates';
import type { Release } from '../types';
import { awaitsOutcome, releaseWindow } from '../utils/releaseCalendar';
import { ReleaseDeleteAction } from './ReleaseDeleteAction';
import { ReleaseTitleCell } from './ReleaseTitleCell';

interface ReleaseTableProps {
  releases: readonly Release[];
  /** Hidden on an application's own tab. */
  showApplication?: boolean;
  /** Hidden on a project's own tab. */
  showProject?: boolean;
  emptyState: ReactNode;
}

/** Releases with their window, what goes live, where and in which state. */
export function ReleaseTable({
  releases,
  showApplication = true,
  showProject = true,
  emptyState,
}: ReleaseTableProps) {
  const applications = useApplicationRefs();
  const projects = useProjectRefs();
  const people = usePeopleById();
  const canEdit = usePrivilege('releases:edit');
  const today = toIsoDate(new Date());
  const columns = useMemo<TableColumnDef<Release>[]>(
    () => [
      {
        id: 'date',
        header: 'Tarih',
        width: 170,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <span>{formatDate(row.original.plannedDate)}</span>
            <span className="c-muted c-cell-stack__secondary">{releaseWindow(row.original)}</span>
          </span>
        ),
      },
      {
        id: 'release',
        header: 'Geçiş',
        width: 280,
        cell: ({ row }) => <ReleaseTitleCell release={row.original} />,
      },
      ...(showApplication
        ? [
            {
              id: 'application',
              header: 'Uygulama',
              width: 190,
              cell: ({ row }) => (
                <EntityLink to={paths.applications.detail(row.original.applicationId)}>
                  {applications.data?.get(row.original.applicationId)?.name ??
                    `#${row.original.applicationId}`}
                </EntityLink>
              ),
            } satisfies TableColumnDef<Release>,
          ]
        : []),
      ...(showProject
        ? [
            {
              id: 'project',
              header: 'Proje',
              width: 190,
              cell: ({ row }) =>
                row.original.projectId !== null ? (
                  <EntityLink to={paths.projects.detail(row.original.projectId)}>
                    {projects.data?.get(row.original.projectId)?.name ??
                      `#${row.original.projectId}`}
                  </EntityLink>
                ) : (
                  <span className="c-muted">—</span>
                ),
            } satisfies TableColumnDef<Release>,
          ]
        : []),
      {
        id: 'type',
        header: 'Tür',
        width: 140,
        cell: ({ row }) => <MasterLabel list="releaseTypes" code={row.original.type} />,
      },
      {
        id: 'status',
        header: 'Durum',
        width: 190,
        cell: ({ row }) => (
          <span className="c-inline-list">
            <MasterBadge list="releaseStatuses" code={row.original.status} context="Durum:" />
            {awaitsOutcome(row.original, today) && (
              <StatusBadge label="Sonucu girilmedi" variant="warning" />
            )}
            {row.original.serviceInterruption && (
              <StatusBadge label="Kesinti var" variant="danger" />
            )}
          </span>
        ),
      },
      {
        id: 'owner',
        header: 'Sorumlu',
        width: 160,
        cell: ({ row }) =>
          row.original.ownerId !== null
            ? (people.data?.get(row.original.ownerId)?.fullName ?? '—')
            : '—',
      },
      ...(canEdit
        ? [
            editColumn<Release>(
              (release) => paths.releases.edit(release.id),
              (release) => `${release.releaseNumber} ${release.title}`,
              (release) => <ReleaseDeleteAction record={release} compact />,
            ),
          ]
        : []),
    ],
    [showApplication, showProject, applications.data, projects.data, people.data, canEdit, today],
  );
  return (
    <Table
      data={[...releases]}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyState={emptyState}
    />
  );
}
