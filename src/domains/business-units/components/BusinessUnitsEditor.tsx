import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Table, type TableColumnDef } from '@takeoff-ui/react-spar';
import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { EditIconOutlinedRounded } from '@takeoff-icons/react/edit';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { DeleteAction } from '@/components/actions/DeleteAction';
import { EmptyState } from '@/components/feedback/EmptyState';
import { QueryView } from '@/components/feedback/QueryView';
import { SelectField, TextField } from '@/components/forms/fields';
import { RecordDialog } from '@/components/forms/RecordDialog';
import { SectionCard } from '@/components/layout/SectionCard';
import { usePeopleById, usePersonOptions } from '@/domains/people/api/queries';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeleteBusinessUnit, useSaveBusinessUnit } from '../api/mutations';
import { useBusinessUnits } from '../api/queries';
import {
  businessUnitFormSchema,
  toBusinessUnitFormValues,
  toBusinessUnitInput,
  type BusinessUnitFormValues,
} from '../schemas/businessUnitForm';
import type { BusinessUnit } from '../types';

function BusinessUnitDialog({ unit, onClose }: { unit: BusinessUnit | null; onClose: () => void }) {
  const people = usePersonOptions();
  const save = useSaveBusinessUnit(unit?.id);
  const form = useForm<BusinessUnitFormValues>({
    resolver: zodResolver(businessUnitFormSchema),
    defaultValues: toBusinessUnitFormValues(unit ?? undefined),
    mode: 'onTouched',
  });
  const { control } = form;
  return (
    <RecordDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={unit ? `Düzenle: ${unit.name}` : 'İş birimi ekle'}
      description="Uygulama, proje ve kişilerin bağlandığı organizasyon birimi."
      form={form}
      onSubmit={(values) => save.mutateAsync(toBusinessUnitInput(values))}
      submitLabel={unit ? 'Değişiklikleri kaydet' : 'İş birimi ekle'}
    >
      <div className="c-form-grid">
        <TextField control={control} name="name" label="Ad" required />
        <TextField
          control={control}
          name="code"
          label="Kod"
          required
          description="Kısa ve benzersiz, ör. FIN."
        />
        <SelectField
          control={control}
          name="headId"
          label="Birim yöneticisi"
          options={people}
          emptyLabel="Atanmamış"
          className="c-form-grid__wide"
        />
        <TextField
          control={control}
          name="description"
          label="Açıklama"
          rows={3}
          className="c-form-grid__wide"
        />
      </div>
    </RecordDialog>
  );
}

/** Business units as master data: list, add, edit and delete (blocked while in use). */
export function BusinessUnitsEditor() {
  const query = useBusinessUnits();
  const people = usePeopleById();
  const { businessUnits } = useRepositories();
  const remove = useDeleteBusinessUnit();
  const [editing, setEditing] = useState<BusinessUnit | 'new' | null>(null);

  const columns: TableColumnDef<BusinessUnit>[] = [
    { id: 'code', header: 'Kod', accessor: 'code', sortable: true, width: 90 },
    { id: 'name', header: 'Ad', accessor: 'name', sortable: true, width: 200 },
    {
      id: 'head',
      header: 'Birim yöneticisi',
      width: 180,
      cell: ({ row }) => {
        const head = row.original.headId ? people.data?.get(row.original.headId) : undefined;
        return head ? head.fullName : <span className="c-muted">Atanmamış</span>;
      },
    },
    { id: 'description', header: 'Açıklama', accessor: 'description' },
    {
      id: 'actions',
      header: <span className="c-visually-hidden">İşlemler</span>,
      align: 'end',
      width: 240,
      cell: ({ row }) => (
        <span className="c-row-actions">
          <Button
            size="small"
            variant="neutral"
            appearance="text"
            startContent={<EditIconOutlinedRounded aria-hidden="true" />}
            aria-label={`Düzenle: ${row.original.name}`}
            onClick={() => setEditing(row.original)}
          >
            Düzenle
          </Button>
          <DeleteAction
            entityLabel="iş birimi"
            entityName={row.original.name}
            impactKey={['business-unit', row.original.id]}
            loadImpact={() => businessUnits.getDeletionImpact(row.original.id)}
            onDelete={() => remove.mutateAsync(row.original.id)}
            onDeleted={() => undefined}
          />
        </span>
      ),
    },
  ];

  return (
    <QueryView
      query={query}
      loadingLabel="İş birimleri yükleniyor"
      errorTitle="İş birimleri yüklenemedi"
    >
      {(units) => (
        <SectionCard
          title={`İş birimleri (${units.length})`}
          description="Uygulama ve projelerin sahibi olan organizasyon birimleri. Kullanımdaki birimler silinemez."
          actions={
            <Button
              size="small"
              startContent={<AddIconOutlinedRounded aria-hidden="true" />}
              onClick={() => setEditing('new')}
            >
              İş birimi ekle
            </Button>
          }
        >
          <Table
            data={units}
            columns={columns}
            getRowId={(row) => row.id}
            emptyState={<EmptyState compact title="Henüz iş birimi yok" />}
          />
          {editing && (
            <BusinessUnitDialog
              key={editing === 'new' ? 'new' : editing.id}
              unit={editing === 'new' ? null : editing}
              onClose={() => setEditing(null)}
            />
          )}
        </SectionCard>
      )}
    </QueryView>
  );
}
