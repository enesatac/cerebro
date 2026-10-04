import type {
  Demand,
  DemandAssessment,
  DemandEvent,
  DemandInput,
  DemandScore,
  DemandStatus,
} from '@/domains/demands/types';
import type { PersonId } from '@/domains/shared/types';
import { auditOf } from './audit';
import { APP, BU, DEM, PERSON, PRJ } from './ids';
import { seedId } from './sequence';

type Step = [date: string, status: DemandStatus, by: PersonId, note?: string];
type Scores = [
  value: DemandScore,
  fit: DemandScore,
  time: DemandScore,
  risk: DemandScore,
  effort: DemandScore,
];

interface DemandSeed extends Partial<DemandInput> {
  id: number;
  title: string;
  type: string;
  businessUnitId: number;
  requesterId: PersonId;
  problem: string;
  expectedBenefits: string;
  /** Status changes, oldest first; the first is the submission, the last the current status. */
  steps: [Step, ...Step[]];
  scores?: Scores;
  assessment?: Partial<DemandAssessment>;
}

const NO_ASSESSMENT: DemandAssessment = {
  businessValue: null,
  strategicFit: null,
  timeCriticality: null,
  riskReduction: null,
  effort: null,
  priority: null,
  assessorId: null,
  plannedStart: null,
  plannedEnd: null,
  decisionNote: '',
  projectId: null,
};

const at = (date: string) => `${date}T09:00:00Z`;

function demand(seed: DemandSeed): Demand {
  const { id, steps, scores, assessment, ...input } = seed;
  const history: DemandEvent[] = steps.map(([date, status, by, note = '']) => ({
    id: seedId('demandEvents'),
    at: at(date),
    byId: by,
    status,
    note,
  }));
  const first = steps[0];
  const last = steps.at(-1) ?? first;
  return {
    sponsorId: null,
    proposedSolution: '',
    benefitTypes: [],
    urgency: 'medium',
    desiredDate: null,
    deadlineReason: '',
    regulatory: false,
    affectedUsers: null,
    estimatedBudget: null,
    currency: 'TRY',
    relatedApplicationIds: [],
    ...input,
    id,
    code: `TLP-${String(id).padStart(4, '0')}`,
    status: last[1],
    submittedAt: at(first[0]),
    assessment: {
      ...NO_ASSESSMENT,
      ...(scores && {
        businessValue: scores[0],
        strategicFit: scores[1],
        timeCriticality: scores[2],
        riskReduction: scores[3],
        effort: scores[4],
      }),
      ...assessment,
    },
    history,
    audit: auditOf({ created: first[0], updated: last[0], reviewed: null, by: first[2] }),
  };
}

const PMO = PERSON.zeynepCelik;

/**
 * Seed demands from every business unit, across the whole workflow: new requests waiting for
 * triage, some asked for more information, scored backlog items, scheduled ones on the roadmap,
 * and closed ones (became a project, rejected, withdrawn).
 */
export const demands: Demand[] = [
  demand({
    id: DEM.loyaltyMobile,
    title: 'Sadakat programının mobil uygulamaya taşınması',
    type: 'new-project',
    businessUnitId: BU.digitalChannels,
    requesterId: PERSON.elifKaya,
    sponsorId: PERSON.emmaLindqvist,
    problem:
      'Mil kazanımı ve harcaması yalnızca web sitesinden yapılabiliyor; mobil kullanıcıların %60’ı programa hiç giriş yapmıyor.',
    proposedSolution: 'Mobil uygulamada üyelik, mil bakiyesi, kazanım ve harcama akışları.',
    expectedBenefits: 'Aktif üye sayısında %25 artış, ek ürün satışından yıllık gelir.',
    benefitTypes: ['revenue', 'customer-experience'],
    urgency: 'high',
    desiredDate: '2026-06-30',
    deadlineReason: 'Yaz sezonu kampanyası.',
    affectedUsers: 1200000,
    estimatedBudget: 18000000,
    relatedApplicationIds: [APP.loyaltyEngine, APP.customerPortal],
    steps: [
      ['2025-11-10', 'submitted', PERSON.elifKaya],
      ['2025-11-18', 'in-review', PMO],
      ['2025-12-05', 'approved', PMO, 'Gelir etkisi yüksek; 2026 bütçesine alındı.'],
      ['2026-01-12', 'converted', PMO, 'Sadakat Programı Lansmanı projesi olarak başladı.'],
    ],
    scores: [5, 5, 4, 2, 4],
    assessment: {
      priority: 'p1',
      assessorId: PMO,
      plannedStart: '2026-01-12',
      plannedEnd: '2026-12-15',
      decisionNote: 'Sadakat Programı Lansmanı projesi olarak başladı.',
      projectId: PRJ.loyaltyLaunch,
    },
  }),
  demand({
    id: DEM.workforceMfa,
    title: 'Tüm çalışanlar için çok faktörlü kimlik doğrulama',
    type: 'compliance',
    businessUnitId: BU.technology,
    requesterId: PERSON.graceMensah,
    sponsorId: PERSON.canOzturk,
    problem: 'Çalışan hesaplarının bir kısmı yalnızca şifreyle korunuyor; denetim bulgusu var.',
    proposedSolution: 'Tüm iç uygulamalarda kurumsal kimlik sağlayıcı üzerinden MFA.',
    expectedBenefits: 'Hesap ele geçirme riskinin azalması, denetim bulgusunun kapanması.',
    benefitTypes: ['compliance', 'risk-reduction'],
    urgency: 'critical',
    regulatory: true,
    desiredDate: '2026-09-30',
    deadlineReason: 'Bilgi güvenliği denetimi kapanış tarihi.',
    affectedUsers: 9000,
    relatedApplicationIds: [APP.customerIdentity, APP.employeeSelfService],
    steps: [
      ['2026-01-20', 'submitted', PERSON.graceMensah],
      ['2026-01-27', 'approved', PMO, 'Denetim bulgusu; erteleme seçeneği yok.'],
      ['2026-02-16', 'converted', PMO, 'Çalışan MFA Yaygınlaştırması projesi.'],
    ],
    scores: [3, 4, 5, 5, 3],
    assessment: {
      priority: 'p1',
      assessorId: PMO,
      plannedStart: '2026-02-16',
      plannedEnd: '2026-11-30',
      decisionNote: 'Çalışan MFA Yaygınlaştırması projesi.',
      projectId: PRJ.workforceMfa,
    },
  }),
  demand({
    id: DEM.walletBoardingPass,
    title: 'Biniş kartlarının Apple Wallet ve Google Wallet’a eklenmesi',
    type: 'enhancement',
    businessUnitId: BU.digitalChannels,
    requesterId: PERSON.elifKaya,
    sponsorId: PERSON.elifKaya,
    problem:
      'Yolcular biniş kartını ekran görüntüsü olarak saklıyor; kapı değişikliği gibi güncellemeleri göremiyorlar.',
    proposedSolution:
      'Check-in sonrası cüzdana ekleme; kapı, saat ve koltuk değişikliklerinde otomatik güncelleme.',
    expectedBenefits: 'Kapıda yaşanan gecikmelerde azalma, çağrı merkezi aramalarında düşüş.',
    benefitTypes: ['customer-experience', 'efficiency'],
    urgency: 'medium',
    desiredDate: '2027-03-31',
    affectedUsers: 800000,
    estimatedBudget: 2500000,
    relatedApplicationIds: [APP.customerPortal, APP.notificationService],
    steps: [
      ['2026-06-02', 'submitted', PERSON.elifKaya],
      ['2026-06-15', 'in-review', PMO],
      ['2026-07-08', 'approved', PMO, 'Yüksek müşteri etkisi, düşük efor.'],
      ['2026-08-20', 'scheduled', PMO, 'Dijital Deneyim ekibinin 2027 Ç1 planına alındı.'],
    ],
    scores: [4, 4, 3, 1, 2],
    assessment: {
      priority: 'p2',
      assessorId: PMO,
      plannedStart: '2027-01-11',
      plannedEnd: '2027-03-31',
      decisionNote: 'Dijital Deneyim ekibinin 2027 Ç1 planına alındı.',
    },
  }),
  demand({
    id: DEM.eInvoiceRegulation,
    title: 'e-Fatura ve e-Arşiv mevzuat değişikliğine uyum',
    type: 'compliance',
    businessUnitId: BU.finance,
    requesterId: PERSON.hannahSchulz,
    sponsorId: PERSON.hannahSchulz,
    problem: 'Yeni tebliğ ile fatura şemasında zorunlu alanlar değişiyor.',
    proposedSolution:
      'Finans platformunda fatura şablonları ve entegratör bağlantısının güncellenmesi.',
    expectedBenefits: 'Ceza riskinin ortadan kalkması.',
    benefitTypes: ['compliance'],
    urgency: 'critical',
    regulatory: true,
    desiredDate: '2026-12-31',
    deadlineReason: 'Tebliğ 1 Ocak 2027’de yürürlüğe giriyor.',
    estimatedBudget: 900000,
    relatedApplicationIds: [APP.financePlatform],
    steps: [
      ['2026-08-11', 'submitted', PERSON.hannahSchulz],
      ['2026-08-14', 'approved', PMO, 'Yasal zorunluluk.'],
      ['2026-08-25', 'scheduled', PMO, 'Finans Sistemleri ekibi Ekim’de başlıyor.'],
    ],
    scores: [2, 3, 5, 5, 2],
    assessment: {
      priority: 'p1',
      assessorId: PMO,
      plannedStart: '2026-10-12',
      plannedEnd: '2026-12-18',
      decisionNote: 'Finans Sistemleri ekibi Ekim’de başlıyor.',
    },
  }),
  demand({
    id: DEM.expenseOcr,
    title: 'Masraf uygulamasında fişlerin fotoğraftan okunması',
    type: 'enhancement',
    businessUnitId: BU.finance,
    requesterId: PERSON.oleHansen,
    problem: 'Çalışanlar her fişi elle giriyor; ayda yaklaşık 6.000 fiş işleniyor.',
    proposedSolution: 'Fotoğraftan tutar, tarih, KDV ve satıcı bilgisinin otomatik okunması.',
    expectedBenefits: 'Masraf girişinde fiş başına 3 dakika tasarruf, hatalı girişlerde azalma.',
    benefitTypes: ['efficiency', 'cost-saving'],
    urgency: 'low',
    affectedUsers: 4000,
    estimatedBudget: 600000,
    relatedApplicationIds: [APP.expenseManagement],
    steps: [
      ['2026-05-19', 'submitted', PERSON.oleHansen],
      ['2026-06-03', 'in-review', PMO],
      ['2026-06-24', 'approved', PMO, 'Kapasite açıldığında planlanacak.'],
    ],
    scores: [3, 2, 1, 1, 2],
    assessment: {
      priority: 'p3',
      assessorId: PMO,
      decisionNote: 'Kapasite açıldığında planlanacak.',
    },
  }),
  demand({
    id: DEM.crewFatigueDashboard,
    title: 'Uçuş ekibi yorgunluk riski raporlama paneli',
    type: 'reporting',
    businessUnitId: BU.operations,
    requesterId: PERSON.omarHaddad,
    sponsorId: PERSON.omarHaddad,
    problem:
      'Ekip çizelgelerindeki yorgunluk riski elle hesaplanıyor; otoriteye raporlama bir haftayı buluyor.',
    proposedSolution: 'Çizelge verisinden günlük yorgunluk skoru ve otorite raporu.',
    expectedBenefits:
      'Raporlama süresinin bir günden kısa olması; emniyet riskinin erken görülmesi.',
    benefitTypes: ['compliance', 'risk-reduction', 'efficiency'],
    urgency: 'high',
    regulatory: true,
    desiredDate: '2027-04-30',
    deadlineReason: 'Sivil havacılık otoritesinin yeni raporlama döngüsü.',
    affectedUsers: 150,
    relatedApplicationIds: [APP.crewScheduling, APP.enterpriseDataPlatform],
    steps: [
      ['2026-09-08', 'submitted', PERSON.omarHaddad],
      ['2026-09-16', 'in-review', PMO, 'Veri ekibiyle kapsam görüşülüyor.'],
    ],
    scores: [3, 4, 4, 4, 3],
    assessment: { assessorId: PMO },
  }),
  demand({
    id: DEM.maintenancePlanning,
    title: 'Bakım planlama sisteminin yenilenmesi',
    type: 'new-application',
    businessUnitId: BU.operations,
    requesterId: PERSON.lauraCosta,
    sponsorId: PERSON.omarHaddad,
    problem: 'Mevcut bakım planlama aracı üreticisi tarafından 2027 sonunda destekten çıkıyor.',
    proposedSolution: 'Piyasa ürünü seçimi, veri taşıma ve uçuş operasyonlarıyla entegrasyon.',
    expectedBenefits: 'Destek dışı yazılım riskinin kapanması, planlama doğruluğu.',
    benefitTypes: ['risk-reduction', 'efficiency'],
    urgency: 'high',
    desiredDate: '2027-12-31',
    deadlineReason: 'Üretici desteğinin bitişi.',
    estimatedBudget: 35000000,
    relatedApplicationIds: [APP.flightOperationsPortal],
    steps: [
      ['2026-04-14', 'submitted', PERSON.lauraCosta],
      ['2026-04-28', 'in-review', PMO],
      ['2026-06-10', 'approved', PMO],
      ['2026-07-01', 'scheduled', PMO, 'Ürün seçimi 2027 Ç1, uygulama Ç2–Ç4.'],
    ],
    scores: [4, 4, 4, 5, 5],
    assessment: {
      priority: 'p2',
      assessorId: PMO,
      plannedStart: '2027-02-01',
      plannedEnd: '2027-11-30',
      decisionNote: 'Ürün seçimi 2027 Ç1, uygulama Ç2–Ç4.',
    },
  }),
  demand({
    id: DEM.logConsolidation,
    title: 'Log yönetimi platformlarının tek platformda birleştirilmesi',
    type: 'infrastructure',
    businessUnitId: BU.technology,
    requesterId: PERSON.tomBrennan,
    sponsorId: PERSON.canOzturk,
    problem:
      'Üç ayrı log aracı var; olay anında loglar üç yerde aranıyor ve lisans maliyeti yüksek.',
    proposedSolution: 'Tek log platformu, ortak saklama politikası ve hazır panolar.',
    expectedBenefits: 'Yıllık lisans tasarrufu ve olaylarda daha kısa çözüm süresi.',
    benefitTypes: ['cost-saving', 'efficiency'],
    urgency: 'medium',
    estimatedBudget: 3200000,
    steps: [
      ['2026-07-21', 'submitted', PERSON.tomBrennan],
      ['2026-08-04', 'in-review', PMO],
      ['2026-09-01', 'approved', PMO, 'Lisans yenileme tarihinden önce başlanmalı.'],
    ],
    scores: [3, 3, 3, 3, 3],
    assessment: {
      priority: 'p2',
      assessorId: PMO,
      decisionNote: 'Lisans yenileme tarihinden önce başlanmalı.',
    },
  }),
  demand({
    id: DEM.realtimeRevenue,
    title: 'Yönetim için anlık gelir panosu',
    type: 'reporting',
    businessUnitId: BU.finance,
    requesterId: PERSON.sofiaMarin,
    problem: 'Gelir rakamları ertesi gün geliyor.',
    expectedBenefits: 'Gün içi karar alma.',
    benefitTypes: ['revenue'],
    urgency: 'medium',
    steps: [
      ['2026-03-03', 'submitted', PERSON.sofiaMarin],
      [
        '2026-03-17',
        'rejected',
        PMO,
        'Yönetim Raporlama Programı bu ihtiyacı 2026 Ç4’te karşılıyor; ayrı bir çalışma açılmayacak.',
      ],
    ],
    scores: [3, 2, 2, 1, 3],
    assessment: {
      priority: 'p4',
      assessorId: PMO,
      decisionNote:
        'Yönetim Raporlama Programı bu ihtiyacı 2026 Ç4’te karşılıyor; ayrı bir çalışma açılmayacak.',
    },
  }),
  demand({
    id: DEM.supplierPortal,
    title: 'Tedarikçi fatura takip portalı',
    type: 'new-application',
    businessUnitId: BU.finance,
    requesterId: PERSON.oleHansen,
    problem: 'Tedarikçiler fatura durumunu e-postayla soruyor.',
    expectedBenefits: 'Finans ekibinde e-posta yükünün azalması.',
    benefitTypes: ['efficiency'],
    urgency: 'low',
    steps: [
      ['2026-02-09', 'submitted', PERSON.oleHansen],
      [
        '2026-03-02',
        'withdrawn',
        PERSON.oleHansen,
        'Satın alınan ERP modülü bu ihtiyacı karşılıyor.',
      ],
    ],
  }),
  demand({
    id: DEM.hrLeaveMobile,
    title: 'İzin taleplerinin mobil uygulamadan yapılabilmesi',
    type: 'enhancement',
    businessUnitId: BU.peopleWorkplace,
    requesterId: PERSON.claireDubois,
    problem: 'Saha ve kabin ekipleri izin talebi için ofis bilgisayarına ihtiyaç duyuyor.',
    proposedSolution: 'Çalışan self servis uygulamasına mobil izin talebi ve onayı.',
    expectedBenefits: 'Çalışan memnuniyeti, onay süresinin kısalması.',
    benefitTypes: ['efficiency'],
    urgency: 'medium',
    affectedUsers: 6000,
    relatedApplicationIds: [APP.employeeSelfService, APP.hrCore],
    steps: [
      ['2026-08-26', 'submitted', PERSON.claireDubois],
      [
        '2026-09-09',
        'needs-info',
        PMO,
        'Kaç çalışanın şirket telefonu yok? Kişisel cihazdan erişim gerekiyorsa güvenlik değerlendirmesi de eklenmeli.',
      ],
    ],
    assessment: {
      assessorId: PMO,
      decisionNote:
        'Kaç çalışanın şirket telefonu yok? Kişisel cihazdan erişim gerekiyorsa güvenlik değerlendirmesi de eklenmeli.',
    },
  }),
  demand({
    id: DEM.serviceChatbot,
    title: 'Müşteri hizmetlerinde yapay zekâ destekli ön karşılama',
    type: 'new-project',
    businessUnitId: BU.digitalChannels,
    requesterId: PERSON.emmaLindqvist,
    sponsorId: PERSON.elifKaya,
    problem: 'Çağrı merkezine gelen taleplerin %40’ı rezervasyon durumu ve bagaj hakkı sorusu.',
    proposedSolution:
      'Web ve mobilde sık sorulan sorular için sohbet asistanı; gerekirse temsilciye aktarma.',
    expectedBenefits: 'Çağrı hacminde %25 azalma, 7/24 hizmet.',
    benefitTypes: ['cost-saving', 'customer-experience'],
    urgency: 'high',
    desiredDate: '2027-06-30',
    affectedUsers: 2000000,
    estimatedBudget: 7500000,
    relatedApplicationIds: [APP.customerPortal, APP.orderManagement],
    steps: [
      ['2026-09-01', 'submitted', PERSON.emmaLindqvist],
      ['2026-09-10', 'in-review', PMO],
    ],
    scores: [5, 5, 3, 2, 4],
    assessment: { assessorId: PMO },
  }),
  demand({
    id: DEM.notificationPreferences,
    title: 'Yolcu bildirim tercih merkezi',
    type: 'enhancement',
    businessUnitId: BU.digitalChannels,
    requesterId: PERSON.elifKaya,
    problem: 'Yolcular hangi bildirimleri hangi kanaldan alacağını seçemiyor; şikâyetler artıyor.',
    proposedSolution: 'Profilde kanal (SMS, e-posta, push) ve konu bazında tercih ekranı.',
    expectedBenefits: 'SMS maliyetinde düşüş, KVKK uyumu, şikâyetlerde azalma.',
    benefitTypes: ['customer-experience', 'cost-saving', 'compliance'],
    urgency: 'medium',
    affectedUsers: 3000000,
    relatedApplicationIds: [APP.notificationService, APP.customerPortal],
    steps: [['2026-09-22', 'submitted', PERSON.elifKaya]],
  }),
  demand({
    id: DEM.zeroTrustAccess,
    title: 'VPN yerine sıfır güven tabanlı uzaktan erişim',
    type: 'infrastructure',
    businessUnitId: BU.technology,
    requesterId: PERSON.marcusWebb,
    problem: 'VPN tüm iç ağa erişim veriyor; kapasite sorunları yaşanıyor.',
    proposedSolution: 'Uygulama bazlı erişim, cihaz durumu kontrolü.',
    expectedBenefits: 'Saldırı yüzeyinin küçülmesi, kullanıcı deneyimi.',
    benefitTypes: ['risk-reduction'],
    urgency: 'high',
    affectedUsers: 9000,
    steps: [['2026-10-01', 'submitted', PERSON.marcusWebb]],
  }),
  demand({
    id: DEM.cargoTracking,
    title: 'Kargo gönderi takibinin müşteri portalına eklenmesi',
    type: 'integration',
    businessUnitId: BU.operations,
    requesterId: PERSON.omarHaddad,
    problem: 'Kargo müşterileri gönderi durumunu öğrenmek için çağrı merkezini arıyor.',
    proposedSolution: 'Kargo sisteminden durum bilgisinin API ile portala aktarılması.',
    expectedBenefits: 'Çağrı hacminde azalma, kurumsal müşteri memnuniyeti.',
    benefitTypes: ['customer-experience'],
    urgency: 'medium',
    relatedApplicationIds: [APP.customerPortal, APP.apiGateway],
    steps: [['2026-09-29', 'submitted', PERSON.omarHaddad]],
  }),
];
