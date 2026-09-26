import { Button } from '@takeoff-ui/react-spar';
import { DeleteIconOutlinedRounded } from '@takeoff-icons/react/delete';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import type { DeletionImpact } from '@/domains/shared/types';
import { getErrorMessage } from '@/lib/errors';

interface DeleteActionProps {
  /** e.g. "application". */
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
        Delete {entityLabel}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${entityName}?`}
        confirmLabel={`Delete ${entityLabel}`}
        tone="danger"
        pending={pending}
        confirmDisabled={impact.isPending || Boolean(impact.data?.blockedReason)}
        onConfirm={() => void confirm()}
      >
        <div className="c-stack c-stack--s">
          {impact.isPending ? (
            <p className="c-muted">Checking what else refers to this {entityLabel}…</p>
          ) : impact.data?.blockedReason ? (
            <p>
              <strong>This {entityLabel} cannot be deleted.</strong> {impact.data.blockedReason}
            </p>
          ) : references.length > 0 ? (
            <>
              <p>
                {entityName} is referenced by{' '}
                {references.map((ref, index) => (
                  <span key={ref.label}>
                    {index > 0 && (index === references.length - 1 ? ' and ' : ', ')}
                    <strong>
                      {ref.count}{' '}
                      {ref.count === 1
                        ? ref.label.replace(/ies$/, 'y').replace(/s$/, '')
                        : ref.label}
                    </strong>
                  </span>
                ))}
                .
              </p>
              <p>Those links will be removed. This cannot be undone.</p>
            </>
          ) : (
            <p>Nothing else refers to this {entityLabel}. This cannot be undone.</p>
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
