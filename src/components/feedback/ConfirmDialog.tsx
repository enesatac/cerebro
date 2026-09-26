import { Button, Dialog } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  /** `danger` for destructive actions. */
  tone?: 'danger' | 'primary';
  pending?: boolean;
  /** Disables confirmation (e.g. deletion blocked by references). */
  confirmDisabled?: boolean;
  onConfirm: () => void;
}

/** Modal confirmation built on Takeoff `Dialog`. Cancel is the safe default action. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  pending = false,
  confirmDisabled = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !pending && onOpenChange(next)}
      dismissible={!pending}
    >
      <Dialog.Overlay />
      <Dialog.Panel
        role={tone === 'danger' ? 'alertdialog' : 'dialog'}
        className="c-confirm-dialog"
      >
        <Dialog.Header headerType="divided">
          <Dialog.Title level={2}>{title}</Dialog.Title>
          <Dialog.Close aria-label="Close" />
        </Dialog.Header>
        <Dialog.Body>{children}</Dialog.Body>
        <Dialog.Footer footerType="divided" className="c-confirm-dialog__footer">
          <Button
            variant="neutral"
            appearance="outlined"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            autoFocus
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={pending}
            disabled={confirmDisabled || pending}
          >
            {confirmLabel}
          </Button>
        </Dialog.Footer>
      </Dialog.Panel>
    </Dialog>
  );
}
