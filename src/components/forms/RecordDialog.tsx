import { Alert, Button, Dialog } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { getErrorMessage, isValidationError } from '@/lib/errors';
import { keepOpenForFloatingLayers } from '@/lib/outsideInteraction';

interface RecordDialogProps<T extends FieldValues> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  form: UseFormReturn<T>;
  /** Persists the values; the dialog closes when it resolves. */
  onSubmit: (values: T) => Promise<unknown>;
  submitLabel: string;
  children: ReactNode;
  /** A wider panel for longer forms (two-column grids, score rows). */
  wide?: boolean;
}

/**
 * A small create/edit form in a Takeoff `Dialog`, for master data records that do not deserve a
 * page of their own. Server-side validation errors are placed on their field.
 */
export function RecordDialog<T extends FieldValues>({
  open,
  onOpenChange,
  title,
  description,
  form,
  onSubmit,
  submitLabel,
  children,
  wide = false,
}: RecordDialogProps<T>) {
  const pending = form.formState.isSubmitting;
  const rootError = form.formState.errors.root?.server?.message;

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (error) {
      if (isValidationError(error) && error.field) {
        form.setError(
          error.field as Path<T>,
          { type: 'server', message: error.message },
          { shouldFocus: true },
        );
      } else {
        form.setError('root.server', { type: 'server', message: getErrorMessage(error) });
      }
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      dismissible={!pending}
    >
      <Dialog.Overlay />
      <Dialog.Panel
        className={wide ? 'c-record-dialog c-record-dialog--wide' : 'c-record-dialog'}
        onInteractOutside={keepOpenForFloatingLayers}
      >
        <form onSubmit={(event) => void submit(event)} noValidate>
          <Dialog.Header headerType="divided">
            <Dialog.Title level={2}>{title}</Dialog.Title>
            <Dialog.Close aria-label="Kapat" />
          </Dialog.Header>
          <Dialog.Body className="c-record-dialog__body">
            {description && <p className="c-muted c-record-dialog__description">{description}</p>}
            {rootError && (
              <Alert variant="danger" appearance="outlined" role="alert">
                <Alert.Content>
                  <Alert.Description>{rootError}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            {children}
          </Dialog.Body>
          <Dialog.Footer footerType="divided" className="c-confirm-dialog__footer">
            <Button
              type="button"
              variant="neutral"
              appearance="outlined"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Vazgeç
            </Button>
            <Button type="submit" loading={pending} disabled={pending}>
              {submitLabel}
            </Button>
          </Dialog.Footer>
        </form>
      </Dialog.Panel>
    </Dialog>
  );
}
