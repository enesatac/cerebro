import type { LeaveRecord, LeaveType } from '@/domains/leaves/types';
import type { PersonId } from '@/domains/shared/types';
import { auditOf } from './audit';
import { PERSON } from './ids';

type LeaveSeed = [personId: PersonId, type: LeaveType, start: string, end: string, note?: string];

/** Absences around "today" (late September 2026) so the calendar has something to show. */
const seeds: LeaveSeed[] = [
  [PERSON.canOzturk, 'annual', '2026-10-19', '2026-10-23', 'Yurt dışı'],
  [PERSON.canOzturk, 'training', '2026-11-17', '2026-11-18', 'Mimari zirvesi, Berlin'],
  [PERSON.elifKaya, 'annual', '2026-09-21', '2026-10-02'],
  [PERSON.elifKaya, 'excuse', '2026-11-06', '2026-11-06', 'Taşınma'],
  [PERSON.hannahSchulz, 'annual', '2026-10-05', '2026-10-09'],
  [PERSON.hannahSchulz, 'annual', '2026-12-21', '2027-01-01', 'Yılbaşı'],
  [PERSON.omarHaddad, 'sick', '2026-09-24', '2026-09-29'],
  [PERSON.omarHaddad, 'annual', '2026-11-02', '2026-11-13'],
  [PERSON.claireDubois, 'training', '2026-10-12', '2026-10-14', 'İK teknolojileri eğitimi'],
  [PERSON.marcusWebb, 'annual', '2026-09-28', '2026-10-09', 'Aile ziyareti'],
  [PERSON.marcusWebb, 'training', '2026-11-24', '2026-11-26'],
  [PERSON.graceMensah, 'annual', '2026-10-26', '2026-10-30'],
  [PERSON.selinAydin, 'excuse', '2026-10-01', '2026-10-01'],
  [PERSON.selinAydin, 'annual', '2026-11-09', '2026-11-20'],
  [PERSON.aylinDemir, 'annual', '2026-08-24', '2026-09-04'],
  [PERSON.aylinDemir, 'training', '2026-10-15', '2026-10-16', 'KubeCon hazırlık atölyesi'],
  [PERSON.jonasBerg, 'annual', '2026-10-05', '2026-10-16', 'İsveç'],
  [PERSON.priyaRaman, 'sick', '2026-10-07', '2026-10-08'],
  [PERSON.priyaRaman, 'annual', '2026-12-14', '2026-12-24'],
  [PERSON.danielOkafor, 'annual', '2026-09-30', '2026-10-06'],
  [PERSON.keremYildiz, 'annual', '2026-10-28', '2026-11-03', 'Cumhuriyet Bayramı köprüsü'],
  [PERSON.sofiaMarin, 'unpaid', '2026-11-16', '2026-11-27'],
  [PERSON.oleHansen, 'annual', '2026-10-12', '2026-10-23'],
  [PERSON.mehmetArslan, 'excuse', '2026-10-08', '2026-10-09', 'Evlilik'],
  [PERSON.lauraCosta, 'annual', '2026-09-14', '2026-09-25'],
  [PERSON.lauraCosta, 'training', '2026-10-21', '2026-10-21'],
  [PERSON.yukiTanaka, 'annual', '2026-10-01', '2026-10-13'],
  [PERSON.inesFerreira, 'sick', '2026-09-28', '2026-09-28'],
  [PERSON.inesFerreira, 'annual', '2026-11-30', '2026-12-04'],
  [PERSON.burakSahin, 'annual', '2026-10-19', '2026-10-30'],
  [PERSON.rafaelGomez, 'training', '2026-10-06', '2026-10-07', 'Ödeme sistemleri konferansı'],
  [PERSON.emmaLindqvist, 'annual', '2026-11-02', '2026-11-06'],
  [PERSON.ahmedNasser, 'annual', '2026-09-29', '2026-10-02'],
  [PERSON.zeynepCelik, 'annual', '2026-10-26', '2026-11-06'],
  [PERSON.lucasMoreau, 'excuse', '2026-10-14', '2026-10-14'],
  [PERSON.tomBrennan, 'annual', '2026-12-28', '2027-01-08'],
];

export const leaves: LeaveRecord[] = seeds.map(
  ([personId, type, startDate, endDate, note], index) => ({
    id: index + 1,
    personId,
    type,
    startDate,
    endDate,
    note: note ?? '',
    audit: auditOf({
      created: '2026-08-15',
      updated: '2026-09-10',
      reviewed: null,
      by: PERSON.selinAydin,
    }),
  }),
);
