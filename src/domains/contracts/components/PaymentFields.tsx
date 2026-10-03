import { useFieldArray, useWatch, type Control } from 'react-hook-form';
import { DateField } from '@/components/forms/DateField';
import { TextField } from '@/components/forms/fields';
import { RepeatableList } from '@/components/forms/RepeatableList';
import { SectionCard } from '@/components/layout/SectionCard';
import { MasterSelectField } from '@/domains/master-data/components/MasterSelectField';
import { formatCurrency } from '@/lib/format';
import { emptyPayment, type ContractFormValues } from '../schemas/contractForm';

/** Planned against value as the plan is edited ("₺1,8 Mn / ₺2,4 Mn planlandı"). */
function PlanTotal({ control }: { control: Control<ContractFormValues> }) {
  const [payments, totalValue, currency] = useWatch({
    control,
    name: ['payments', 'totalValue', 'currency'],
  });
  const planned = payments
    .filter((p) => p.status !== 'cancelled')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  return (
    <p className="c-muted" aria-live="polite">
      Planlanan: <strong>{formatCurrency(planned, currency)}</strong>
      {totalValue && ` / sözleşme bedeli ${formatCurrency(Number(totalValue), currency)}`}
    </p>
  );
}

/** Instalments: due date, amount, status, invoice number and (when paid) payment date. */
export function PaymentFields({
  control,
  error,
}: {
  control: Control<ContractFormValues>;
  error?: string;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: 'payments' });
  return (
    <SectionCard
      title="Ödeme planı"
      description="Her taksit için vade ve tutar; fatura geldiğinde numarasını, ödendiğinde tarihini girin."
    >
      <PlanTotal control={control} />
      <RepeatableList
        items={fields}
        onAdd={() => append(emptyPayment())}
        onRemove={remove}
        addLabel="Taksit ekle"
        emptyText="Ödeme planı yok."
        error={error}
        removeLabel={(index) => `${index + 1}. taksiti kaldır`}
        itemLabel={(index) => `${index + 1}. taksit`}
        renderItem={(index) => (
          <div className="c-form-grid">
            <DateField control={control} name={`payments.${index}.dueDate`} label="Vade" required />
            <TextField
              control={control}
              name={`payments.${index}.amount`}
              label="Tutar"
              type="number"
              required
            />
            <MasterSelectField
              control={control}
              name={`payments.${index}.status`}
              label="Durum"
              required
              list="paymentStatuses"
            />
            <TextField control={control} name={`payments.${index}.description`} label="Açıklama" />
            <TextField
              control={control}
              name={`payments.${index}.invoiceNumber`}
              label="Fatura no"
            />
            <DateField control={control} name={`payments.${index}.paidDate`} label="Ödeme tarihi" />
          </div>
        )}
      />
    </SectionCard>
  );
}
