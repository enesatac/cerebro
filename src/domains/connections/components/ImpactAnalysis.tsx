import { Field, Select, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import type { EntityId } from '@/domains/shared/types';
import { useSearchParams } from 'react-router';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SectionCard } from '@/components/layout/SectionCard';
import { useApplicationRefs } from '@/domains/applications/api/queries';
import { ApplicationRefLink } from '@/domains/applications/components/ApplicationRefLink';
import { pluralize } from '@/lib/format';
import { useAllDependencies } from '../api/queries';
import { analyseImpact, type ImpactNode } from '../utils/impact';
import { MasterBadge } from '@/domains/master-data/components/MasterBadge';
import { parseId } from '@/lib/urlParams';

function impactColumns(nameOf: (id: EntityId) => string): TableColumnDef<ImpactNode>[] {
  return [
    {
      id: 'application',
      header: 'Uygulama',
      width: 260,
      cell: ({ row }) => <ApplicationRefLink applicationId={row.original.applicationId} />,
    },
    {
      id: 'relationship',
      header: 'İlişki',
      width: 150,
      cell: ({ row }) =>
        row.original.depth === 1 ? 'Doğrudan' : `Dolaylı · ${row.original.depth} adım`,
    },
    {
      id: 'criticality',
      header: 'Etki',
      width: 120,
      cell: ({ row }) => <MasterBadge list="criticalities" code={row.original.pathCriticality} />,
    },
    {
      id: 'path',
      header: 'Yol',
      cell: ({ row }) => (
        <span className="c-muted">{row.original.path.map(nameOf).join(' → ')}</span>
      ),
    },
  ];
}

/** Pick an application and see what fails with it (downstream) and what it needs (upstream). */
export function ImpactAnalysis() {
  const [params, setParams] = useSearchParams();
  const selectedId = parseId(params.get('app'));
  const refs = useApplicationRefs();
  const dependencies = useAllDependencies();

  const select = (value: string) => {
    const next = new URLSearchParams(params);
    next.set('app', value);
    setParams(next, { replace: true });
  };
  const options = [...(refs.data?.values() ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const nameOf = (id: EntityId) => refs.data?.get(id)?.name ?? `#${id}`;
  const selected = selectedId !== null ? refs.data?.get(selectedId) : undefined;

  return (
    <div className="c-stack">
      <Field className="c-impact-picker" disabled={!refs.data}>
        <Field.Label>Uygulama</Field.Label>
        <Select
          size="small"
          value={selectedId === null ? undefined : String(selectedId)}
          onChange={select}
        >
          <Select.Trigger placeholder="Analiz edilecek uygulamayı seçin" />
          <Select.Content>
            <Select.Viewport>
              {options.map((ref) => (
                <Select.Item key={ref.id} value={String(ref.id)} label={ref.name}>
                  {ref.name}
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select>
        <Field.Description>
          Etki, yol üzerindeki en zayıf halkadır: düşük bir bağımlılık üzerinden ulaşılan kritik bir
          bağımlılık düşük sayılır.
        </Field.Description>
      </Field>

      {selectedId === null ? (
        <EmptyState
          title="Etki alanını görmek için bir uygulama seçin"
          description="Cerebro kayıtlı bağımlılıkları iki yönde izler: uygulama çökerse neyin durduğu ve çalışmak için neye ihtiyaç duyduğu."
        />
      ) : (
        <QueryView
          query={dependencies}
          loadingLabel="Bağımlılıklar analiz ediliyor"
          errorTitle="Bağımlılıklar yüklenemedi"
        >
          {(all) => {
            const downstream = analyseImpact(all, selectedId, 'downstream');
            const upstream = analyseImpact(all, selectedId, 'upstream');
            const name = selected?.name ?? `#${selectedId}`;
            const direct = downstream.filter((node) => node.depth === 1).length;
            return (
              <>
                <SectionCard
                  title={`${name} erişilemezse etkilenenler (${downstream.length})`}
                  description={
                    downstream.length > 0
                      ? `${pluralize(direct, 'uygulama')} doğrudan, ${pluralize(downstream.length - direct, 'uygulama')} daha dolaylı olarak.`
                      : undefined
                  }
                >
                  <Table
                    data={downstream}
                    columns={impactColumns(nameOf)}
                    getRowId={(row) => String(row.applicationId)}
                    emptyState={
                      <EmptyState
                        compact
                        title={`Kayıtlı hiçbir uygulama şuna bağımlı değil: ${name}`}
                      />
                    }
                  />
                </SectionCard>
                <SectionCard title={`${name} şunlara bağımlı (${upstream.length})`}>
                  <Table
                    data={upstream}
                    columns={impactColumns(nameOf)}
                    getRowId={(row) => String(row.applicationId)}
                    emptyState={
                      <EmptyState compact title={`${name} için kayıtlı bağımlılık yok`} />
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
