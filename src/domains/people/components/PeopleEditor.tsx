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
import { SearchField } from '@/components/forms/SearchField';
import { SectionCard } from '@/components/layout/SectionCard';
import { Toolbar } from '@/components/layout/Toolbar';
import { useBusinessUnitOptions, useBusinessUnitsById } from '@/domains/business-units/api/queries';
import { pluralize } from '@/lib/format';
import { useRepositories } from '@/services/RepositoryContext';
import { useDeletePerson, useSavePerson } from '../api/mutations';
import { usePeopleById } from '../api/queries';
import {
  personFormSchema,
  toPersonFormValues,
  toPersonInput,
  type PersonFormValues,
} from '../schemas/personForm';
import type { Person } from '../types';

function PersonDialog({ person, onClose }: { person: Person | null; onClose: () => void }) {
  const businessUnits = useBusinessUnitOptions();
  const save = useSavePerson(person?.id);
  const form = useForm<PersonFormValues>({
    resolver: zodResolver(personFormSchema),
    defaultValues: toPersonFormValues(person ?? undefined),
    mode: 'onTouched',
  });
  const { control } = form;
  return (
    <RecordDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={person ? `Düzenle: ${person.fullName}` : 'Kişi ekle'}
      description="Rol, ekip ve sahiplik atamalarında seçilebilen kişiler."
      form={form}
      onSubmit={(values) => save.mutateAsync(toPersonInput(values))}
      submitLabel={person ? 'Değişiklikleri kaydet' : 'Kişi ekle'}
    >
      <div className="c-form-grid">
        <TextField control={control} name="fullName" label="Ad soyad" required />
        <TextField control={control} name="jobTitle" label="Unvan" required />
        <TextField
          control={control}
          name="email"
          label="E-posta"
          type="email"
          required
          description="Kurumsal e-posta adresi; kişi başına benzersizdir."
        />
        <TextField control={control} name="location" label="Konum" />
        <SelectField
          control={control}
          name="businessUnitId"
          label="İş birimi"
          options={businessUnits}
          emptyLabel="Belirlenmemiş"
          className="c-form-grid__wide"
        />
      </div>
    </RecordDialog>
  );
}

const matches = (person: Person, term: string) =>
  [person.fullName, person.jobTitle, person.email, person.location ?? ''].some((value) =>
    value.toLocaleLowerCase('tr-TR').includes(term.toLocaleLowerCase('tr-TR')),
  );

/** People as master data: search, add, edit and delete (blocked while referenced). */
export function PeopleEditor() {
  const query = usePeopleById();
  const units = useBusinessUnitsById();
  const { people } = useRepositories();
  const remove = useDeletePerson();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Person | 'new' | null>(null);

  const columns: TableColumnDef<Person>[] = [
    {
      id: 'name',
      header: 'Ad soyad',
      accessor: 'fullName',
      sortable: true,
      width: 220,
      cell: ({ row }) => (
        <span className="c-cell-stack">
          <span>{row.original.fullName}</span>
          <span className="c-muted c-cell-stack__secondary">{row.original.email}</span>
        </span>
      ),
    },
    { id: 'title', header: 'Unvan', accessor: 'jobTitle', sortable: true },
    {
      id: 'unit',
      header: 'İş birimi',
      width: 180,
      cell: ({ row }) => {
        const unit = row.original.businessUnitId
          ? units.data?.get(row.original.businessUnitId)
          : undefined;
        return unit ? unit.name : <span className="c-muted">Belirlenmemiş</span>;
      },
    },
    {
      id: 'location',
      header: 'Konum',
      width: 120,
      cell: ({ row }) => row.original.location ?? <span className="c-muted">—</span>,
    },
    {
      id: 'actions',
      header: <span className="c-visually-hidden">İşlemler</span>,
      align: 'end',
      width: 200,
      cell: ({ row }) => (
        <span className="c-row-actions">
          <Button
            size="small"
            variant="neutral"
            appearance="text"
            startContent={<EditIconOutlinedRounded aria-hidden="true" />}
            aria-label={`Düzenle: ${row.original.fullName}`}
            onClick={() => setEditing(row.original)}
          >
            Düzenle
          </Button>
          <DeleteAction
            entityLabel="kişi"
            entityName={row.original.fullName}
            impactKey={['person', row.original.id]}
            loadImpact={() => people.getDeletionImpact(row.original.id)}
            onDelete={() => remove.mutateAsync(row.original.id)}
            onDeleted={() => undefined}
          />
        </span>
      ),
    },
  ];

  return (
    <QueryView query={query} loadingLabel="Kişiler yükleniyor" errorTitle="Kişiler yüklenemedi">
      {(byId) => {
        const all = [...byId.values()].sort((a, b) => a.fullName.localeCompare(b.fullName, 'tr'));
        const visible = search ? all.filter((person) => matches(person, search)) : all;
        return (
          <SectionCard
            title={`Kişiler (${all.length})`}
            description="Uygulama ve projelerde rol alan, ekiplerde yer alan kişiler. Başka kayıtlarda geçen kişiler silinemez."
            actions={
              <Button
                size="small"
                startContent={<AddIconOutlinedRounded aria-hidden="true" />}
                onClick={() => setEditing('new')}
              >
                Kişi ekle
              </Button>
            }
          >
            <div className="c-stack c-stack--s">
              <Toolbar
                label="Kişileri filtrele"
                end={<span className="c-muted">{pluralize(visible.length, 'kişi')}</span>}
              >
                <SearchField
                  label="Ara"
                  placeholder="Ad, unvan, e-posta veya konum"
                  value={search}
                  onCommit={setSearch}
                />
              </Toolbar>
              <Table
                data={visible}
                columns={columns}
                getRowId={(row) => row.id}
                pagination={{ pageSize: 25, pageSizeOptions: [25, 50, 100] }}
                emptyState={<EmptyState compact title="Bu aramaya uyan kişi yok" />}
              />
            </div>
            {editing && (
              <PersonDialog
                key={editing === 'new' ? 'new' : editing.id}
                person={editing === 'new' ? null : editing}
                onClose={() => setEditing(null)}
              />
            )}
          </SectionCard>
        );
      }}
    </QueryView>
  );
}
