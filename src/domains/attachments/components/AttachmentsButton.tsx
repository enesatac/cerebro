import { Button, Dialog } from '@takeoff-ui/react-spar';
import { AttachIconOutlinedRounded } from '@takeoff-icons/react/attach';
import { useState } from 'react';
import { keepOpenForNestedLayers } from '@/lib/outsideInteraction';
import { useAttachmentCounts } from '../api/queries';
import type { AttachmentOwner } from '../types';
import { AttachmentsPanel } from './AttachmentsPanel';

/**
 * "Ekler (2)" for register rows, where records have no page of their own: opens the attachments
 * panel in a dialog. The count is read here, so the table around it never re-renders for it.
 */
export function AttachmentsButton({
  owner,
  ownerName,
  showLabel = false,
}: {
  owner: AttachmentOwner;
  ownerName: string;
  /** "Ekler (2)" instead of just the count (outside tables). */
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const counts = useAttachmentCounts(owner.type);
  const count = counts.data?.get(owner.id) ?? 0;
  return (
    <>
      <Button
        size="small"
        variant="neutral"
        appearance="text"
        startContent={<AttachIconOutlinedRounded aria-hidden="true" />}
        aria-label={`Ekler: ${ownerName} (${count})`}
        onClick={() => setOpen(true)}
      >
        {showLabel ? `Ekler (${count})` : count}
      </Button>
      {open && (
        <Dialog open onOpenChange={setOpen}>
          <Dialog.Overlay />
          <Dialog.Panel
            className="c-record-dialog c-record-dialog--wide"
            onInteractOutside={keepOpenForNestedLayers}
          >
            <Dialog.Header headerType="divided">
              <Dialog.Title level={2}>Ekler: {ownerName}</Dialog.Title>
              <Dialog.Close aria-label="Kapat" />
            </Dialog.Header>
            <Dialog.Body className="c-record-dialog__body">
              <AttachmentsPanel owner={owner} ownerName={ownerName} />
            </Dialog.Body>
          </Dialog.Panel>
        </Dialog>
      )}
    </>
  );
}
