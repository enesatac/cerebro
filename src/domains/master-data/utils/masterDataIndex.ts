import type { SelectOption } from '@/components/forms/fields';
import type {
  MasterDataItem,
  MasterDataList,
  MasterDataListKey,
  MasterDataVariant,
} from '../types';

export interface BadgePresentation {
  label: string;
  variant: MasterDataVariant;
}

/**
 * Read access to the value lists for rendering: labels, badges and select options. Built once per
 * load of the lists, so lookups are synchronous in components.
 */
export interface MasterDataIndex {
  items(key: MasterDataListKey): readonly MasterDataItem[];
  /** Display label of `code`; unknown codes fall back to the code itself. */
  label(key: MasterDataListKey, code: string): string;
  /** Label + colour for coloured lists (`neutral` when the list or value has no colour). */
  badge(key: MasterDataListKey, code: string): BadgePresentation;
  /**
   * Active values as select options, in admin-defined order. `keep` adds values that are inactive
   * but already stored on the record being edited, so editing never silently drops them.
   */
  options(key: MasterDataListKey, keep?: string | readonly string[] | null): SelectOption[];
}

export function createMasterDataIndex(lists: readonly MasterDataList[]): MasterDataIndex {
  const byKey = new Map(lists.map((list) => [list.key, list.items]));
  const byCode = new Map(
    lists.map((list) => [list.key, new Map(list.items.map((item) => [item.code, item]))]),
  );
  const find = (key: MasterDataListKey, code: string) => byCode.get(key)?.get(code);

  return {
    items: (key) => byKey.get(key) ?? [],
    label: (key, code) => find(key, code)?.label ?? code,
    badge(key, code) {
      const item = find(key, code);
      return { label: item?.label ?? code, variant: item?.variant ?? 'neutral' };
    },
    options(key, keep) {
      const kept = new Set(keep == null ? [] : typeof keep === 'string' ? [keep] : keep);
      return (byKey.get(key) ?? [])
        .filter((item) => item.active || kept.has(item.code))
        .map((item) => ({
          value: item.code,
          label: item.active ? item.label : `${item.label} (pasif)`,
        }));
    },
  };
}
