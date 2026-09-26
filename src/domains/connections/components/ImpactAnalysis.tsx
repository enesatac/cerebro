import { Field, Select, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { useSearchParams } from 'react-router';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationRefs } from '@/domains/applications/api/queries';
import { ApplicationRefLink } from '@/domains/applications/components/ApplicationRefLink';
import { CRITICALITY_PRESENTATION } from '@/domains/shared/utils/presentation';
import { pluralize } from '@/lib/format';
import { useAllDependencies } from '../api/queries';
import { analyseImpact, type ImpactNode } from '../utils/impact';

function impactColumns(nameOf: (id: string) => string): TableColumnDef<ImpactNode>[] {
  return [
    {
      id: 'application',
      header: 'Application',
      width: 260,
      cell: ({ row }) => <ApplicationRefLink applicationId={row.original.applicationId} />,
    },
    {
      id: 'relationship',
      header: 'Relationship',
      width: 150,
      cell: ({ row }) =>
        row.original.depth === 1 ? 'Direct' : `Indirect · ${row.original.depth} steps`,
    },
    {
      id: 'criticality',
      header: 'Impact',
      width: 120,
      cell: ({ row }) => (
        <StatusBadge {...CRITICALITY_PRESENTATION[row.original.pathCriticality]} />
      ),
    },
    {
      id: 'path',
      header: 'Path',
      cell: ({ row }) => (
        <span className="c-muted">{row.original.path.map(nameOf).join(' → ')}</span>
      ),
    },
  ];
}

/** Pick an application and see what fails with it (downstream) and what it needs (upstream). */
export function ImpactAnalysis() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('app');
  const refs = useApplicationRefs();
  const dependencies = useAllDependencies();

  const select = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('app', id);
    setParams(next, { replace: true });
  };
  const options = [...(refs.data?.values() ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const nameOf = (id: string) => refs.data?.get(id)?.name ?? id;
  const selected = selectedId ? refs.data?.get(selectedId) : undefined;

  return (
    <div className="c-stack">
      <Field className="c-impact-picker" disabled={!refs.data}>
        <Field.Label>Application</Field.Label>
        <Select size="small" value={selectedId ?? undefined} onChange={select}>
          <Select.Trigger placeholder="Choose an application to analyse" />
          <Select.Content>
            <Select.Viewport>
              {options.map((ref) => (
                <Select.Item key={ref.id} value={ref.id} label={ref.name}>
                  {ref.name}
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select>
        <Field.Description>
          Impact is the weakest link along the path: a critical dependency reached through a low one
          counts as low.
        </Field.Description>
      </Field>

      {!selectedId ? (
        <EmptyState
          title="Choose an application to see its blast radius"
          description="Cerebro follows recorded dependencies in both directions: what stops working if it fails, and what it needs to run."
        />
      ) : (
        <QueryView
          query={dependencies}
          loadingLabel="Analysing dependencies"
          errorTitle="Dependencies could not be loaded"
        >
          {(all) => {
            const downstream = analyseImpact(all, selectedId, 'downstream');
            const upstream = analyseImpact(all, selectedId, 'upstream');
            const name = selected?.name ?? selectedId;
            const direct = downstream.filter((node) => node.depth === 1).length;
            return (
              <>
                <SectionCard
                  title={`Affected if ${name} is unavailable (${downstream.length})`}
                  description={
                    downstream.length > 0
                      ? `${pluralize(direct, 'application')} directly, ${pluralize(downstream.length - direct, 'more application')} indirectly.`
                      : undefined
                  }
                >
                  <Table
                    data={downstream}
                    columns={impactColumns(nameOf)}
                    getRowId={(row) => row.applicationId}
                    emptyState={
                      <EmptyState compact title={`No recorded application depends on ${name}`} />
                    }
                  />
                </SectionCard>
                <SectionCard title={`${name} relies on (${upstream.length})`}>
                  <Table
                    data={upstream}
                    columns={impactColumns(nameOf)}
                    getRowId={(row) => row.applicationId}
                    emptyState={
                      <EmptyState compact title={`${name} has no recorded dependencies`} />
                    }
                  />
                </SectionCard>
              </>
            );
          }}
        </QueryView>
      )}
    </div>
  );
}
