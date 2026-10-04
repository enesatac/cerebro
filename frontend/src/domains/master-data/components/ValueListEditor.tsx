import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Badge, Button } from '@takeoff-ui/react-spar';
import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { ArrowBottomIconOutlinedRounded } from '@takeoff-icons/react/arrow-bottom';
import { ArrowTopIconOutlinedRounded } from '@takeoff-icons/react/arrow-top';
import { DeleteIconOutlinedRounded } from '@takeoff-icons/react/delete';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFieldArray, useForm, useWatch, type Control, type Path } from 'react-hook-form';
import { StatusBadge } from '@/components/data-display/StatusBadge';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { flattenErrors } from '@/components/forms/flattenErrors';
import { SelectField, SwitchField, TextField } from '@/components/forms/fields';
import { SectionCard } from '@/components/layout/SectionCard';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { getErrorMessage, isValidationError } from '@/lib/errors';
import { useSaveMasterDataList } from '../api/mutations';
import { useMasterDataUsage } from '../api/queries';
import { getListDefinition, isSystemCode } from '../catalog';
import { useMasterData } from '../context';
import {
  emptyValueListRow,
  suggestCode,
  toMasterDataItems,
  toValueListFormValues,
  valueListFormSchema,
  type ValueListFormValues,
} from '../schemas/valueListForm';
import type { MasterDataListKey, MasterDataUsage } from '../types';
import { VARIANT_OPTIONS } from '../utils/variantPresentation';

interface RowProps {
  listKey: MasterDataListKey;
  control: Control<ValueListFormValues>;
  index: number;
  count: number;
  usage: MasterDataUsage | undefined;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  setCode: (index: number, code: string) => void;
}

function ValueRow({ listKey, control, index, count, usage, onMove, onRemove, setCode }: RowProps) {
  const definition = getListDefinition(listKey);
  const row = useWatch({ control, name: `items.${index}` });
  const system = !row.isNew && isSystemCode(listKey, row.code);
  const uses = row.isNew ? 0 : (usage?.[row.code] ?? 0);
  const name = row.label.trim() || `${index + 1}. değer`;
  const deletable = !system && uses === 0;

  // New rows: the code follows the label until the admin types a different code.
  const lastSuggestion = useRef('');
  useEffect(() => {
    if (!row.isNew) return;
    const suggestion = suggestCode(row.label);
    const following = row.code === '' || row.code === lastSuggestion.current;
    lastSuggestion.current = suggestion;
    if (following && row.code !== suggestion) setCode(index, suggestion);
  }, [row.isNew, row.label, row.code, index, setCode]);

  return (
    <li className={`c-value-row${row.active ? '' : ' c-value-row--inactive'}`}>
      <div className="c-value-row__order" role="group" aria-label={`${name} sırası`}>
        <Button
          type="button"
          size="small"
          variant="neutral"
          appearance="text"
          startContent={<ArrowTopIconOutlinedRounded aria-hidden="true" />}
          aria-label={`${name}: yukarı taşı`}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        />
        <Button
          type="button"
          size="small"
          variant="neutral"
          appearance="text"
          startContent={<ArrowBottomIconOutlinedRounded aria-hidden="true" />}
          aria-label={`${name}: aşağı taşı`}
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
        />
      </div>

      <div className="c-value-row__fields">
        <div className="c-value-row__head">
          {definition.colored ? (
            <StatusBadge
              label={row.label.trim() || 'Önizleme'}
              variant={VARIANT_OPTIONS.find((o) => o.value === row.variant)?.value ?? 'neutral'}
            />
          ) : (
            <strong>{row.label.trim() || 'Yeni değer'}</strong>
          )}
          {!row.isNew && <code className="c-code-chip">{row.code}</code>}
          {system && (
            <Badge variant="neutral" appearance="outlined" size="small">
              Sistem değeri
            </Badge>
          )}
          {!row.active && (
            <Badge variant="warning" appearance="outlined" size="small">
              Pasif
            </Badge>
          )}
          <span className="c-muted c-value-row__usage">
            {row.isNew
              ? 'Kaydedilmedi'
              : uses > 0
                ? `${uses} kayıtta kullanılıyor`
                : 'Kullanılmıyor'}
          </span>
        </div>

        <div
          className={`c-form-grid ${definition.colored ? 'c-form-grid--four' : 'c-form-grid--three'}`}
        >
          <TextField control={control} name={`items.${index}.label`} label="Ad" required />
          {row.isNew ? (
            <TextField
              control={control}
              name={`items.${index}.code`}
              label="Kod"
              required
              description="Kayıtlarda saklanır; kaydettikten sonra değiştirilemez."
            />
          ) : null}
          <TextField
            control={control}
            name={`items.${index}.description`}
            label="Açıklama"
            className={row.isNew ? undefined : 'c-value-row__wide'}
          />
          {definition.colored && (
            <SelectField
              control={control}
              name={`items.${index}.variant`}
              label="Renk"
              required
              options={VARIANT_OPTIONS}
            />
          )}
        </div>
      </div>

      <div className="c-value-row__side">
        {system ? (
          <span className="c-muted c-value-row__hint">
            Sistem değeri: her zaman aktif, silinemez.
          </span>
        ) : (
          <SwitchField
            control={control}
            name={`items.${index}.active`}
            label="Aktif"
            description="Pasif değerler yeni kayıtlarda seçilemez."
          />
        )}
        {!system && (
          <Button
            type="button"
            size="small"
            variant="danger"
            appearance="text"
            startContent={<DeleteIconOutlinedRounded aria-hidden="true" />}
            aria-label={`${name}: sil`}
            disabled={!deletable}
            onClick={() => onRemove(index)}
          >
            Sil
          </Button>
        )}
        {!system && !deletable && (
          <span className="c-muted c-value-row__hint">Kullanımda; silmek yerine pasife alın.</span>
        )}
      </div>
    </li>
  );
}

/** Edits one value list: labels, descriptions, colours, order, active flags and custom values. */
export function ValueListEditor({ listKey }: { listKey: MasterDataListKey }) {
  const definition = getListDefinition(listKey);
  const items = useMasterData().items(listKey);
  const usage = useMasterDataUsage(listKey);
  const save = useSaveMasterDataList(listKey);
  const defaults = useMemo(() => toValueListFormValues(items), [items]);

  const form = useForm<ValueListFormValues>({
    resolver: zodResolver(valueListFormSchema(listKey)),
    defaultValues: defaults,
    values: defaults,
    resetOptions: { keepDirtyValues: false },
  });
  const { control, formState } = form;
  const rows = useFieldArray({ control, name: 'items' });
  const { blocker } = useUnsavedChangesGuard(formState.isDirty);
  const messages = formState.submitCount > 0 ? flattenErrors(formState.errors) : [];

  const submit = form.handleSubmit(async (values) => {
    try {
      await save.mutateAsync(toMasterDataItems(listKey, values));
    } catch (error) {
      const message = getErrorMessage(error);
      if (isValidationError(error) && error.field) {
        form.setError(error.field as Path<ValueListFormValues>, { type: 'server', message });
      } else {
        form.setError('root.server', { type: 'server', message });
      }
    }
  });

  const addRow = () => {
    rows.append(emptyValueListRow(definition.colored), {
      shouldFocus: true,
      focusName: `items.${rows.fields.length}.label`,
    });
  };

  const { setValue } = form;
  const setCode = useCallback(
    (index: number, code: string) => setValue(`items.${index}.code`, code, { shouldDirty: true }),
    [setValue],
  );

  return (
    <SectionCard
      title={definition.label}
      description={definition.description}
      actions={
        <span className="c-inline-list">
          <Badge
            variant={definition.extensible ? 'info' : 'neutral'}
            appearance="outlined"
            size="small"
          >
            {definition.extensible ? 'Yeni değer eklenebilir' : 'Sabit liste'}
          </Badge>
          {definition.colored && (
            <Badge variant="neutral" appearance="outlined" size="small">
              Renkli rozet
            </Badge>
          )}
        </span>
      }
    >
      <form className="c-stack" onSubmit={(event) => void submit(event)} noValidate>
        <p className="c-muted">
          <strong>Kullanıldığı yerler:</strong> {definition.usedIn}.{' '}
          {definition.extensible
            ? 'Sistem değerleri silinemez; kendi eklediğiniz değerler kullanılmıyorsa silinebilir, kullanılıyorsa pasife alınabilir.'
            : 'Bu listenin değerleri iş kurallarında kullanıldığı için eklenemez veya silinemez; adlarını, açıklamalarını, renklerini ve sıralarını değiştirebilirsiniz.'}
        </p>

        {(messages.length > 0 || formState.errors.root?.server) && (
          <Alert variant="danger" appearance="outlined" role="alert">
            <Alert.Content>
              <Alert.Title level={3}>Kaydedilemedi</Alert.Title>
              <ul className="c-form-error-list">
                {[...messages].map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </Alert.Content>
          </Alert>
        )}

        <ol className="c-value-list" aria-label={`${definition.label} değerleri`}>
          {rows.fields.map((field, index) => (
            <ValueRow
              key={field.id}
              listKey={listKey}
              control={control}
              index={index}
              count={rows.fields.length}
              usage={usage.data}
              onMove={rows.move}
              onRemove={rows.remove}
              setCode={setCode}
            />
          ))}
        </ol>

        <div className="c-form-actions" role="group" aria-label="Liste işlemleri">
          <div>
            {definition.extensible && (
              <Button
                type="button"
                variant="neutral"
                appearance="outlined"
                startContent={<AddIconOutlinedRounded aria-hidden="true" />}
                onClick={addRow}
              >
                Değer ekle
              </Button>
            )}
          </div>
          <div className="c-form-actions__main">
            <Button
              type="button"
              variant="neutral"
              appearance="outlined"
              disabled={!formState.isDirty || formState.isSubmitting}
              onClick={() => form.reset(defaults)}
            >
              Değişiklikleri geri al
            </Button>
            <Button
              type="submit"
              loading={formState.isSubmitting}
              disabled={!formState.isDirty || formState.isSubmitting}
            >
              Kaydet
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title="Kaydedilmemiş değişiklikler silinsin mi?"
        confirmLabel="Değişiklikleri at"
        cancelLabel="Düzenlemeye devam et"
        tone="danger"
        onConfirm={() => blocker.proceed?.()}
      >
        <p>{definition.label} listesinde kaydedilmemiş değişiklikler var.</p>
      </ConfirmDialog>
    </SectionCard>
  );
}
