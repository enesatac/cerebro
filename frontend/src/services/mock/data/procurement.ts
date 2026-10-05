import type { ProcurementNote, ProcurementStep } from '@/domains/procurement/types';
import { CON, PERSON } from './ids';
import { seedId } from './sequence';

/** A step row of the mock table: the domain step plus the purchase (contract) it belongs to. */
export type ProcurementStepRow = ProcurementStep & { contractId: number };
export type ProcurementNoteRow = ProcurementNote & { contractId: number };

type StepSeed = [
  type: string,
  status: string,
  owner: number | null,
  planned: [start: string, end: string],
  actual?: [start: string | null, end?: string | null],
  note?: string,
];

const steps = (contractId: number, rows: StepSeed[]): ProcurementStepRow[] =>
  rows.map(
    ([type, status, ownerId, [plannedStart, plannedEnd], actual = [null, null], note = '']) => ({
      id: seedId('procurementSteps'),
      contractId,
      type,
      status,
      ownerId,
      plannedStart,
      plannedEnd,
      actualStart: actual[0],
      actualEnd: actual[1] ?? null,
      note,
    }),
  );

/**
 * Seed processes (today in the demo is early October 2026): a purchase in negotiation that runs
 * late, a BI licence at market research, a blocked renewal, a finished data-centre purchase and an
 * e-KYC service waiting for acceptance. The other contracts have no process yet.
 */
export const procurementSteps: ProcurementStepRow[] = [
  ...steps(CON.bookingMigration, [
    [
      'need-definition',
      'done',
      PERSON.lucasMoreau,
      ['2026-06-01', '2026-06-20'],
      ['2026-06-01', '2026-06-18'],
    ],
    [
      'market-research',
      'done',
      PERSON.lucasMoreau,
      ['2026-06-22', '2026-07-10'],
      ['2026-06-22', '2026-07-15'],
      'Dört veri taşıma firması incelendi.',
    ],
    ['rfq', 'done', PERSON.sofiaMarin, ['2026-07-13', '2026-08-05'], ['2026-07-20', '2026-08-08']],
    [
      'offer-evaluation',
      'done',
      PERSON.lucasMoreau,
      ['2026-08-10', '2026-08-31'],
      ['2026-08-11', '2026-09-04'],
      'Teknik puanlama: Nova 82, Atlas 76, Delta 61.',
    ],
    [
      'negotiation',
      'in-progress',
      PERSON.sofiaMarin,
      ['2026-09-01', '2026-09-20'],
      ['2026-09-07'],
      'İkinci tur fiyat teklifi bekleniyor.',
    ],
    ['approval', 'not-started', PERSON.zeynepCelik, ['2026-09-21', '2026-10-05']],
    ['purchase-order', 'not-started', PERSON.sofiaMarin, ['2026-10-06', '2026-10-10']],
    ['contract-signing', 'not-started', PERSON.lucasMoreau, ['2026-10-12', '2026-10-25']],
    ['delivery', 'not-started', PERSON.lucasMoreau, ['2026-11-01', '2026-12-15']],
  ]),
  ...steps(CON.biPlatform, [
    [
      'need-definition',
      'done',
      PERSON.yukiTanaka,
      ['2026-08-15', '2026-09-05'],
      ['2026-08-15', '2026-09-03'],
    ],
    [
      'market-research',
      'in-progress',
      PERSON.yukiTanaka,
      ['2026-09-08', '2026-10-10'],
      ['2026-09-10'],
      'Üç ürün kısa listede; referans görüşmeleri sürüyor.',
    ],
    ['rfq', 'not-started', PERSON.sofiaMarin, ['2026-10-13', '2026-11-07']],
    ['offer-evaluation', 'not-started', PERSON.yukiTanaka, ['2026-11-10', '2026-11-28']],
    ['approval', 'not-started', PERSON.zeynepCelik, ['2026-12-01', '2026-12-12']],
    ['contract-signing', 'not-started', PERSON.yukiTanaka, ['2026-12-15', '2026-12-31']],
  ]),
  ...steps(CON.observability, [
    [
      'need-definition',
      'done',
      PERSON.tomBrennan,
      ['2026-08-01', '2026-08-15'],
      ['2026-08-01', '2026-08-12'],
      'Kullanım verisiyle lisans ihtiyacı yeniden hesaplandı.',
    ],
    [
      'negotiation',
      'blocked',
      PERSON.tomBrennan,
      ['2026-08-18', '2026-09-30'],
      ['2026-08-20'],
      'Yeni fiyat listesi %22 artış içeriyor; yönetim kararı bekleniyor.',
    ],
    ['approval', 'not-started', PERSON.zeynepCelik, ['2026-10-01', '2026-10-15']],
    ['contract-signing', 'not-started', PERSON.tomBrennan, ['2026-10-16', '2026-11-07']],
  ]),
  ...steps(CON.drSite, [
    [
      'need-definition',
      'done',
      PERSON.aylinDemir,
      ['2025-11-03', '2025-11-21'],
      ['2025-11-03', '2025-11-21'],
    ],
    ['rfq', 'done', PERSON.aylinDemir, ['2025-11-24', '2025-12-19'], ['2025-11-24', '2025-12-22']],
    [
      'offer-evaluation',
      'done',
      PERSON.aylinDemir,
      ['2026-01-05', '2026-01-23'],
      ['2026-01-05', '2026-01-30'],
    ],
    [
      'approval',
      'done',
      PERSON.zeynepCelik,
      ['2026-01-26', '2026-02-06'],
      ['2026-02-02', '2026-02-10'],
    ],
    [
      'contract-signing',
      'done',
      PERSON.aylinDemir,
      ['2026-02-09', '2026-02-27'],
      ['2026-02-16', '2026-03-01'],
    ],
    [
      'delivery',
      'done',
      PERSON.aylinDemir,
      ['2026-03-02', '2026-03-14'],
      ['2026-03-02', '2026-03-14'],
    ],
    [
      'acceptance',
      'done',
      PERSON.aylinDemir,
      ['2026-03-15', '2026-03-31'],
      ['2026-03-16', '2026-04-03'],
      'Felaket kurtarma tatbikatı başarılı.',
    ],
    [
      'invoicing',
      'done',
      PERSON.aylinDemir,
      ['2026-04-01', '2026-04-15'],
      ['2026-04-07', '2026-04-14'],
    ],
  ]),
  ...steps(CON.identityVerification, [
    [
      'need-definition',
      'done',
      PERSON.priyaRaman,
      ['2025-10-01', '2025-10-17'],
      ['2025-10-01', '2025-10-17'],
    ],
    ['rfq', 'done', PERSON.priyaRaman, ['2025-10-20', '2025-11-14'], ['2025-10-20', '2025-11-18']],
    [
      'offer-evaluation',
      'done',
      PERSON.priyaRaman,
      ['2025-11-17', '2025-12-05'],
      ['2025-11-17', '2025-12-05'],
    ],
    [
      'negotiation',
      'skipped',
      null,
      ['2025-12-08', '2025-12-12'],
      [null, null],
      'Çerçeve anlaşma fiyatı geçerli.',
    ],
    [
      'approval',
      'done',
      PERSON.zeynepCelik,
      ['2025-12-08', '2025-12-19'],
      ['2025-12-08', '2026-01-09'],
    ],
    [
      'contract-signing',
      'done',
      PERSON.priyaRaman,
      ['2026-01-05', '2026-01-20'],
      ['2026-01-12', '2026-01-20'],
    ],
    [
      'delivery',
      'done',
      PERSON.priyaRaman,
      ['2026-01-21', '2026-02-01'],
      ['2026-01-21', '2026-02-01'],
    ],
    [
      'acceptance',
      'waiting',
      PERSON.priyaRaman,
      ['2026-02-02', '2026-02-28'],
      ['2026-02-02'],
      'Doğrulama başarı oranı kabul ölçütünün altında (%92, hedef %95).',
    ],
  ]),
];

type NoteSeed = [contractId: number, at: string, author: number, text: string, internal?: boolean];

const NOTES: NoteSeed[] = [
  [
    CON.bookingMigration,
    '2026-09-04T10:00:00Z',
    PERSON.lucasMoreau,
    'Üç tedarikçiden teklif alındı; ikisi teknik değerlendirmeyi geçti.',
  ],
  [
    CON.bookingMigration,
    '2026-09-15T14:20:00Z',
    PERSON.zeynepCelik,
    'Hedef fiyat bütçenin %8 üzerinde; pazarlıkta kapsam daraltma seçeneği de konuşulacak.',
    true,
  ],
  [
    CON.biPlatform,
    '2026-09-20T09:30:00Z',
    PERSON.yukiTanaka,
    'Analist raporu incelendi; iki referans müşteri görüşmesi planlandı.',
  ],
  [
    CON.observability,
    '2026-09-28T11:00:00Z',
    PERSON.tomBrennan,
    'Alternatif olarak açık kaynak yığına geçişin maliyeti çıkarılıyor.',
    true,
  ],
  [
    CON.observability,
    '2026-09-30T08:45:00Z',
    PERSON.tomBrennan,
    'Mevcut abonelik 14 Kasım’da bitiyor; karar Ekim ortasına kadar verilmeli.',
  ],
  [
    CON.drSite,
    '2026-04-03T16:00:00Z',
    PERSON.aylinDemir,
    'Kabul testleri tamamlandı, felaket kurtarma tatbikatı başarılı.',
  ],
  [
    CON.identityVerification,
    '2026-09-25T13:15:00Z',
    PERSON.priyaRaman,
    'Tedarikçi model iyileştirmesini 15 Ekim’e kadar teslim edecek.',
  ],
];

export const procurementNotes: ProcurementNoteRow[] = NOTES.map(
  ([contractId, at, authorId, text, internal = false]) => ({
    id: seedId('procurementNotes'),
    contractId,
    at,
    authorId,
    text,
    internal,
  }),
);
