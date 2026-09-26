import { Button } from '@takeoff-ui/react-spar';
import { DeleteIconOutlinedRounded } from '@takeoff-icons/react/delete';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import type { DeletionImpact } from '@/domains/shared/types';
import { getErrorMessage } from '@/lib/errors';

interface DeleteActionProps {
  /** Lower-case noun, e.g. "uygulama". */
  entityLabel: string;
  entityName: string;
  /** Unique cache key for the impact query. */
  impactKey: readonly unknown[];
  loadImpact: () => Promise<DeletionImpact>;
  onDelete: () => Promise<void>;
  /** Called after a successful delete (usually navigation back to the list). */
  onDeleted: () => void;
}

/** "Delete" with a confirmation that states exactly what else is affected. */
export function DeleteAction({
  entityLabel,
  entityName,
  impactKey,
  loadImpact,
  onDelete,
  onDeleted,
}: DeleteActionProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const impact = useQuery({
    queryKey: ['deletion-impact', ...impactKey],
    queryFn: loadImpact,
    enabled: open,
    staleTime: 0,
  });

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await onDelete();
      setOpen(false);
      onDeleted();
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  const references = impact.data?.references ?? [];
  return (
    <>
      <Button
        type="button"
        variant="danger"
        appearance="text"
        startContent={<DeleteIconOutlinedRounded aria-hidden="true" />}
        onClick={() => setOpen(true)}
      >
        {entityLabel.charAt(0).toLocaleUpperCase('tr-TR') + entityLabel.slice(1)} sil
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${entityName} silinsin mi?`}
        confirmLabel="Kalıcı olarak sil"
        tone="danger"
        pending={pending}
        confirmDisabled={impact.isPending || Boolean(impact.data?.blockedReason)}
        onConfirm={() => void confirm()}
      >
        <div className="c-stack c-stack--s">
          {impact.isPending ? (
            <p className="c-muted">Bu kayda bağlı diğer kayıtlar kontrol ediliyor…</p>
          ) : impact.data?.blockedReason ? (
            <>
              <p>
                <strong>Bu kayıt silinemez.</strong> {impact.data.blockedReason}
              </p>
              {references.length > 0 && (
                <ul className="c-form-error-list">
                  {references.map((ref) => (
                    <li key={ref.label}>
                      {ref.count} {ref.label}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : references.length > 0 ? (
            <>
              <p>
                {entityName} şu kayıtlarla ilişkili:{' '}
                {references.map((ref, index) => (
                  <span key={ref.label}>
                    {index > 0 && (index === references.length - 1 ? ' ve ' : ', ')}
                    <strong>
                      {ref.count} {ref.label}
                    </strong>
                  </span>
                ))}
                .
              </p>
              <p>Bu ilişkiler kaldırılacak. Bu işlem geri alınamaz.</p>
            </>
          ) : (
            <p>Bu kayda bağlı başka bir kayıt yok. Bu işlem geri alınamaz.</p>
          )}
          {error && (
            <p className="c-form-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
