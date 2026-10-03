import type { IsoDate } from '@/domains/shared/types';

/** A calendar quarter, e.g. `2027-Q1`. */
export interface Quarter {
  id: string;
  year: number;
  /** 1–4 */
  quarter: number;
  start: IsoDate;
  end: IsoDate;
  label: string;
}

const pad = (value: number) => String(value).padStart(2, '0');
const LAST_DAY = [31, 30, 30, 31];

export function quarterFrom(year: number, quarter: number): Quarter {
  const firstMonth = (quarter - 1) * 3 + 1;
  return {
    id: `${year}-Q${quarter}`,
    year,
    quarter,
    start: `${year}-${pad(firstMonth)}-01`,
    end: `${year}-${pad(firstMonth + 2)}-${LAST_DAY[quarter - 1]}`,
    label: `${year} Ç${quarter}`,
  };
}

/** The quarter a date falls in. */
export function quarterOf(date: IsoDate): Quarter {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  return quarterFrom(year, Math.floor((month - 1) / 3) + 1);
}

/** `count` consecutive quarters starting with the one `date` falls in. */
export function quartersFrom(date: IsoDate, count: number): Quarter[] {
  const first = quarterOf(date);
  return Array.from({ length: count }, (_, offset) => {
    const index = first.quarter - 1 + offset;
    return quarterFrom(first.year + Math.floor(index / 4), (index % 4) + 1);
  });
}

/** "2027 Ç1" or "2027 Ç1 – Ç3" / "2026 Ç4 – 2027 Ç2" for a planned range. */
export function formatQuarterRange(start: IsoDate, end: IsoDate): string {
  const from = quarterOf(start);
  const to = quarterOf(end);
  if (from.id === to.id) return from.label;
  return from.year === to.year ? `${from.label} – Ç${to.quarter}` : `${from.label} – ${to.label}`;
}
