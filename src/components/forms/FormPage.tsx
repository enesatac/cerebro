import { Alert, Button } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { PageHeader, type BreadcrumbEntry } from '@/components/layout/PageHeader';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { getErrorMessage, isValidationError } from '@/lib/errors';
import { flattenErrors } from './flattenErrors';

interface FormPageProps<T extends FieldValues> {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbEntry[];
  form: UseFormReturn<T>;
  /** Persist the values; resolve with the path to open afterwards. */
  onSubmit: (values: T) => Promise<string>;
  cancelTo: string;
  submitLabel: string;
  /** Optional destructive action shown at the start of the action bar (edit pages). */
  deleteAction?: ReactNode;
  children: ReactNode;
}

/**
 * Shared create/edit page: header, error summary, sections, sticky action bar, server-side
 * validation mapped onto fields, and an unsaved-changes guard.
 */
export function FormPage<T extends FieldValues>({
  title,
  subtitle,
  breadcrumbs,
  form,
  onSubmit,
  cancelTo,
  submitLabel,
  deleteAction,
  children,
}: FormPageProps<T>) {
  const navigate = useNavigate();
  const { formState } = form;
  const { blocker, allowNavigation } = useUnsavedChangesGuard(
    formState.isDirty && !formState.isSubmitSuccessful,
  );
  const messages = formState.submitCount > 0 ? flattenErrors(formState.errors) : [];

  const submit = form.handleSubmit(async (values) => {
    try {
      const destination = await onSubmit(values);
      allowNavigation();
      void navigate(destination);
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
    <div className="c-stack">
      <PageHeader breadcrumbs={breadcrumbs} title={title} subtitle={subtitle} />
      <form className="c-form" onSubmit={(event) => void submit(event)} noValidate>
        {messages.length > 0 && (
          <Alert variant="danger" appearance="outlined" role="alert">
            <Alert.Content>
              <Alert.Title level={2}>
                {messages.length === 1
                  ? 'Fix 1 problem before saving'
                  : `Fix ${messages.length} problems before saving`}
              </Alert.Title>
              <ul className="c-form-error-list">
                {messages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Alert.Content>
          </Alert>
        )}
        {children}
        <div className="c-form-actions" role="group" aria-label="Form actions">
          <div>{deleteAction}</div>
          <div className="c-form-actions__main">
            <Button
              type="button"
              variant="neutral"
              appearance="outlined"
              onClick={() => void navigate(cancelTo)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={formState.isSubmitting}
              disabled={formState.isSubmitting}
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="Discard unsaved changes?"
        confirmLabel="Discard changes"
        cancelLabel="Keep editing"
        tone="danger"
        onConfirm={() => blocker.proceed?.()}
      >
        <p>You have changes that have not been saved. Leaving this page will discard them.</p>
      </ConfirmDialog>
    </div>
  );
}
