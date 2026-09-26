import { StatusBadge } from '@/components/data-display/StatusBadge';
import { useMasterData } from '../context';
import type { MasterDataListKey } from '../types';

interface MasterBadgeProps {
  list: MasterDataListKey;
  code: string;
  /** Visually hidden prefix for screen readers, e.g. "Durum:". */
  context?: string;
  /** Overrides the visible text (e.g. "Yüksek öncelik"); `{label}` is replaced with the value. */
  format?: (label: string) => string;
}

/** A value from a coloured list, rendered with its admin-defined label and colour. */
export function MasterBadge({ list, code, context, format }: MasterBadgeProps) {
  const { label, variant } = useMasterData().badge(list, code);
  return <StatusBadge label={format ? format(label) : label} variant={variant} context={context} />;
}
