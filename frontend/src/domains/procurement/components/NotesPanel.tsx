import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@takeoff-ui/react-spar';
import { DeleteIconOutlinedRounded } from '@takeoff-icons/react/delete';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { SwitchField, TextField } from '@/components/forms/fields';
import { usePrivilege } from '@/domains/auth/api/queries';
import { usePeopleById } from '@/domains/people/api/queries';
import { formatDateTime } from '@/lib/dates';
import { getErrorMessage, isValidationError } from '@/lib/errors';
import { useAddProcurementNote, useRemoveProcurementNote } from '../api/mutations';
import { noteFormSchema, type NoteFormValues } from '../schemas/stepsForm';
import type { ProcurementNote, ProcurementProcess } from '../types';

const EMPTY_NOTE: NoteFormValues = { text: '', internal: false };

function NoteForm({ contractId }: { contractId: number }) {
  const add = useAddProcurementNote(contractId);
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: EMPTY_NOTE,
  });
  const submit = form.handleSubmit(async (values) => {
    try {
      await add.mutateAsync({ text: values.text.trim(), internal: values.internal });
      form.reset(EMPTY_NOTE);
    } catch (error) {
      if (isValidationError(error)) {
        form.setError('text', { type: 'server', message: getErrorMessage(error) });
      }
    }
  });
  return (
    <form className="c-stack c-stack--s" onSubmit={(event) => void submit(event)} noValidate>
      <TextField
        control={form.control}
        name="text"
        label="Yeni not"
        rows={3}
        placeholder="ör. Tedarikçi revize teklifi 15 Ekim'e kadar iletecek."
      />
      <div className="c-procurement-note-form__actions">
        <SwitchField
          control={form.control}
          name="internal"
          label="İç not"
          description="Yalnızca satın alma ekibi görür; iş birimlerine gösterilmez."
        />
        <Button type="submit" size="small" loading={form.formState.isSubmitting}>
          Notu ekle
        </Button>
      </div>
    </form>
  );
}

/**
 * The purchase's log: everyone who can see the process reads the shared notes; the procurement
 * team (`procurement:edit`) also writes, deletes and sees internal notes.
 */
export function NotesPanel({ process }: { process: ProcurementProcess }) {
  const canEdit = usePrivilege('procurement:edit');
  const people = usePeopleById();
  const remove = useRemoveProcurementNote();
  const [deleting, setDeleting] = useState<ProcurementNote | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="c-stack c-stack--s">
      {canEdit && <NoteForm contractId={process.contractId} />}
      {process.notes.length === 0 ? (
        <p className="c-muted">Henüz not yok.</p>
      ) : (
        <ol className="c-procurement-notes" aria-label="Notlar">
          {process.notes.map((note) => (
            <li key={note.id} className="c-procurement-notes__item">
              <div className="c-procurement-notes__meta">
                <strong>
                  {note.authorId !== null
                    ? (people.data?.get(note.authorId)?.fullName ?? 'Bilinmeyen kişi')
                    : 'Bilinmeyen kişi'}
                </strong>
                <span className="c-muted">{formatDateTime(note.at)}</span>
                {note.internal && <StatusBadge label="İç not" variant="warning" />}
                {canEdit && (
                  <Button
                    type="button"
                    size="small"
                    variant="danger"
                    appearance="text"
                    startContent={<DeleteIconOutlinedRounded aria-hidden="true" />}
                    aria-label={`Notu sil: ${formatDateTime(note.at)}`}
                    className="c-procurement-notes__delete"
                    onClick={() => {
                      setError(null);
                      setDeleting(note);
                    }}
                  />
                )}
              </div>
              <p className="c-prose">{note.text}</p>
            </li>
          ))}
        </ol>
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Not silinsin mi?"
        confirmLabel="Notu sil"
        tone="danger"
        pending={remove.isPending}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => setDeleting(null),
            onError: (caught) => setError(getErrorMessage(caught)),
          });
        }}
      >
        <p>Bu not kalıcı olarak silinir.</p>
        {deleting && <p className="c-prose c-muted">{deleting.text}</p>}
        {error && (
          <p className="c-form-error" role="alert">
            {error}
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
