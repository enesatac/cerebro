import { z } from 'zod';
import { optionalText, requiredText } from '@/lib/validation';
import { getListDefinition } from '../catalog';
import type { MasterDataItem, MasterDataListKey, MasterDataVariant } from '../types';

const CODE_PATTERN = /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/;

const itemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Kod zorunludur.')
    .max(40, 'Kod en fazla 40 karakter olabilir.')
    .regex(CODE_PATTERN, 'Kod yalnızca harf, rakam, kısa çizgi ve alt çizgi içerebilir.'),
  label: requiredText('Ad', 60),
  description: optionalText('Açıklama', 200),
  variant: z.string(),
  active: z.boolean(),
  /** Added in this session and not saved yet: its code is still editable. */
  isNew: z.boolean(),
});

export function valueListFormSchema(key: MasterDataListKey) {
  const { colored } = getListDefinition(key);
  return z.object({ items: z.array(itemSchema) }).superRefine(({ items }, ctx) => {
    const codes = new Map<string, number>();
    const labels = new Map<string, number>();
    items.forEach((item, index) => {
      const code = item.code.trim();
      const label = item.label.trim().toLocaleLowerCase('tr-TR');
      if (code && codes.has(code)) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', index, 'code'],
          message: `"${code}" kodu listede zaten var.`,
        });
      }
      if (label && labels.has(label)) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', index, 'label'],
          message: `"${item.label.trim()}" adı listede zaten var.`,
        });
      }
      codes.set(code, index);
      labels.set(label, index);
      if (colored && !item.variant) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', index, 'variant'],
          message: 'Bir renk seçin.',
        });
      }
    });
  });
}

export type ValueListFormValues = z.infer<ReturnType<typeof valueListFormSchema>>;
export type ValueListRow = ValueListFormValues['items'][number];

export function toValueListFormValues(items: readonly MasterDataItem[]): ValueListFormValues {
  return {
    items: items.map((item) => ({
      code: item.code,
      label: item.label,
      description: item.description,
      variant: item.variant ?? '',
      active: item.active,
      isNew: false,
    })),
  };
}

export function emptyValueListRow(colored: boolean): ValueListRow {
  return {
    code: '',
    label: '',
    description: '',
    variant: colored ? 'neutral' : '',
    active: true,
    isNew: true,
  };
}

export function toMasterDataItems(
  key: MasterDataListKey,
  values: ValueListFormValues,
): MasterDataItem[] {
  const { colored } = getListDefinition(key);
  return values.items.map((row) => ({
    code: row.code.trim(),
    label: row.label.trim(),
    description: row.description.trim(),
    variant: colored ? (row.variant as MasterDataVariant) : null,
    active: row.active,
  }));
}

/** Suggests a code from a Turkish label: "Mobil uygulama" → "mobil-uygulama". */
export function suggestCode(label: string): string {
  return label
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
