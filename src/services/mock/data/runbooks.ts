import type {
  Runbook,
  RunbookContact,
  RunbookLink,
  RunbookScenario,
  RunbookStep,
} from '@/domains/runbooks/types';
import { auditOf } from './audit';
import { APP, PERSON, TEAM } from './ids';
import { seedId } from './sequence';

const steps = (...texts: string[]): RunbookStep[] =>
  texts.map((text) => ({ id: seedId('runbookSteps'), text }));

const link = (type: string, label: string, url: string, note = ''): RunbookLink => ({
  id: seedId('runbookLinks'),
  type,
  label,
  url,
  note,
});

const contact = (
  label: string,
  who: { personId?: number; teamId?: number },
  channel: string,
  when: string,
): RunbookContact => ({
  id: seedId('runbookContacts'),
  label,
  personId: who.personId ?? null,
  teamId: who.teamId ?? null,
  channel,
  when,
});

const scenario = (title: string, symptoms: string, ...texts: string[]): RunbookScenario => ({
  id: seedId('runbookScenarios'),
  title,
  symptoms,
  steps: steps(...texts),
});

/**
 * Incident playbooks for the most critical systems. Addresses use the `corp.example` domain;
 * channels are on-call lines and chat rooms — never credentials.
 */
export const runbooks: Runbook[] = [
  {
    id: 1,
    applicationId: APP.paymentGateway,
    summary:
      'Ödeme alınamıyor, ödeme süreleri uzadı veya banka/kart sağlayıcısı hata dönüyorsa bu rehberi kullanın. Sağlıklı durumda başarılı ödeme oranı %97 üzeri, p95 yanıt süresi 800 ms altıdır.',
    firstResponse: steps(
      'Durum sayfasında ve #payments-incident kanalında devam eden bir olay olup olmadığına bakın; varsa o olaya katılın.',
      'Ödeme Geçidi panosunda başarılı ödeme oranı, p95 yanıt süresi ve 5xx oranını kontrol edin. Sorun tek bir sağlayıcıda mı, tüm ödemelerde mi?',
      'Son 2 saatteki dağıtımları kontrol edin. Sorun dağıtımla başladıysa geri alma (rollback) kararı için teknik sahibe haber verin.',
      'Sağlayıcı durum sayfalarına bakın (kart işlemcisi, 3D Secure). Sağlayıcı kaynaklıysa yedek sağlayıcıya geçiş senaryosunu uygulayın.',
      '15 dakika içinde kök neden bulunamadıysa 2. seviye eskalasyonu başlatın ve olay kaydı açın.',
    ),
    links: [
      link(
        'dashboard',
        'Ödeme Geçidi panosu',
        'https://grafana.corp.example/d/payments-gateway',
        'Başarılı ödeme oranı < %97 veya p95 > 800 ms ise sorun var.',
      ),
      link(
        'logs',
        'Uygulama logları (canlı)',
        'https://logs.corp.example/app/payments-gateway?env=production',
        '"PROVIDER_TIMEOUT" ve "3DS_FAILED" hatalarına filtreleyin.',
      ),
      link(
        'health-check',
        'Sağlık kontrolü',
        'https://payments.corp.example/health',
        '"status": "UP" ve tüm sağlayıcılar "available" olmalı.',
      ),
      link(
        'alerting',
        'Alarm kuralları',
        'https://alerts.corp.example/rules?service=payments-gateway',
      ),
      link(
        'status-page',
        'Kart işlemcisi durum sayfası',
        'https://status.cardprocessor.example',
        'Sağlayıcı kaynaklı kesintileri buradan doğrulayın.',
      ),
      link(
        'console',
        'Sağlayıcı yönlendirme ayarları',
        'https://payments-admin.corp.example/routing',
        'Yedek sağlayıcıya geçiş buradan yapılır (yetki gerekir).',
      ),
    ],
    contacts: [
      contact(
        '1. seviye — uygulama destek nöbetçisi',
        { teamId: TEAM.appSupport },
        'Nöbet hattı: dahili 4410 · #app-support',
        'Hemen',
      ),
      contact(
        '2. seviye — ödeme mühendisliği nöbetçisi',
        { teamId: TEAM.payments },
        '#payments-eng · nöbet çağrısı: payments-oncall',
        '15 dakikada çözülmezse',
      ),
      contact(
        'Teknik sahip',
        { personId: PERSON.keremYildiz },
        'Telefon: dahili 4421',
        'Geri alma veya sağlayıcı değişikliği kararı için',
      ),
      contact(
        'İş sahibi',
        { personId: PERSON.hannahSchulz },
        'E-posta ve telefon',
        'Kesinti 30 dakikayı geçerse bilgilendirin',
      ),
    ],
    scenarios: [
      scenario(
        'Kart sağlayıcısı zaman aşımı veriyor',
        'Panoda "PROVIDER_TIMEOUT" hatası artıyor, belirli bir sağlayıcıda başarı oranı düşüyor.',
        'Sağlayıcının durum sayfasından kesinti olup olmadığını doğrulayın.',
        'Sağlayıcı yönlendirme ayarlarından trafiği yedek sağlayıcıya %100 yönlendirin.',
        'Başarı oranının 5 dakika içinde toparlandığını panodan doğrulayın.',
        'Sağlayıcı düzelince trafiği kademeli olarak (%25 → %50 → %100) geri alın.',
      ),
      scenario(
        '3D Secure doğrulamaları başarısız',
        'Kullanıcılar doğrulama ekranında takılıyor, loglarda "3DS_FAILED" artışı var.',
        'Sorunun tek bir banka mı tüm bankalar mı olduğunu loglardan ayırın.',
        'Tek bankaysa bankanın durum sayfasını kontrol edip müşteri hizmetlerine bilgi notu geçin.',
        'Tüm bankalardaysa son dağıtımı ve 3DS sertifika geçerlilik tarihini kontrol edin; teknik sahibi arayın.',
      ),
      scenario(
        'Dağıtım sonrası 5xx artışı',
        'Dağıtımdan hemen sonra 5xx oranı %1 üzerine çıkıyor.',
        'Dağıtım hattından son sürümü geri alın (rollback).',
        '#payments-eng kanalına sürüm numarası ve hata örnekleriyle bilgi verin.',
        'Geri alma sonrası hata oranının normale döndüğünü doğrulayın ve olay kaydını güncelleyin.',
      ),
    ],
    lastVerifiedOn: '2026-08-14',
    audit: auditOf({
      created: '2026-03-02',
      updated: '2026-08-14',
      reviewed: '2026-08-14',
      by: PERSON.keremYildiz,
    }),
  },
  {
    id: 2,
    applicationId: APP.apiGateway,
    summary:
      'Dış veya iç API çağrıları hata veriyor, gecikiyor ya da yetkilendirme reddediliyorsa bu rehberi kullanın. API Geçidi tüm dijital kanalların ortak giriş noktasıdır; kesinti geniş etki yaratır.',
    firstResponse: steps(
      'Hangi rotaların etkilendiğini API Geçidi panosundan belirleyin: tüm trafik mi, tek bir arka uç mu?',
      'Tek bir arka uçsa o uygulamanın müdahale rehberine geçin ve sahibine haber verin.',
      'Tüm trafikse geçit pod sayısını, CPU/bellek kullanımını ve hız sınırı (rate limit) red oranını kontrol edin.',
      'Son yapılandırma değişikliklerini (rota, sertifika, rate limit) kontrol edin; şüpheli değişikliği geri alın.',
    ),
    links: [
      link(
        'dashboard',
        'API Geçidi trafik panosu',
        'https://grafana.corp.example/d/api-gateway',
        'Rota bazında 4xx/5xx ve gecikme.',
      ),
      link('logs', 'Erişim logları', 'https://logs.corp.example/app/api-gateway?env=production'),
      link('health-check', 'Geçit sağlık kontrolü', 'https://api.corp.example/_health'),
      link(
        'monitoring',
        'Kubernetes iş yükü',
        'https://k8s.corp.example/ns/api-gateway/workloads',
        'Pod yeniden başlatma sayısına bakın.',
      ),
    ],
    contacts: [
      contact(
        '1. seviye — uygulama destek nöbetçisi',
        { teamId: TEAM.appSupport },
        'Nöbet hattı: dahili 4410 · #app-support',
        'Hemen',
      ),
      contact(
        '2. seviye — entegrasyon servisleri',
        { teamId: TEAM.integration },
        '#integration · nöbet çağrısı: integration-oncall',
        '15 dakikada çözülmezse',
      ),
      contact(
        'Teknik sahip',
        { personId: PERSON.selinAydin },
        'Telefon: dahili 4433',
        'Yapılandırma geri alma kararı için',
      ),
    ],
    scenarios: [
      scenario(
        'Hız sınırı (429) artışı',
        'İstemciler 429 Too Many Requests alıyor; tek bir istemcide yoğunlaşıyor olabilir.',
        'Panoda 429 dönen istemci anahtarını (client id) bulun.',
        'Trafik beklenen bir kampanyadan geliyorsa geçici kota artışını teknik sahiple onaylayın.',
        'Beklenmeyen trafikse istemci sahibine haber verin; gerekirse istemciyi geçici olarak engelleyin.',
      ),
      scenario(
        'Sertifika süresi doldu',
        'Tüm istemcilerde TLS el sıkışma hataları.',
        'Sertifika bitiş tarihini sağlık kontrolü çıktısından doğrulayın.',
        'Platform ekibinden yenilenmiş sertifikanın dağıtımını isteyin (#platform-engineering).',
      ),
    ],
    lastVerifiedOn: '2026-01-20',
    audit: auditOf({
      created: '2025-11-10',
      updated: '2026-01-20',
      reviewed: '2026-01-20',
      by: PERSON.selinAydin,
    }),
  },
];
