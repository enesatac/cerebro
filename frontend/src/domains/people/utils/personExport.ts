import type { MasterDataIndex } from '@/domains/master-data/utils/masterDataIndex';
import type { MasterDataListKey } from '@/domains/master-data/types';
import { workingDays } from '@/domains/leaves/utils/leaveCalendar';
import { sheet, type SheetColumn, type SheetSpec } from '@/lib/xlsxTypes';
import type { PersonGovernanceItem, PersonWorkItem, PersonWorkload } from '../types';
import { describeInvolvement } from './personPresentation';

type Labels = Pick<MasterDataIndex, 'label'>;

const refs = (items: readonly { name: string }[]) => items.map((i) => i.name).join('\n');

function workSheet(
  name: string,
  items: readonly PersonWorkItem[],
  masterData: Labels,
  statusList: MasterDataListKey,
  statusHeader: string,
  criticalityHeader: string,
): SheetSpec {
  return sheet<PersonWorkItem>({
    name,
    title: name,
    rows: items,
    columns: [
      { header: 'Kod', value: (w) => w.code },
      { header: 'Ad', value: (w) => w.name },
      {
        header: 'Kendi rolü',
        value: (w) => w.roles.map((r) => masterData.label('stakeholderRoles', r)).join('\n'),
      },
      {
        header: 'Ekibi üzerinden',
        value: (w) =>
          w.viaTeams
            .map(
              (t) =>
                `${t.team.name} (${masterData.label('teamResponsibilities', t.responsibility)})`,
            )
            .join('\n'),
      },
      { header: statusHeader, value: (w) => masterData.label(statusList, w.status) },
      { header: criticalityHeader, value: (w) => masterData.label('criticalities', w.criticality) },
    ],
  });
}

function governanceSheet(
  name: string,
  items: readonly PersonGovernanceItem[],
  masterData: Labels,
  statusList: MasterDataListKey,
  dateHeader: string,
): SheetSpec {
  const columns: SheetColumn<PersonGovernanceItem>[] = [
    { header: 'Başlık', value: (g) => g.title, width: 50 },
    { header: 'İlgisi', value: describeInvolvement },
    ...(items.some((g) => g.severity !== null)
      ? [
          {
            header: 'Önem derecesi',
            value: (g: PersonGovernanceItem) =>
              g.severity ? masterData.label('criticalities', g.severity) : null,
          },
        ]
      : []),
    { header: 'Durum', value: (g) => masterData.label(statusList, g.status) },
    { header: 'Aktif', value: (g) => g.active },
    { header: dateHeader, value: (g) => g.date, type: 'date' },
    { header: 'İlgili uygulamalar', value: (g) => refs(g.applications) },
    { header: 'İlgili projeler', value: (g) => refs(g.projects) },
  ];
  return sheet<PersonGovernanceItem>({ name, title: name, rows: items, columns });
}

/** Everything on a person's page as one workbook: a summary sheet plus one sheet per table. */
export function personWorkbook(workload: PersonWorkload, masterData: Labels): SheetSpec[] {
  const { person } = workload;
  const facts: [string, string | number][] = [
    ['Ad soyad', person.fullName],
    ['Unvan', person.jobTitle],
    ['E-posta', person.email],
    ['Konum', person.location ?? ''],
    ['İş birimi', workload.businessUnit?.name ?? ''],
    [
      'Ekipler',
      workload.teams.map((t) => `${t.team.name}${t.manager ? ' (yönetici)' : ''}`).join('\n'),
    ],
    ['Yönettiği iş birimleri', refs(workload.headOf)],
    ['Bugünkü iş sayısı', workload.loadToday.count],
    ['Bugünkü yük (%)', workload.loadToday.percent],
    ['Uygulama sayısı', workload.applications.length],
    ['Proje sayısı', workload.projects.length],
    ['Aktif eskalasyon', workload.escalations.filter((e) => e.active).length],
    ['Aktif risk', workload.risks.filter((r) => r.active).length],
  ];
  return [
    sheet<[string, string | number]>({
      name: 'Özet',
      title: `${person.fullName} — iş özeti`,
      subtitle: person.jobTitle,
      rows: facts,
      columns: [
        { header: 'Bilgi', value: (f) => f[0] },
        { header: 'Değer', value: (f) => f[1], width: 50 },
      ],
    }),
    workSheet(
      'Uygulamalar',
      workload.applications,
      masterData,
      'applicationLifecycles',
      'Yaşam döngüsü',
      'Kritiklik',
    ),
    workSheet('Projeler', workload.projects, masterData, 'projectStatuses', 'Durum', 'Öncelik'),
    governanceSheet(
      'Eskalasyonlar',
      workload.escalations,
      masterData,
      'escalationStatuses',
      'Hedef tarih',
    ),
    governanceSheet('Riskler', workload.risks, masterData, 'riskStatuses', 'Hedef tarih'),
    governanceSheet('Kararlar', workload.decisions, masterData, 'decisionStatuses', 'Karar tarihi'),
    sheet<PersonWorkload['allocations'][number]>({
      name: 'Kaynak planı',
      title: 'Süren ve planlanmış proje atamaları',
      rows: workload.allocations,
      columns: [
        { header: 'Proje', value: (a) => a.project.name },
        { header: 'Rol', value: (a) => masterData.label('stakeholderRoles', a.role) },
        { header: 'Başlangıç', value: (a) => a.startDate, type: 'date' },
        { header: 'Bitiş', value: (a) => a.endDate, type: 'date' },
        { header: 'Doluluk', value: (a) => a.percent, type: 'percent' },
      ],
    }),
    sheet<PersonWorkload['leaves'][number]>({
      name: 'İzinler',
      title: 'Süren ve planlanmış izinler',
      rows: workload.leaves,
      columns: [
        { header: 'İzin türü', value: (l) => masterData.label('leaveTypes', l.type) },
        { header: 'Başlangıç', value: (l) => l.startDate, type: 'date' },
        { header: 'Bitiş', value: (l) => l.endDate, type: 'date' },
        { header: 'İş günü', value: (l) => workingDays(l.startDate, l.endDate), type: 'integer' },
      ],
    }),
  ];
}
