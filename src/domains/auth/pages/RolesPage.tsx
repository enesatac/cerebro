import { Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useMemo } from 'react';
import { paths } from '@/app/router/paths';
import { ExcelExportButton } from '@/components/actions/ExcelExportButton';
import { editColumn } from '@/components/data-display/editColumn';
import { EntityLink } from '@/components/data-display/EntityLink';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { DetailTabs } from '@/components/layout/DetailTabs';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { useTabParam } from '@/hooks/useTabParam';
import { sheet, type SheetSpec } from '@/lib/xlsxTypes';
import { usePrivilege, useRoles } from '../api/queries';
import { CreateAction } from '../components/RecordActions';
import { RoleDeleteAction } from '../components/RoleDeleteAction';
import {
  PRIVILEGE_GROUPS,
  PRIVILEGE_MODULES,
  PRIVILEGES,
  type AccessLevel,
  type Privilege,
  type Role,
} from '../types';
import { levelOn } from '../utils/permissions';
import { ACCESS_LEVEL_PRESENTATION, accessSummary } from '../utils/rolePresentation';

const TAB_IDS = ['roles', 'matrix', 'catalog'] as const;

type ModuleRow = (typeof PRIVILEGE_MODULES)[number];
const GROUP_LABEL = new Map<string, string>(PRIVILEGE_GROUPS.map((g) => [g.id, g.label]));
const levelLabel = (level: AccessLevel | null) => ACCESS_LEVEL_PRESENTATION[level ?? 'none'].label;

function LevelBadge({ level }: { level: AccessLevel | null }) {
  return level ? (
    <StatusBadge
      {...ACCESS_LEVEL_PRESENTATION[level]}
      label={ACCESS_LEVEL_PRESENTATION[level].short}
    />
  ) : (
    <span className="c-muted">—</span>
  );
}

function RoleList({ roles }: { roles: Role[] }) {
  const canEdit = usePrivilege('roles:edit');
  const columns = useMemo<TableColumnDef<Role>[]>(
    () => [
      {
        id: 'name',
        header: 'Rol',
        width: 320,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <EntityLink to={paths.admin.editRole(row.original.id)}>{row.original.name}</EntityLink>
            <span className="c-muted c-cell-stack__secondary">{row.original.description}</span>
          </span>
        ),
      },
      {
        id: 'type',
        header: 'Tür',
        width: 120,
        cell: ({ row }) =>
          row.original.system ? (
            <StatusBadge label="Sistem rolü" variant="primary" />
          ) : (
            <StatusBadge label="Özel" variant="neutral" />
          ),
      },
      {
        id: 'users',
        header: 'Kullanıcı',
        width: 100,
        align: 'end',
        cell: ({ row }) => row.original.userCount,
      },
      {
        id: 'reach',
        header: 'Kapsam',
        cell: ({ row }) => accessSummary(row.original.privileges),
      },
      ...(canEdit
        ? [
            editColumn<Role>(
              (role) => paths.admin.editRole(role.id),
              (role) => role.name,
              (role) => <RoleDeleteAction record={role} compact />,
            ),
          ]
        : []),
    ],
    [canEdit],
  );
  return (
    <Table
      data={roles}
      columns={columns}
      getRowId={(row) => String(row.id)}
      emptyState={<EmptyState compact title="Henüz rol yok" />}
    />
  );
}

/** Screens down the side, roles across the top, the level each role has on each screen. */
function PrivilegeMatrix({ roles }: { roles: Role[] }) {
  const columns = useMemo<TableColumnDef<ModuleRow>[]>(
    () => [
      {
        id: 'module',
        header: 'Ekran',
        width: 240,
        sticky: 'left',
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <strong>{row.original.label}</strong>
            <span className="c-muted c-cell-stack__secondary">
              {GROUP_LABEL.get(row.original.group)}
            </span>
          </span>
        ),
      },
      ...roles.map((role): TableColumnDef<ModuleRow> => ({
        id: `role-${role.id}`,
        header: role.name,
        width: 150,
        cell: ({ row }) => <LevelBadge level={levelOn(role.privileges, row.original.id)} />,
      })),
    ],
    [roles],
  );
  return <Table data={[...PRIVILEGE_MODULES]} columns={columns} getRowId={(row) => row.id} />;
}

interface CatalogRow {
  privilege: Privilege;
  module: ModuleRow;
  level: AccessLevel;
}

const CATALOG: CatalogRow[] = PRIVILEGES.map((privilege) => {
  const [moduleId, level] = privilege.split(':') as [string, AccessLevel];
  return {
    privilege,
    level,
    module: PRIVILEGE_MODULES.find((m) => m.id === moduleId) as ModuleRow,
  };
});

const describe = (row: CatalogRow) =>
  (row.module.levels as Partial<Record<AccessLevel, string>>)[row.level] ?? '';

/** Every privilege the system checks, what it allows and which roles grant it. */
function PrivilegeCatalog({ roles }: { roles: Role[] }) {
  const columns = useMemo<TableColumnDef<CatalogRow>[]>(
    () => [
      {
        id: 'module',
        header: 'Ekran',
        width: 220,
        cell: ({ row }) => (
          <span className="c-cell-stack">
            <strong>{row.original.module.label}</strong>
            <code className="c-muted c-cell-stack__secondary">{row.original.privilege}</code>
          </span>
        ),
      },
      {
        id: 'level',
        header: 'Seviye',
        width: 140,
        cell: ({ row }) => <LevelBadge level={row.original.level} />,
      },
      { id: 'allows', header: 'Neler yapılabilir', cell: ({ row }) => describe(row.original) },
      {
        id: 'roles',
        header: 'Bu yetkiyi veren roller',
        width: 300,
        cell: ({ row }) =>
          roles
            .filter((role) => role.privileges.includes(row.original.privilege))
            .map((role) => role.name)
            .join(', ') || <span className="c-muted">Hiçbir rol</span>,
      },
    ],
    [roles],
  );
  return <Table data={CATALOG} columns={columns} getRowId={(row) => row.privilege} />;
}

function workbook(roles: Role[]): SheetSpec[] {
  return [
    sheet<ModuleRow>({
      name: 'Yetki matrisi',
      title: 'Yetki matrisi — ekran × rol',
      rows: [...PRIVILEGE_MODULES],
      columns: [
        { header: 'Ekran', value: (m) => m.label },
        { header: 'Grup', value: (m) => GROUP_LABEL.get(m.group) },
        ...roles.map((role) => ({
          header: role.name,
          value: (m: ModuleRow) => levelLabel(levelOn(role.privileges, m.id)),
        })),
      ],
    }),
    sheet<CatalogRow>({
      name: 'Yetki kataloğu',
      title: 'Yetki kataloğu',
      rows: CATALOG,
      columns: [
        { header: 'Kod', value: (r) => r.privilege },
        { header: 'Ekran', value: (r) => r.module.label },
        { header: 'Seviye', value: (r) => levelLabel(r.level) },
        { header: 'Neler yapılabilir', value: describe, width: 60 },
        {
          header: 'Roller',
          value: (r) =>
            roles
              .filter((role) => role.privileges.includes(r.privilege))
              .map((role) => role.name)
              .join('\n'),
        },
      ],
    }),
    sheet<Role>({
      name: 'Roller',
      title: 'Roller',
      rows: roles,
      columns: [
        { header: 'Rol', value: (r) => r.name },
        { header: 'Açıklama', value: (r) => r.description, width: 50 },
        { header: 'Sistem rolü', value: (r) => r.system },
        { header: 'Kullanıcı sayısı', value: (r) => r.userCount, type: 'integer' },
        { header: 'Kapsam', value: (r) => accessSummary(r.privileges) },
      ],
    }),
  ];
}

/**
 * Roles and privileges: who may see and change what. Privileges are fixed per screen (view, edit,
 * delete); roles bundle them and users hold one or more roles.
 */
export default function RolesPage() {
  const [tab, selectTab] = useTabParam(TAB_IDS);
  const query = useRoles();
  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Yönetim' }, { label: 'Roller ve yetkiler' }]}
        title="Roller ve yetkiler"
        subtitle="Her ekran için görüntüleme, düzenleme ve silme yetkileri vardır. Roller bu yetkileri bir araya getirir; kullanıcılar bir veya daha fazla role sahip olur ve rollerinin yetkilerinin birleşimini kullanır."
        actions={
          <>
            <ExcelExportButton
              title="Roller ve yetkiler"
              disabled={!query.data}
              build={() => workbook(query.data ?? [])}
            />
            <CreateAction
              to={paths.admin.createRole()}
              label="Rol oluştur"
              privilege="roles:edit"
            />
          </>
        }
      />
      <SectionCard title="Roller ve yetkiler">
        <QueryView query={query} loadingLabel="Roller yükleniyor" errorTitle="Roller yüklenemedi">
          {(roles) => (
            <DetailTabs
              label="Rol ve yetki görünümleri"
              tabs={[
                { id: 'roles', label: 'Roller', count: roles.length },
                { id: 'matrix', label: 'Yetki matrisi' },
                { id: 'catalog', label: 'Yetki kataloğu', count: PRIVILEGES.length },
              ]}
              active={tab}
              onSelect={selectTab}
              renderPanel={(id) =>
                id === 'roles' ? (
                  <RoleList roles={roles} />
                ) : id === 'matrix' ? (
                  <PrivilegeMatrix roles={roles} />
                ) : (
                  <PrivilegeCatalog roles={roles} />
                )
              }
            />
          )}
        </QueryView>
      </SectionCard>
    </div>
  );
}
