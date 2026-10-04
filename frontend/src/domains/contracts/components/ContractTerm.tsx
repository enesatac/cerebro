import { formatDate } from '@/lib/dates';
import type { Contract } from '../types';

/** "1 Şub 2026 – 31 Oca 2027", with the renewal rule underneath. */
export function ContractTerm({ contract }: { contract: Contract }) {
  const { startDate, endDate } = contract;
  if (!startDate && !endDate) return <span className="c-muted">Tarih yok</span>;
  return (
    <span className="c-cell-stack">
      <span>
        {formatDate(startDate)} – {endDate ? formatDate(endDate) : 'Süresiz'}
      </span>
      {contract.autoRenewal && (
        <span className="c-muted c-cell-stack__secondary">Otomatik yenilenir</span>
      )}
    </span>
  );
}
