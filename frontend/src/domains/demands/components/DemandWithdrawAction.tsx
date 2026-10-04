import { Button, Field, Input } from '@takeoff-ui/react-spar';
import { ReturnIconOutlinedRounded } from '@takeoff-icons/react/return';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { useCurrentUser } from '@/domains/auth/api/queries';
import { useWithdrawDemand } from '../api/mutations';
import type { Demand } from '../types';
import { canWithdrawDemand } from '../utils/demandAccess';

/** "Geri çek": the requester takes an open demand back, optionally saying why. */
export function DemandWithdrawAction({ demand }: { demand: Demand }) {
  const user = useCurrentUser();
  const withdraw = useWithdrawDemand(demand.id);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  if (!canWithdrawDemand(user, demand)) return null;
  return (
    <>
      <Button
        variant="neutral"
        appearance="outlined"
        startContent={<ReturnIconOutlinedRounded aria-hidden="true" />}
        onClick={() => setOpen(true)}
      >
        Geri çek
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${demand.code} geri çekilsin mi?`}
        confirmLabel="Talebi geri çek"
        pending={withdraw.isPending}
        onConfirm={() =>
          void withdraw.mutateAsync(note).then(
            () => setOpen(false),
            () => undefined,
          )
        }
      >
        <p>Talep değerlendirmeden çıkar; kayıt ve geçmişi saklanır.</p>
        <Field>
          <Field.Label>Neden? (isteğe bağlı)</Field.Label>
          <Input>
            <Input.Field
              as="textarea"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Input>
        </Field>
      </ConfirmDialog>
    </>
  );
}
