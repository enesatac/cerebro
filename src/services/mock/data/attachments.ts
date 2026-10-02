import type { Attachment, AttachmentOwnerType } from '@/domains/attachments/types';
import { samplePdf } from '../samplePdf';
import { auditOf } from './audit';
import { APP, DEC, ESC, PERSON, PRJ, RISK, TEAM, TECH } from './ids';

type AttachmentSeed = [
  ownerType: AttachmentOwnerType,
  ownerId: number,
  documentType: string,
  fileName: string,
  description: string,
  uploadedOn: string,
  uploadedBy: number,
];

/**
 * Seed files: metadata here, bytes generated on demand (`seedAttachmentContent`). Some records
 * deliberately miss required documents so the checklists have something to say.
 */
const seeds: AttachmentSeed[] = [
  [
    'application',
    APP.paymentGateway,
    'architecture',
    'Ödeme Geçidi — Mimari doküman v3.pdf',
    'Bileşenler, sağlayıcı yönlendirme ve veri akışları.',
    '2026-03-10',
    PERSON.graceMensah,
  ],
  [
    'application',
    APP.paymentGateway,
    'security-assessment',
    'Ödeme Geçidi — PCI DSS değerlendirmesi 2026.pdf',
    'Yıllık PCI DSS uyum değerlendirmesi ve bulgular.',
    '2026-05-22',
    PERSON.keremYildiz,
  ],
  [
    'application',
    APP.paymentGateway,
    'operations-guide',
    'Ödeme Geçidi — Operasyon kılavuzu.pdf',
    'Dağıtım, izleme ve nöbet devri.',
    '2026-06-04',
    PERSON.keremYildiz,
  ],
  [
    'application',
    APP.paymentGateway,
    'contract',
    'Kart işlemcisi hizmet sözleşmesi (özet).pdf',
    'SLA ve destek seviyeleri özeti.',
    '2025-12-01',
    PERSON.hannahSchulz,
  ],
  [
    'application',
    APP.customerIdentity,
    'architecture',
    'CIP — Mimari genel bakış.pdf',
    'OIDC akışları ve bölgesel yerleşim.',
    '2026-02-14',
    PERSON.marcusWebb,
  ],
  [
    'application',
    APP.apiGateway,
    'architecture',
    'API Geçidi — Mimari.pdf',
    'Rota yapısı, hız sınırlama ve kimlik doğrulama.',
    '2026-01-20',
    PERSON.selinAydin,
  ],
  [
    'application',
    APP.apiGateway,
    'operations-guide',
    'API Geçidi — Operasyon kılavuzu.pdf',
    'Sertifika yenileme ve ölçeklendirme.',
    '2026-01-21',
    PERSON.selinAydin,
  ],
  [
    'project',
    PRJ.digitalOnboarding,
    'charter',
    'DOT — Proje beratı.pdf',
    'Kapsam, hedefler ve bütçe onayı.',
    '2026-02-10',
    PERSON.zeynepCelik,
  ],
  [
    'project',
    PRJ.digitalOnboarding,
    'requirements',
    'DOT — İş analizi v2.pdf',
    'Müşteri kazanım akışı gereksinimleri.',
    '2026-04-03',
    PERSON.nadiaPetrova,
  ],
  [
    'project',
    PRJ.digitalOnboarding,
    'meeting-notes',
    'DOT — Yönlendirme komitesi notları (Eylül).pdf',
    'Tedarikçi gecikmesi ve alınan kararlar.',
    '2026-09-18',
    PERSON.zeynepCelik,
  ],
  [
    'project',
    PRJ.paymentModernisation,
    'charter',
    'PAYMOD — Proje beratı.pdf',
    'Modernizasyon kapsamı ve aşamalar.',
    '2026-01-08',
    PERSON.lucasMoreau,
  ],
  [
    'project',
    PRJ.paymentModernisation,
    'requirements',
    'PAYMOD — Gereksinimler.pdf',
    'Fonksiyonel ve fonksiyonel olmayan gereksinimler.',
    '2026-03-02',
    PERSON.sofiaMarin,
  ],
  [
    'project',
    PRJ.paymentModernisation,
    'design',
    'PAYMOD — Teknik tasarım.pdf',
    'Hedef mimari ve geçiş planı.',
    '2026-04-15',
    PERSON.keremYildiz,
  ],
  [
    'project',
    PRJ.workforceMfa,
    'charter',
    'WMFA — Proje beratı.pdf',
    'Çalışan MFA yaygınlaştırma kapsamı.',
    '2025-09-01',
    PERSON.lucasMoreau,
  ],
  [
    'project',
    PRJ.workforceMfa,
    'requirements',
    'WMFA — Gereksinimler.pdf',
    'Desteklenen doğrulayıcılar ve istisnalar.',
    '2025-09-20',
    PERSON.graceMensah,
  ],
  [
    'project',
    PRJ.workforceMfa,
    'test-report',
    'WMFA — Test raporu.pdf',
    'Pilot ve kabul testi sonuçları.',
    '2026-02-27',
    PERSON.graceMensah,
  ],
  [
    'project',
    PRJ.workforceMfa,
    'go-live-approval',
    'WMFA — Canlıya geçiş onayı.pdf',
    'Değişiklik danışma kurulu onayı.',
    '2026-03-05',
    PERSON.canOzturk,
  ],
  [
    'team',
    TEAM.platform,
    'operations-guide',
    'Platform ekibi — Nöbet el kitabı.pdf',
    'Nöbet sırası, eskalasyon ve devir kuralları.',
    '2026-05-12',
    PERSON.aylinDemir,
  ],
  [
    'technology',
    TECH.kafka,
    'license',
    'Kafka — Kurumsal destek sözleşmesi.pdf',
    'Destek kapsamı ve yenileme tarihi.',
    '2026-01-30',
    PERSON.marcusWebb,
  ],
  [
    'risk',
    RISK.payDbSupport,
    'security-assessment',
    'Oracle 12c — Yama durumu değerlendirmesi.pdf',
    'Telafi edici kontroller ve kalan risk.',
    '2026-08-30',
    PERSON.keremYildiz,
  ],
  [
    'escalation',
    ESC.paySettlementMismatch,
    'incident-report',
    'Mutabakat uyuşmazlığı — Olay raporu.pdf',
    'Kök neden ve düzeltici aksiyonlar.',
    '2026-08-08',
    PERSON.keremYildiz,
  ],
  [
    'decision',
    DEC.lbcRetire,
    'design',
    'LBC emeklilik — Geçiş tasarımı.pdf',
    'Kanalların taşınma sırası ve geri dönüş planı.',
    '2026-06-20',
    PERSON.zeynepCelik,
  ],
];

const CONTENT_NOTE = 'Cerebro demo belgesi - ornek icerik.';

/** The bytes of a seed file, regenerated identically from its metadata whenever needed. */
export function seedAttachmentContent(
  attachment: Pick<Attachment, 'fileName' | 'description'>,
): Blob {
  return samplePdf(attachment.fileName.replace(/\.pdf$/i, ''), [
    attachment.description,
    CONTENT_NOTE,
  ]);
}

export const attachments: Attachment[] = seeds.map(
  ([type, id, documentType, fileName, description, uploadedOn, uploadedBy], index) => ({
    id: index + 1,
    owner: { type, id },
    documentType,
    fileName,
    contentType: 'application/pdf',
    sizeBytes: seedAttachmentContent({ fileName, description }).size,
    description,
    uploadedAt: `${uploadedOn}T10:00:00Z`,
    uploadedBy,
    audit: auditOf({ created: uploadedOn, updated: uploadedOn, reviewed: null, by: uploadedBy }),
  }),
);

/** Ids of seed files: when their bytes are not in the blob store, they are regenerated. */
export const SEED_ATTACHMENT_COUNT = attachments.length;
