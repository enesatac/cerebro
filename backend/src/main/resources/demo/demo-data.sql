-- Demo data for local development and demos: the same fictional organisation the frontend
-- mock uses (cerebro: src/services/mock/data). Generated — do not edit by hand. Loaded by
-- DemoDataLoader into an empty database when cerebro.demo-data is enabled (local profile).

INSERT INTO business_units (id, code, name, description, head_person_id) VALUES
  (1, 'DCH', 'Dijital Kanallar', 'Müşteriye yönelik web ve mobil kanallar, e-ticaret ve sadakat.', NULL),
  (2, 'FIN', 'Finans ve Hazine', 'Ödemeler, muhasebe, mutabakat ve finansal raporlama.', NULL),
  (3, 'OPS', 'Operasyon', 'Uçuş, ekip ve yer operasyonlarının planlanması ve kontrolü.', NULL),
  (4, 'PWP', 'İnsan ve Çalışma Ortamı', 'İK, çalışan hizmetleri ve kurum içi iş birliği.', NULL),
  (5, 'TEC', 'Teknoloji Platformları', 'Ortak platformlar: kimlik, entegrasyon, veri ve mesajlaşma.', NULL);

INSERT INTO people (id, full_name, job_title, email, business_unit_id, location) VALUES
  (1, 'Can Öztürk', 'Teknoloji Direktörü (CTO)', 'can.ozturk@corp.example', 5, 'İstanbul'),
  (2, 'Elif Kaya', 'Dijital Kanallar Direktörü', 'elif.kaya@corp.example', 1, 'İstanbul'),
  (3, 'Hannah Schulz', 'Finans Operasyonları Direktörü', 'hannah.schulz@corp.example', 2, 'Frankfurt'),
  (4, 'Omar Haddad', 'Operasyon Kontrol Direktörü', 'omar.haddad@corp.example', 3, 'İstanbul'),
  (5, 'Claire Dubois', 'İnsan Operasyonları Direktörü', 'claire.dubois@corp.example', 4, 'Paris'),
  (6, 'Marcus Webb', 'Baş Mimar', 'marcus.webb@corp.example', 5, 'Londra'),
  (7, 'Grace Mensah', 'Güvenlik Mimarı', 'grace.mensah@corp.example', 5, 'Londra'),
  (8, 'Selin Aydın', 'Entegrasyon Mimarı', 'selin.aydin@corp.example', 5, 'İstanbul'),
  (9, 'Aylin Demir', 'Mühendislik Yöneticisi, Platform', 'aylin.demir@corp.example', 5, 'İstanbul'),
  (10, 'Jonas Berg', 'Kıdemli Yazılım Mühendisi', 'jonas.berg@corp.example', 5, 'Stockholm'),
  (11, 'Priya Raman', 'Ürün Sahibi, Kimlik', 'priya.raman@corp.example', 5, 'Londra'),
  (12, 'Daniel Okafor', 'Mühendislik Yöneticisi, Ödemeler', 'daniel.okafor@corp.example', 2, 'Londra'),
  (13, 'Kerem Yıldız', 'Teknik Lider, Ödemeler', 'kerem.yildiz@corp.example', 2, 'İstanbul'),
  (14, 'Sofia Marín', 'Ürün Yöneticisi, Ödemeler', 'sofia.marin@corp.example', 2, 'Madrid'),
  (15, 'Ole Hansen', 'Finans Sistemleri Lideri', 'ole.hansen@corp.example', 2, 'Frankfurt'),
  (16, 'Mehmet Arslan', 'Operasyon Sistemleri Direktörü', 'mehmet.arslan@corp.example', 3, 'İstanbul'),
  (17, 'Laura Costa', 'Teknik Lider, Operasyon Sistemleri', 'laura.costa@corp.example', 3, 'Lizbon'),
  (18, 'Yuki Tanaka', 'Veri Platformu Lideri', 'yuki.tanaka@corp.example', 5, 'Amsterdam'),
  (19, 'Inês Ferreira', 'Mühendislik Yöneticisi, Dijital Deneyim', 'ines.ferreira@corp.example', 1, 'Lizbon'),
  (20, 'Burak Şahin', 'Frontend Teknik Lideri', 'burak.sahin@corp.example', 1, 'İstanbul'),
  (21, 'Rafael Gómez', 'Mühendislik Yöneticisi, E-Ticaret', 'rafael.gomez@corp.example', 1, 'Madrid'),
  (22, 'Emma Lindqvist', 'Sadakat Direktörü', 'emma.lindqvist@corp.example', 1, 'Stockholm'),
  (23, 'Ahmed Nasser', 'Çalışma Ortamı Sistemleri Yöneticisi', 'ahmed.nasser@corp.example', 4, 'Dubai'),
  (24, 'Zeynep Çelik', 'Program Yöneticisi', 'zeynep.celik@corp.example', 5, 'İstanbul'),
  (25, 'Lucas Moreau', 'Proje Yöneticisi', 'lucas.moreau@corp.example', 5, 'Paris'),
  (26, 'Nadia Petrova', 'Kıdemli İş Analisti', 'nadia.petrova@corp.example', 1, 'İstanbul'),
  (27, 'Tom Brennan', 'Uygulama Destek Yöneticisi', 'tom.brennan@corp.example', 5, 'Dublin');

UPDATE business_units SET head_person_id = 2 WHERE id = 1;
UPDATE business_units SET head_person_id = 3 WHERE id = 2;
UPDATE business_units SET head_person_id = 4 WHERE id = 3;
UPDATE business_units SET head_person_id = 5 WHERE id = 4;
UPDATE business_units SET head_person_id = 1 WHERE id = 5;

UPDATE roles SET name = 'Sistem yöneticisi', description = 'Her ekranda tam yetki; kullanıcıları, rolleri ve ana verileri yönetir. Değiştirilemez.', created_at = '2025-06-01T09:00:00Z', created_by_person_id = 1, updated_at = '2026-09-01T14:30:00Z', updated_by_person_id = 1, last_reviewed_at = NULL, last_reviewed_by_person_id = NULL WHERE system;

INSERT INTO roles (id, name, description, system, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (2, 'Portföy ofisi', 'Portföyü yönetir: projeler, uygulamalar, riskler; talepleri değerlendirir ve takvime alır.', false, '2025-06-01T09:00:00Z', 1, '2026-09-01T14:30:00Z', 1, NULL, NULL),
  (3, 'Birim / ekip yöneticisi', 'Portföyü görür; ekibini, kaynak planını ve izinleri yönetir, talep açar ve risk kaydeder.', false, '2025-06-01T09:00:00Z', 1, '2026-09-01T14:30:00Z', 1, NULL, NULL),
  (4, 'İş birimi kullanıcısı', 'İş birimi adına talep açar ve izler; projeleri, uygulamaları ve raporları görür.', false, '2025-06-01T09:00:00Z', 1, '2026-09-01T14:30:00Z', 1, NULL, NULL),
  (5, 'Çalışan', 'Portföyü, ekipleri ve izin takvimini görür; talep açabilir. Kayıtları değiştiremez.', false, '2025-06-01T09:00:00Z', 1, '2026-09-01T14:30:00Z', 1, NULL, NULL),
  (6, 'Denetçi (salt okunur)', 'Yönetim ekranları dahil her şeyi görür, hiçbir şeyi değiştiremez.', false, '2025-06-01T09:00:00Z', 1, '2026-09-01T14:30:00Z', 1, NULL, NULL);

INSERT INTO role_privileges (role_id, privilege_code) VALUES
  (2, 'dashboard:view'),
  (2, 'projects:view'),
  (2, 'projects:edit'),
  (2, 'projects:delete'),
  (2, 'applications:view'),
  (2, 'applications:edit'),
  (2, 'applications:delete'),
  (2, 'connections:view'),
  (2, 'connections:edit'),
  (2, 'connections:delete'),
  (2, 'risks:view'),
  (2, 'risks:edit'),
  (2, 'risks:delete'),
  (2, 'contracts:view'),
  (2, 'contracts:edit'),
  (2, 'contracts:delete'),
  (2, 'reports:view'),
  (2, 'teams:view'),
  (2, 'teams:edit'),
  (2, 'teams:delete'),
  (2, 'people:view'),
  (2, 'people:edit'),
  (2, 'technologies:view'),
  (2, 'technologies:edit'),
  (2, 'technologies:delete'),
  (2, 'resources:view'),
  (2, 'resources:edit'),
  (2, 'leaves:view'),
  (2, 'demands:view'),
  (2, 'demands:edit'),
  (2, 'demandManagement:view'),
  (2, 'demandManagement:edit'),
  (2, 'demandManagement:delete'),
  (2, 'masterData:view'),
  (2, 'masterData:edit'),
  (3, 'dashboard:view'),
  (3, 'projects:view'),
  (3, 'applications:view'),
  (3, 'connections:view'),
  (3, 'risks:view'),
  (3, 'risks:edit'),
  (3, 'contracts:view'),
  (3, 'reports:view'),
  (3, 'teams:view'),
  (3, 'teams:edit'),
  (3, 'people:view'),
  (3, 'technologies:view'),
  (3, 'resources:view'),
  (3, 'resources:edit'),
  (3, 'leaves:view'),
  (3, 'leaves:edit'),
  (3, 'demands:view'),
  (3, 'demands:edit'),
  (3, 'demandManagement:view'),
  (4, 'dashboard:view'),
  (4, 'projects:view'),
  (4, 'applications:view'),
  (4, 'reports:view'),
  (4, 'demands:view'),
  (4, 'demands:edit'),
  (5, 'dashboard:view'),
  (5, 'projects:view'),
  (5, 'applications:view'),
  (5, 'connections:view'),
  (5, 'risks:view'),
  (5, 'teams:view'),
  (5, 'people:view'),
  (5, 'technologies:view'),
  (5, 'resources:view'),
  (5, 'leaves:view'),
  (5, 'demands:view'),
  (5, 'demands:edit'),
  (6, 'dashboard:view'),
  (6, 'projects:view'),
  (6, 'applications:view'),
  (6, 'connections:view'),
  (6, 'risks:view'),
  (6, 'contracts:view'),
  (6, 'reports:view'),
  (6, 'teams:view'),
  (6, 'people:view'),
  (6, 'technologies:view'),
  (6, 'resources:view'),
  (6, 'leaves:view'),
  (6, 'demands:view'),
  (6, 'demandManagement:view'),
  (6, 'masterData:view'),
  (6, 'users:view'),
  (6, 'roles:view');

INSERT INTO user_accounts (id, display_name, email, person_id, active, last_sign_in_at, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'Can Öztürk', 'can.ozturk@corp.example', 1, true, '2026-09-25T08:10:00Z', '2025-06-01T09:00:00Z', 1, '2026-06-01T14:30:00Z', 1, NULL, NULL),
  (2, 'Selin Aydın', 'selin.aydin@corp.example', 8, true, '2026-09-25T08:10:00Z', '2025-06-01T09:00:00Z', 1, '2026-06-01T14:30:00Z', 1, NULL, NULL),
  (3, 'Elif Kaya', 'elif.kaya@corp.example', 2, true, '2026-09-25T08:10:00Z', '2025-06-01T09:00:00Z', 1, '2026-06-01T14:30:00Z', 1, NULL, NULL),
  (4, 'Tom Brennan', 'tom.brennan@corp.example', 27, true, '2026-09-25T08:10:00Z', '2025-06-01T09:00:00Z', 1, '2026-06-01T14:30:00Z', 1, NULL, NULL),
  (5, 'Nadia Petrova', 'nadia.petrova@corp.example', 26, false, '2026-03-02T09:00:00Z', '2025-06-01T09:00:00Z', 1, '2026-06-01T14:30:00Z', 1, NULL, NULL),
  (6, 'Zeynep Çelik', 'zeynep.celik@corp.example', 24, true, '2026-09-25T08:10:00Z', '2025-06-01T09:00:00Z', 1, '2026-06-01T14:30:00Z', 1, NULL, NULL);

INSERT INTO user_roles (user_account_id, role_id, position) VALUES
  (1, 1, 0),
  (2, 1, 0),
  (3, 4, 0),
  (3, 5, 1),
  (4, 3, 0),
  (5, 5, 0),
  (6, 2, 0);

INSERT INTO teams (id, name, description, manager_person_id, contact_email, chat_channel, responsibilities, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'Platform Mühendisliği', 'Ortak çalışma platformlarını geliştirir ve işletir: kimlik, bildirimler ve geliştirici araçları.', 9, 'platform-engineering@corp.example', '#platform-engineering', ARRAY['Kimlik ve erişim platformu', 'Bildirim platformu', 'Kubernetes platform kuralları']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24),
  (2, 'Ödeme Mühendisliği', 'Ödeme işleme, üye işyeri bankası bağlantısı ve mutabakat akışlarından sorumludur.', 12, 'payments-engineering@corp.example', '#payments-eng', ARRAY['Ödeme provizyonu ve tahsilatı', 'PCI DSS kapsam yönetimi', 'Mutabakat dosyası üretimi']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24),
  (3, 'Dijital Deneyim', 'Müşteriye yönelik web deneyimleri ve bunların backend-for-frontend servisleri.', 19, 'digital-experience@corp.example', '#digital-experience', ARRAY['Müşteri portalı', 'Tasarım sistemi kullanımı', 'Web performansı']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24),
  (4, 'E-Ticaret Mühendisliği', 'Sipariş yaşam döngüsü, ek hizmetler ve sadakat yetenekleri.', 21, 'commerce-engineering@corp.example', '#commerce-eng', ARRAY['Sipariş yönetimi', 'Sadakat motoru']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24),
  (5, 'Operasyon Sistemleri', 'Uçuş operasyon kontrolünü ve ekip planlamasını destekleyen sistemler.', 16, 'ops-systems@corp.example', '#ops-systems', ARRAY['Uçuş operasyon araçları', 'Ekip planlama', 'Operasyonel dayanıklılık']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24),
  (6, 'Veri ve Analitik', 'Kurumsal veri platformu, veri hatları ve raporlama altyapısı.', 18, 'data-analytics@corp.example', '#data-platform', ARRAY['Veri alımı', 'Analitik veri modelleri', 'Raporlama desteği']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24),
  (7, 'Finans Sistemleri', 'Finans ve Hazine için muhasebe, mutabakat ve masraf araçları.', 15, 'finance-systems@corp.example', '#finance-systems', ARRAY['Genel muhasebe arayüzleri', 'Mutabakat', 'Masraf araçları']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24),
  (8, 'Çalışma Ortamı Sistemleri', 'Çalışanlara yönelik hizmetler: self servis, İK çekirdek sistemi ve dokümanlar.', 23, 'workplace-systems@corp.example', '#workplace-systems', ARRAY['Çalışan self servis', 'Doküman yönetimi', 'İK sistem entegrasyonları']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24),
  (9, 'Entegrasyon Servisleri', 'API geçidi, olay akışı standartları ve entegrasyon kalıpları.', 8, 'integration-services@corp.example', '#integration', ARRAY['API geçidi', 'Kafka platform standartları', 'Entegrasyon incelemeleri']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24),
  (10, 'Uygulama Destek', 'İş uygulamaları için birinci ve ikinci seviye destek; kritik sistemler için 7/24.', 27, 'app-support@corp.example', '#app-support', ARRAY['Olay önceliklendirme', 'Büyük olay koordinasyonu', 'Runbook bakımı']::text[], '2024-02-01T09:00:00Z', 24, '2026-06-10T14:30:00Z', 24, '2026-06-10T10:00:00Z', 24);

INSERT INTO team_members (team_id, person_id) VALUES
  (1, 9),
  (1, 10),
  (1, 11),
  (1, 7),
  (2, 12),
  (2, 13),
  (2, 14),
  (3, 19),
  (3, 20),
  (3, 26),
  (4, 21),
  (5, 16),
  (5, 17),
  (6, 18),
  (7, 15),
  (8, 23),
  (9, 8),
  (10, 27);

INSERT INTO technologies (id, name, description, category, status) VALUES
  (1, 'React', 'Web uygulamaları için bileşen tabanlı arayüz kütüphanesi.', 'frontend', 'preferred'),
  (2, 'Angular', 'Tam özellikli web uygulama çatısı.', 'frontend', 'supported'),
  (3, 'AngularJS', 'Angular''ın eski öncülü; desteği sona erdi.', 'frontend', 'retired'),
  (4, 'TypeScript', 'JavaScript''in tipli üst kümesi.', 'frontend', 'preferred'),
  (5, 'Java', 'Backend servisleri için JVM dili.', 'backend', 'preferred'),
  (6, 'Spring Boot', 'Kuralları belirlenmiş Java servis çatısı.', 'backend', 'preferred'),
  (7, 'Kotlin', 'Modern JVM dili.', 'backend', 'preferred'),
  (8, 'Node.js', 'Servisler ve BFF''ler için JavaScript çalışma ortamı.', 'backend', 'supported'),
  (9, '.NET', 'Microsoft uygulama platformu.', 'backend', 'supported'),
  (10, 'Python', 'Veri hatları ve otomasyon için dil.', 'backend', 'supported'),
  (11, 'Apache Struts 1', 'Eski Java web çatısı; desteklenmiyor.', 'backend', 'retired'),
  (12, 'PostgreSQL', 'İlişkisel veritabanı.', 'database', 'preferred'),
  (13, 'Oracle Database', 'Ticari ilişkisel veritabanı.', 'database', 'supported'),
  (14, 'MongoDB', 'Doküman veritabanı.', 'database', 'supported'),
  (15, 'Redis', 'Bellek içi veri deposu ve önbellek.', 'database', 'preferred'),
  (16, 'Elasticsearch', 'Arama ve analitik motoru.', 'database', 'supported'),
  (17, 'Apache Kafka', 'Dağıtık olay akışı platformu.', 'messaging', 'preferred'),
  (18, 'RabbitMQ', 'İş kuyrukları için mesaj aracısı.', 'messaging', 'supported'),
  (19, 'IBM MQ', 'Eski mesaj kuyruğu; Kafka''ya taşınmalı.', 'messaging', 'deprecated'),
  (20, 'Kubernetes', 'Konteyner orkestrasyon platformu.', 'infrastructure', 'preferred'),
  (21, 'Docker', 'Konteyner imaj araçları.', 'infrastructure', 'preferred'),
  (22, 'Terraform', 'Kod olarak altyapı.', 'devops', 'preferred'),
  (23, 'Amazon Web Services', 'Genel bulut sağlayıcı.', 'infrastructure', 'preferred'),
  (24, 'VMware vSphere', 'Şirket içi sanallaştırma.', 'infrastructure', 'supported'),
  (25, 'Envoy Proxy', 'Uç ve servis proxy''si.', 'infrastructure', 'preferred'),
  (26, 'GitLab CI', 'CI/CD hatları.', 'devops', 'preferred'),
  (27, 'Jenkins', 'Eski CI sunucusu; GitLab CI''a taşınmalı.', 'devops', 'deprecated'),
  (28, 'Prometheus', 'Metrik toplama ve alarm.', 'monitoring', 'preferred'),
  (29, 'Grafana', 'Gösterge panelleri ve gözlemlenebilirlik.', 'monitoring', 'preferred'),
  (30, 'Playwright', 'Uçtan uca tarayıcı testi.', 'testing', 'preferred');

INSERT INTO applications (id, code, name, short_description, detailed_description, business_purpose, type, lifecycle, criticality, operational_status, tags, business_unit_id, business_processes, user_groups, estimated_user_count, hosting_model, cloud_provider, hosting_notes, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'CIP', 'Müşteri Kimlik Platformu', 'Müşteri ve çalışan kanalları için merkezi giriş, hesap ve açık rıza yönetimi.', 'OpenID Connect ile giriş, çok faktörlü kimlik doğrulama, profil yönetimi ve açık rıza kayıtları sağlar. Müşteriye yönelik tüm kanallar ve birçok iç portal kimlik doğrulamayı CIP''e devreder.', 'Müşterilere her kanalda tek ve güvenli bir hesap sunmak ve açık rıza kayıtlarını KVKK/GDPR denetimine hazır tutmak.', 'api-service', 'active', 'critical', 'operational', ARRAY['identity', 'security', 'gdpr', 'shared-platform']::text[], 5, ARRAY['Müşteri kaydı', 'Giriş', 'Açık rıza yönetimi', 'Hesap kurtarma']::text[], ARRAY['Müşteriler', 'Çalışanlar', 'Müşteri hizmetleri temsilcileri']::text[], 4800000, 'public-cloud', 'Amazon Web Services', 'Tek bölgede aktif; felaket kurtarma bölgesi sıcak yedekte.', '2023-04-12T09:00:00Z', 10, '2026-09-18T14:30:00Z', 10, '2026-08-02T10:00:00Z', 10),
  (2, 'PAYGW', 'Ödeme Geçidi', 'Tüm satış kanalları için kartlı ve alternatif ödemelerin provizyonunu, tahsilatını ve iadesini yapar.', 'Üye işyeri bankalarını ve alternatif ödeme sağlayıcılarını tek bir API arkasında soyutlar; 3-D Secure, tokenizasyon ve Finans için günlük mutabakat dosyası üretimini yönetir.', 'PCI DSS kapsamını tek bir sistemde tutarak tüm kanallarda geliri güvenilir şekilde tahsil etmek.', 'api-service', 'active', 'critical', 'operational', ARRAY['payments', 'pci-dss', 'revenue']::text[], 2, ARRAY['Ödeme provizyonu', 'İadeler', 'Mutabakat']::text[], ARRAY['Müşteriler', 'Finans operasyonları']::text[], 2100000, 'private-cloud', NULL, 'PCI için ayrılmış özel bulut bölgesinde çalışır.', '2022-09-01T09:00:00Z', 13, '2026-09-10T14:30:00Z', 13, '2026-07-21T10:00:00Z', 13),
  (3, 'NOTIF', 'Bildirim Servisi', 'Diğer uygulamalar adına e-posta, SMS ve anlık bildirim gönderir.', 'Müşteri bazında kanal tercihleri, hız sınırlama ve teslimat takibi ile şablon tabanlı çok kanallı gönderim. Kuyruklar ve olaylar üzerinden asenkron olarak kullanılır.', 'Tek ve yeniden kullanılabilir bir servisle müşterileri ve çalışanları tercih ettikleri kanaldan bilgilendirmek.', 'api-service', 'active', 'high', 'degraded', ARRAY['messaging', 'shared-platform', 'customer-communication']::text[], 5, ARRAY['İşlemsel bildirimler', 'Operasyonel uyarılar']::text[], ARRAY['Müşteriler', 'Çalışanlar']::text[], 5000000, 'public-cloud', 'Amazon Web Services', NULL, '2023-01-20T09:00:00Z', 9, '2026-09-23T14:30:00Z', 9, '2026-05-14T10:00:00Z', 9),
  (4, 'CPORT', 'Müşteri Portalı', 'Rezervasyon yönetimi, siparişler ve hesap self servisi için ana müşteri web sitesi.', 'Sipariş, kimlik ve sadakat API''lerini birleştiren Node.js backend-for-frontend''e sahip React tek sayfa uygulaması.', 'Müşterilerin çağrı merkezine ulaşmadan rezervasyon ve satın alımlarını yönetmesini sağlamak.', 'web-application', 'active', 'critical', 'operational', ARRAY['customer-facing', 'web', 'self-service']::text[], 1, ARRAY['Rezervasyon yönetimi', 'Çevrim içi satış', 'Müşteri self servisi']::text[], ARRAY['Müşteriler']::text[], 3500000, 'public-cloud', 'Amazon Web Services', NULL, '2023-06-05T09:00:00Z', 20, '2026-09-21T14:30:00Z', 20, '2026-09-01T10:00:00Z', 20),
  (5, 'ESS', 'Çalışan Self Servis', 'Çalışanların izin, kişisel bilgi, bordro ve taleplerini yönettiği portal.', 'İK çekirdek sistemi, doküman yönetimi ve masraf araçlarının önünde duran .NET servisleriyle desteklenen Angular portal.', 'Çalışanların rutin taleplerini kendilerinin tamamlamasını sağlayarak İK hizmet masasının yükünü azaltmak.', 'web-application', 'active', 'medium', 'operational', ARRAY['employee-facing', 'hr']::text[], 4, ARRAY['İzin yönetimi', 'Kişisel bilgi güncellemeleri', 'Bordro erişimi']::text[], ARRAY['Çalışanlar', 'Birim yöneticileri', 'İK iş ortakları']::text[], 28000, 'on-premises', NULL, NULL, '2021-11-10T09:00:00Z', 23, '2026-08-12T14:30:00Z', 23, '2026-04-30T10:00:00Z', 23),
  (6, 'OMS', 'Sipariş Yönetim Sistemi', 'Bilet ve ek ürünler için müşteri siparişlerini oluşturur, fiyatlandırır ve takip eder.', 'Sepetten teslimata kadar sipariş yaşam döngüsünü yönetir; ödeme, sadakat puanı kazanımı ve bildirimleri koordine eder.', 'Tüm satış kanallarında tek ve tutarlı bir sipariş kaydı sağlamak.', 'api-service', 'active', 'high', 'operational', ARRAY['commerce', 'orders', 'revenue']::text[], 1, ARRAY['Sipariş alma', 'Ek hizmet satışı', 'Sipariş karşılama']::text[], ARRAY['Müşteriler', 'Çağrı merkezi temsilcileri']::text[], 2600000, 'public-cloud', 'Amazon Web Services', NULL, '2022-03-15T09:00:00Z', 21, '2026-09-05T14:30:00Z', 21, '2026-06-18T10:00:00Z', 21),
  (7, 'FINP', 'Finans Platformu', 'Gelir muhasebesi, mutabakat ve genel muhasebe arayüzleri.', 'Mutabakat dosyalarını ve satış verilerini birleştirir, mutabakat yapar ve yevmiye kayıtlarını deftere işler.', 'Otomatik mutabakatla defterleri doğru ve zamanında kapatmak.', 'batch-processing', 'maintenance', 'high', 'operational', ARRAY['finance', 'accounting', 'sox']::text[], 2, ARRAY['Gelir muhasebesi', 'Mutabakat', 'Ay sonu kapanış']::text[], ARRAY['Finans operasyonları', 'Muhasebeciler']::text[], 340, 'on-premises', NULL, NULL, '2019-05-02T09:00:00Z', 15, '2026-02-11T14:30:00Z', 15, '2026-01-15T10:00:00Z', 15),
  (8, 'FOPS', 'Uçuş Operasyon Portalı', 'Operasyon gününün kontrol görünümü: uçuşlar, aksaklıklar ve ekip durumu.', 'Operasyon kontrol merkezi tarafından uçuş programını izlemek, aksaklıkları yönetmek ve ekip ile yer hizmetlerini koordine etmek için kullanılır.', 'Operasyonu zamanında yürütmek ve aksaklıklardan hızla toparlanmak.', 'web-application', 'active', 'critical', 'operational', ARRAY['operations', '24x7', 'disruption-management']::text[], 3, ARRAY['Operasyon kontrol', 'Aksaklık yönetimi']::text[], ARRAY['Operasyon kontrolörleri', 'Nöbetçi yöneticiler']::text[], 650, 'hybrid', 'Amazon Web Services', 'Arayüz bulutta; çekirdek servisler veri kaynaklarına yakın, şirket içinde.', '2021-08-30T09:00:00Z', 17, '2026-09-24T14:30:00Z', 17, '2026-08-28T10:00:00Z', 17),
  (9, 'CREW', 'Ekip Planlama Motoru', 'Ekip çizelgelerini oluşturur ve görev süresi sınırlamalarını doğrular.', 'Uçuş süresi sınırlamalarına göre doğrulanmış aylık çizelgeler ve gerçek zamanlı yeniden atama önerileri üreten optimizasyon motoru.', 'Her uçuşa yasal ve verimli şekilde ekip atamak.', 'batch-processing', 'maintenance', 'critical', 'operational', ARRAY['operations', 'crew', 'optimisation']::text[], 3, ARRAY['Ekip çizelgeleme', 'Ekip takibi']::text[], ARRAY['Ekip planlamacıları', 'Ekip kontrol']::text[], 180, 'on-premises', NULL, NULL, '2018-02-14T09:00:00Z', 16, '2026-07-02T14:30:00Z', 16, '2026-03-20T10:00:00Z', 16),
  (10, 'DMS', 'Doküman Yönetim Platformu', 'İş dokümanlarını tam metin aramayla saklar, sürümler ve arşivler.', 'Saklama politikaları, yasal saklama ve tam metin arama içeren merkezi doküman deposu.', 'İş kayıtlarını bulunabilir ve saklama kurallarına uygun tutmak.', 'web-application', 'active', 'medium', 'operational', ARRAY['documents', 'records-management']::text[], 4, ARRAY['Kayıt yönetimi', 'Sözleşme arşivleme']::text[], ARRAY['Çalışanlar', 'Hukuk']::text[], 12000, 'on-premises', NULL, NULL, '2020-10-01T09:00:00Z', 23, '2026-05-06T14:30:00Z', 23, '2026-05-06T10:00:00Z', 23),
  (11, 'EDP', 'Kurumsal Veri Platformu', 'Operasyonel olayları ve verileri yönetişimli analitik veri setlerine aktarır.', 'Düzenlenmiş, erişim kontrollü veri ürünleriyle lakehouse''a akış ve toplu veri alımı.', 'Analitik, raporlama ve veri bilimi için güvenilir veri sağlamak.', 'data-platform', 'active', 'high', 'operational', ARRAY['data', 'analytics', 'shared-platform']::text[], 5, ARRAY['Veri alımı', 'Analitik']::text[], ARRAY['Analistler', 'Veri bilimciler']::text[], 900, 'public-cloud', 'Amazon Web Services', NULL, '2023-09-11T09:00:00Z', 18, '2026-09-02T14:30:00Z', 18, '2026-07-10T10:00:00Z', 18),
  (12, 'APIGW', 'API Geçidi', 'Harici ve iş ortaklarına açık API''ler için uç geçit.', 'Web, mobil ve iş ortağı istemcilerinden gelen API trafiğini yönlendirir, kimlik doğrular ve hız sınırlar.', 'API''leri kanallara ve iş ortaklarına güvenli ve tutarlı şekilde açmak.', 'integration-platform', 'active', 'critical', 'operational', ARRAY['integration', 'edge', 'shared-platform']::text[], 5, ARRAY['İş ortağı entegrasyonu', 'Kanal API erişimi']::text[], ARRAY['Kanal uygulamaları', 'İş ortakları']::text[], NULL, 'public-cloud', 'Amazon Web Services', NULL, '2022-06-20T09:00:00Z', 8, '2026-08-30T14:30:00Z', 8, '2026-08-30T10:00:00Z', 8),
  (13, 'LOYAL', 'Sadakat Motoru', 'Sadakat puanı kazandırır, harcatır ve üye seviyelerini yönetir.', 'Manuel iş ortağı tablolarının yerini alan yeni sadakat yeteneği; aktif geliştirmede.', 'Sadık müşterileri ödüllendirmek ve doğrudan kanal payını büyütmek.', 'api-service', 'development', 'high', 'not-deployed', ARRAY['loyalty', 'commerce']::text[], 1, ARRAY['Puan kazanımı', 'Puan harcama', 'Seviye yönetimi']::text[], ARRAY['Müşteriler', 'Sadakat operasyonları']::text[], 1200000, 'public-cloud', 'Amazon Web Services', NULL, '2026-02-03T09:00:00Z', 21, '2026-09-19T14:30:00Z', 21, '2026-09-19T10:00:00Z', 21),
  (14, 'LBC', 'Eski Rezervasyon Konsolu', 'Manuel rezervasyon değişiklikleri için temsilci konsolu; yerini Müşteri Portalı ve OMS alıyor.', 'Desteklenmeyen çatılar üzerine kurulmuş, sunucuda render edilen konsol. Emekliye ayrılması planlandı.', 'Çağrı merkezi temsilcilerinin modern kanalların henüz desteklemediği rezervasyonları değiştirebilmesini sağlamak.', 'web-application', 'deprecated', 'medium', 'operational', ARRAY['legacy', 'contact-centre']::text[], 1, ARRAY['Manuel rezervasyon değişiklikleri']::text[], ARRAY['Çağrı merkezi temsilcileri']::text[], 420, 'on-premises', NULL, NULL, '2016-04-18T09:00:00Z', 27, '2025-10-07T14:30:00Z', 27, '2025-11-02T10:00:00Z', 27),
  (15, 'EXP', 'Masraf Yönetimi', 'Çalışan masraf talepleri ve onayları için SaaS aracı.', 'Şirket politikasına göre yapılandırılmış, tedarikçi tarafından barındırılan masraf ürünü; onaylanan talepleri finansa aktarır.', 'Politikaya uygun onaylarla çalışanlara hızlı geri ödeme yapmak.', 'saas-product', 'active', 'low', 'operational', ARRAY['saas', 'finance', 'employee-facing']::text[], 2, ARRAY['Masraf talepleri', 'Onaylar']::text[], ARRAY['Çalışanlar', 'Birim yöneticileri']::text[], 9500, 'saas', NULL, 'Tedarikçi barındırmalı; yalnızca yapılandırma.', '2024-01-08T09:00:00Z', 15, '2024-03-02T14:30:00Z', 15, NULL, NULL),
  (16, 'MRH', 'Yönetim Raporlama Merkezi', 'Üst yönetim ve yönetim KPI''ları için planlanan self servis raporlama katmanı.', 'Tablo tabanlı aylık raporlamanın yerini veri platformu üzerindeki yönetişimli gösterge panelleri alacak.', 'Yönetime tek ve güvenilir bir kaynaktan tutarlı ve zamanında KPI''lar sunmak.', 'data-platform', 'planned', 'medium', 'not-deployed', ARRAY['reporting', 'analytics']::text[], 2, ARRAY['Yönetim raporlaması']::text[], ARRAY['Üst yöneticiler', 'İş birimi yöneticileri']::text[], 250, 'public-cloud', 'Amazon Web Services', NULL, '2026-07-01T09:00:00Z', 18, '2026-09-12T14:30:00Z', 18, '2026-09-12T10:00:00Z', 18),
  (17, 'HRC', 'İK Çekirdek Sistemi', 'Çalışanlar, pozisyonlar ve organizasyon yapısı için ana kayıt sistemi.', 'SaaS İK paketi; alt sistemler için çalışan verisinin ana kaynağı.', 'Her çalışan ve pozisyon için tek ve yetkili bir kayıt tutmak.', 'saas-product', 'active', 'high', 'operational', ARRAY['saas', 'hr', 'master-data']::text[], 4, ARRAY['İşe alımdan emekliliğe', 'Organizasyon yönetimi']::text[], ARRAY['HR', 'Birim yöneticileri']::text[], 1500, 'saas', NULL, NULL, '2022-01-17T09:00:00Z', 23, '2026-06-01T14:30:00Z', 23, '2026-02-11T10:00:00Z', 23);

INSERT INTO technology_usages (id, application_id, technology_id, layer, version) VALUES
  (1, 1, 1, 'frontend', '19'),
  (2, 1, 4, 'frontend', NULL),
  (3, 1, 5, 'backend', '21'),
  (4, 1, 6, 'backend', '3.4'),
  (5, 1, 12, 'database', '16'),
  (6, 1, 15, 'database', '7'),
  (7, 1, 17, 'messaging', NULL),
  (8, 1, 20, 'infrastructure', NULL),
  (9, 1, 23, 'infrastructure', NULL),
  (10, 1, 28, 'monitoring', NULL),
  (11, 1, 29, 'monitoring', NULL),
  (12, 2, 5, 'backend', '17'),
  (13, 2, 6, 'backend', '3.2'),
  (14, 2, 13, 'database', '12c'),
  (15, 2, 17, 'messaging', NULL),
  (16, 2, 20, 'infrastructure', NULL),
  (17, 2, 24, 'infrastructure', NULL),
  (18, 2, 28, 'monitoring', NULL),
  (19, 3, 8, 'backend', '22'),
  (20, 3, 4, 'backend', NULL),
  (21, 3, 14, 'database', '7'),
  (22, 3, 18, 'messaging', NULL),
  (23, 3, 17, 'messaging', NULL),
  (24, 3, 20, 'infrastructure', NULL),
  (25, 3, 23, 'infrastructure', NULL),
  (26, 4, 1, 'frontend', '19'),
  (27, 4, 4, 'frontend', NULL),
  (28, 4, 8, 'backend', '22'),
  (29, 4, 15, 'database', NULL),
  (30, 4, 20, 'infrastructure', NULL),
  (31, 4, 23, 'infrastructure', NULL),
  (32, 4, 30, 'testing', NULL),
  (33, 5, 2, 'frontend', '18'),
  (34, 5, 4, 'frontend', NULL),
  (35, 5, 9, 'backend', '8'),
  (36, 5, 12, 'database', '15'),
  (37, 5, 24, 'infrastructure', NULL),
  (38, 5, 27, 'devops', NULL),
  (39, 6, 5, 'backend', '21'),
  (40, 6, 6, 'backend', '3.4'),
  (41, 6, 12, 'database', '16'),
  (42, 6, 17, 'messaging', NULL),
  (43, 6, 18, 'messaging', NULL),
  (44, 6, 20, 'infrastructure', NULL),
  (45, 6, 23, 'infrastructure', NULL),
  (46, 7, 5, 'backend', '11'),
  (47, 7, 13, 'database', '19c'),
  (48, 7, 19, 'messaging', '9.1'),
  (49, 7, 24, 'infrastructure', NULL),
  (50, 7, 27, 'devops', NULL),
  (51, 8, 2, 'frontend', '17'),
  (52, 8, 5, 'backend', '21'),
  (53, 8, 6, 'backend', '3.3'),
  (54, 8, 12, 'database', '16'),
  (55, 8, 17, 'messaging', NULL),
  (56, 8, 20, 'infrastructure', NULL),
  (57, 9, 5, 'backend', '11'),
  (58, 9, 13, 'database', '19c'),
  (59, 9, 24, 'infrastructure', NULL),
  (60, 10, 9, 'backend', '8'),
  (61, 10, 12, 'database', '15'),
  (62, 10, 16, 'database', '8'),
  (63, 10, 24, 'infrastructure', NULL),
  (64, 11, 10, 'backend', '3.12'),
  (65, 11, 17, 'messaging', NULL),
  (66, 11, 12, 'database', NULL),
  (67, 11, 20, 'infrastructure', NULL),
  (68, 11, 23, 'infrastructure', NULL),
  (69, 11, 22, 'devops', NULL),
  (70, 12, 25, 'infrastructure', NULL),
  (71, 12, 20, 'infrastructure', NULL),
  (72, 12, 23, 'infrastructure', NULL),
  (73, 12, 22, 'devops', NULL),
  (74, 12, 28, 'monitoring', NULL),
  (75, 13, 7, 'backend', '2.1'),
  (76, 13, 6, 'backend', '3.4'),
  (77, 13, 12, 'database', '16'),
  (78, 13, 17, 'messaging', NULL),
  (79, 13, 20, 'infrastructure', NULL),
  (80, 14, 3, 'frontend', '1.7'),
  (81, 14, 11, 'backend', '1.3'),
  (82, 14, 5, 'backend', '8'),
  (83, 14, 13, 'database', '12c'),
  (84, 14, 24, 'infrastructure', NULL),
  (85, 16, 10, 'backend', NULL),
  (86, 16, 29, 'monitoring', NULL);

INSERT INTO data_stores (id, application_id, name, technology_id, purpose, contains_personal_data) VALUES
  (1, 1, 'identity-accounts', 12, 'Müşteri hesapları, kimlik bilgisi meta verileri ve açık rıza kayıtları', true),
  (2, 1, 'session-cache', 15, 'Kısa ömürlü oturum ve token önbelleği', false),
  (3, 2, 'payment-ledger', 13, 'Ödeme işlemleri ve token referansları (kart numarası saklanmaz)', true),
  (4, 3, 'notification-store', 14, 'Şablonlar, gönderim günlüğü ve kanal tercihleri', true),
  (5, 4, 'bff-cache', 15, 'BFF birleştirmesi için yanıt önbelleği', false),
  (6, 5, 'ess-requests', 12, 'Çalışan talepleri ve onayları', true),
  (7, 6, 'orders', 12, 'Siparişler, sipariş kalemleri ve karşılama durumu', true),
  (8, 7, 'finance-dwh', 13, 'Mutabakatı yapılmış işlemler ve yevmiye hazırlık alanı', false),
  (9, 8, 'ops-state', 12, 'Operasyonel uçuş durumu ve aksaklık günlüğü', false),
  (10, 9, 'crew-roster', 13, 'Çizelgeler, yetkinlikler ve görev kayıtları', true),
  (11, 10, 'dms-metadata', 12, 'Doküman meta verileri ve saklama', true),
  (12, 10, 'dms-search', 16, 'Tam metin dizini', false),
  (13, 11, 'lakehouse', 12, 'Düzenlenmiş analitik veri setleri', true),
  (14, 13, 'loyalty-ledger', 12, 'Üye hesapları ve puan defteri', true);

INSERT INTO source_repositories (id, application_id, name, type, url, default_branch, description) VALUES
  (1, 1, 'identity/identity-api', 'backend', 'https://git.corp.example/identity/identity-api', 'main', 'OIDC sağlayıcısı ve hesap API''leri'),
  (2, 1, 'identity/sign-in-ui', 'frontend', 'https://git.corp.example/identity/sign-in-ui', 'main', 'Barındırılan giriş ve hesap sayfaları'),
  (3, 1, 'identity/identity-infra', 'infrastructure', 'https://git.corp.example/identity/identity-infra', 'main', 'Terraform ve Helm chart''ları'),
  (4, 2, 'payments/payment-gateway', 'backend', 'https://git.corp.example/payments/payment-gateway', 'main', 'Çekirdek ödeme API''si ve üye işyeri bankası adaptörleri'),
  (5, 2, 'payments/settlement-jobs', 'backend', 'https://git.corp.example/payments/settlement-jobs', 'main', 'Mutabakat dosyası üretim işleri'),
  (6, 2, 'payments/payments-infra', 'infrastructure', 'https://git.corp.example/payments/payments-infra', 'main', NULL),
  (7, 3, 'platform/notification-service', 'backend', 'https://git.corp.example/platform/notification-service', 'main', NULL),
  (8, 3, 'platform/notification-templates', 'other', 'https://git.corp.example/platform/notification-templates', 'main', 'Yerelleştirilmiş mesaj şablonları'),
  (9, 4, 'digital/customer-portal-web', 'frontend', 'https://git.corp.example/digital/customer-portal-web', 'main', NULL),
  (10, 4, 'digital/customer-portal-bff', 'backend', 'https://git.corp.example/digital/customer-portal-bff', 'main', NULL),
  (11, 5, 'workplace/ess-web', 'frontend', 'https://git.corp.example/workplace/ess-web', 'main', NULL),
  (12, 5, 'workplace/ess-api', 'backend', 'https://git.corp.example/workplace/ess-api', 'main', NULL),
  (13, 6, 'commerce/order-management', 'backend', 'https://git.corp.example/commerce/order-management', 'main', NULL),
  (14, 6, 'commerce/order-management-infra', 'infrastructure', 'https://git.corp.example/commerce/order-management-infra', 'main', NULL),
  (15, 7, 'finance/finance-platform', 'backend', 'https://git.corp.example/finance/finance-platform', 'master', NULL),
  (16, 8, 'ops/flight-ops-web', 'frontend', 'https://git.corp.example/ops/flight-ops-web', 'main', NULL),
  (17, 8, 'ops/flight-ops-api', 'backend', 'https://git.corp.example/ops/flight-ops-api', 'main', NULL),
  (18, 9, 'ops/crew-scheduling', 'backend', 'https://git.corp.example/ops/crew-scheduling', 'master', NULL),
  (19, 10, 'workplace/document-management', 'backend', 'https://git.corp.example/workplace/document-management', 'main', NULL),
  (20, 11, 'data/pipelines', 'backend', 'https://git.corp.example/data/pipelines', 'main', NULL),
  (21, 11, 'data/platform-infra', 'infrastructure', 'https://git.corp.example/data/platform-infra', 'main', NULL),
  (22, 12, 'integration/api-gateway-config', 'infrastructure', 'https://git.corp.example/integration/api-gateway-config', 'main', 'Kod olarak rotalar ve politikalar'),
  (23, 13, 'commerce/loyalty-engine', 'backend', 'https://git.corp.example/commerce/loyalty-engine', 'main', NULL),
  (24, 17, 'workplace/hr-core-integration', 'other', 'https://git.corp.example/workplace/hr-core-integration', 'main', 'Dışa aktarım eşlemeleri ve betikleri');

INSERT INTO environments (id, application_id, type, name, url, status, region, notes) VALUES
  (1, 1, 'development', 'Geliştirme', 'https://identity.dev.corp.example', 'available', 'eu-central', NULL),
  (2, 1, 'test', 'Test', 'https://identity.test.corp.example', 'available', 'eu-central', NULL),
  (3, 1, 'uat', 'UAT', 'https://identity.uat.corp.example', 'available', 'eu-central', NULL),
  (4, 1, 'production', 'Canlı', 'https://identity.corp.example', 'available', 'eu-central', NULL),
  (5, 1, 'disaster-recovery', 'Felaket kurtarma', 'https://identity.dr.corp.example', 'available', 'eu-west', NULL),
  (6, 2, 'development', 'Geliştirme', 'https://payments.dev.corp.example', 'available', 'eu-central', NULL),
  (7, 2, 'test', 'Test', 'https://payments.test.corp.example', 'available', 'eu-central', NULL),
  (8, 2, 'uat', 'UAT', 'https://payments.uat.corp.example', 'available', 'eu-central', NULL),
  (9, 2, 'production', 'Canlı', 'https://payments.corp.example', 'available', 'eu-central', NULL),
  (10, 2, 'disaster-recovery', 'Felaket kurtarma', 'https://payments.dr.corp.example', 'available', 'eu-west', NULL),
  (11, 3, 'development', 'Geliştirme', 'https://notify.dev.corp.example', 'available', 'eu-central', NULL),
  (12, 3, 'test', 'Test', 'https://notify.test.corp.example', 'available', 'eu-central', NULL),
  (13, 3, 'uat', 'UAT', 'https://notify.uat.corp.example', 'available', 'eu-central', NULL),
  (15, 3, 'production', 'Canlı', 'https://notify.corp.example', 'degraded', 'eu-central', '22 Eylül''den beri SMS teslim gecikmesi yüksek.'),
  (16, 4, 'development', 'Geliştirme', 'https://portal.dev.corp.example', 'available', 'eu-central', NULL),
  (17, 4, 'test', 'Test', 'https://portal.test.corp.example', 'available', 'eu-central', NULL),
  (18, 4, 'uat', 'UAT', 'https://portal.uat.corp.example', 'available', 'eu-central', NULL),
  (19, 4, 'production', 'Canlı', 'https://portal.corp.example', 'available', 'eu-central', NULL),
  (20, 4, 'disaster-recovery', 'Felaket kurtarma', 'https://portal.dr.corp.example', 'available', 'eu-west', NULL),
  (21, 5, 'development', 'Geliştirme', 'https://ess.dev.corp.example', 'available', 'eu-central', NULL),
  (22, 5, 'test', 'Test', 'https://ess.test.corp.example', 'available', 'eu-central', NULL),
  (23, 5, 'uat', 'UAT', 'https://ess.uat.corp.example', 'available', 'eu-central', NULL),
  (24, 5, 'production', 'Canlı', 'https://ess.corp.example', 'available', 'eu-central', NULL),
  (25, 6, 'development', 'Geliştirme', 'https://orders.dev.corp.example', 'available', 'eu-central', NULL),
  (26, 6, 'test', 'Test', 'https://orders.test.corp.example', 'available', 'eu-central', NULL),
  (27, 6, 'uat', 'UAT', 'https://orders.uat.corp.example', 'available', 'eu-central', NULL),
  (28, 6, 'production', 'Canlı', 'https://orders.corp.example', 'available', 'eu-central', NULL),
  (29, 6, 'disaster-recovery', 'Felaket kurtarma', 'https://orders.dr.corp.example', 'available', 'eu-west', NULL),
  (30, 7, 'test', 'Test', 'https://finance.test.corp.example', 'available', 'eu-central', NULL),
  (31, 7, 'production', 'Canlı', 'https://finance.corp.example', 'available', 'on-prem-dc1', NULL),
  (32, 8, 'development', 'Geliştirme', 'https://flightops.dev.corp.example', 'available', 'eu-central', NULL),
  (33, 8, 'test', 'Test', 'https://flightops.test.corp.example', 'available', 'eu-central', NULL),
  (34, 8, 'uat', 'UAT', 'https://flightops.uat.corp.example', 'available', 'eu-central', NULL),
  (35, 8, 'production', 'Canlı', 'https://flightops.corp.example', 'available', 'eu-central', NULL),
  (36, 8, 'disaster-recovery', 'Felaket kurtarma', 'https://flightops.dr.corp.example', 'available', 'eu-west', NULL),
  (37, 9, 'test', 'Test', 'https://crew.test.corp.example', 'available', 'eu-central', NULL),
  (38, 9, 'production', 'Canlı', 'https://crew.corp.example', 'available', 'on-prem-dc1', NULL),
  (39, 10, 'development', 'Geliştirme', 'https://documents.dev.corp.example', 'available', 'eu-central', NULL),
  (40, 10, 'test', 'Test', 'https://documents.test.corp.example', 'available', 'eu-central', NULL),
  (41, 10, 'uat', 'UAT', 'https://documents.uat.corp.example', 'available', 'eu-central', NULL),
  (42, 10, 'production', 'Canlı', 'https://documents.corp.example', 'available', 'eu-central', NULL),
  (43, 11, 'development', 'Geliştirme', 'https://data.dev.corp.example', 'available', 'eu-central', NULL),
  (44, 11, 'test', 'Test', 'https://data.test.corp.example', 'available', 'eu-central', NULL),
  (45, 11, 'uat', 'UAT', 'https://data.uat.corp.example', 'available', 'eu-central', NULL),
  (46, 11, 'production', 'Canlı', 'https://data.corp.example', 'available', 'eu-central', NULL),
  (47, 12, 'development', 'Geliştirme', 'https://api.dev.corp.example', 'available', 'eu-central', NULL),
  (48, 12, 'test', 'Test', 'https://api.test.corp.example', 'available', 'eu-central', NULL),
  (49, 12, 'uat', 'UAT', 'https://api.uat.corp.example', 'available', 'eu-central', NULL),
  (50, 12, 'production', 'Canlı', 'https://api.corp.example', 'available', 'eu-central', NULL),
  (51, 12, 'disaster-recovery', 'Felaket kurtarma', 'https://api.dr.corp.example', 'available', 'eu-west', NULL),
  (52, 13, 'development', 'Geliştirme', 'https://loyalty.dev.corp.example', 'available', 'eu-central', NULL),
  (53, 13, 'test', 'Test', 'https://loyalty.test.corp.example', 'available', 'eu-central', NULL),
  (54, 14, 'production', 'Canlı', 'https://booking-console.corp.example', 'available', 'on-prem-dc1', NULL),
  (55, 15, 'production', 'Canlı', 'https://expenses.corp.example', 'available', NULL, NULL),
  (56, 17, 'test', 'Test', 'https://hr.test.corp.example', 'available', NULL, NULL),
  (57, 17, 'production', 'Canlı', 'https://hr.corp.example', 'available', NULL, NULL);

INSERT INTO projects (id, code, name, short_name, description, objective, scope, out_of_scope, type, priority, status, health, confidentiality, tags, business_unit_id, planned_start_date, actual_start_date, planned_end_date, actual_end_date, progress_percentage, current_phase, latest_status_summary, next_steps, currency, budget, actual_cost, forecast_cost, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'DOT', 'Dijital Müşteri Kazanım Dönüşümü', 'Dijital Kazanım', 'Web ve mobilde müşteri kaydını ve kimlik doğrulamayı yeniden tasarlar.', 'Kayıt sırasında vazgeçme oranını %30 azaltmak ve uzaktan kimlik doğrulamayı mümkün kılmak.', 'Yeni kayıt akışı, belge doğrulama tedarikçisi entegrasyonu, açık rıza alma sürecinin yeniden tasarımı.', 'Sadakat programına kayıt; çağrı merkezi üzerinden kayıt.', 'modernisation', 'high', 'in-progress', 'at-risk', 'internal', ARRAY['identity', 'customer-experience']::text[], 1, '2026-02-02', '2026-02-16', '2026-12-18', NULL, 55, 'build', 'Doğrulama tedarikçisinin API teslimi üç hafta kaydı; akış geliştirmesi planda.', 'Tedarikçiyle revize teslim planında uzlaşmak; UAT hazırlığına başlamak.', 'EUR', 1800000, 910000, 1950000, '2026-01-12T09:00:00Z', 24, '2026-09-22T14:30:00Z', 24, '2026-09-22T10:00:00Z', 24),
  (2, 'PPM', 'Ödeme Platformu Modernizasyonu', 'Ödeme Modernizasyonu', 'Ödeme Geçidi''ni desteklenen bir veritabanına taşır ve ikinci bir üye işyeri bankası ekler.', 'Desteği biten veritabanı riskini ortadan kaldırmak ve üye işyeri bankası yedekliliği sağlamak.', 'Oracle 19c''ye veritabanı geçişi, ikinci üye işyeri bankası adaptörü, mutabakat dosyası v2.', 'Yeni ödeme yöntemleri.', 'modernisation', 'critical', 'in-progress', 'on-track', 'confidential', ARRAY['payments', 'resilience']::text[], 2, '2026-01-05', '2026-01-05', '2027-03-31', NULL, 40, 'build', '1. geçiş provası başarılı; ikinci üye işyeri bankası sözleşmesi imzalandı.', '2. geçiş provası; üye işyeri bankası sertifikasyonu.', 'EUR', 2400000, 880000, 2350000, '2025-11-20T09:00:00Z', 25, '2026-09-15T14:30:00Z', 25, '2026-09-15T10:00:00Z', 25),
  (3, 'LPL', 'Sadakat Programı Lansmanı', 'Sadakat Lansmanı', 'Yeni sadakat programını kendi motoru ve kanal entegrasyonuyla hayata geçirir.', 'İlk yılda bir milyon üye kazanmak.', 'Sadakat Motoru geliştirmesi, portal üye alanı, siparişten puan kazanımı.', 'Partner havayolu puan kazanma/harcama.', 'new-product', 'high', 'in-progress', 'on-track', 'internal', ARRAY['loyalty', 'revenue']::text[], 1, '2026-02-01', '2026-02-01', '2027-01-29', NULL, 48, 'build', 'Puan kazanım kuralları tamamlandı; puan harcama devam ediyor.', 'Portal üye alanı tasarım incelemesi.', NULL, NULL, NULL, NULL, '2026-01-10T09:00:00Z', 25, '2026-09-19T14:30:00Z', 25, '2026-09-19T10:00:00Z', 25),
  (4, 'LBR', 'Eski Rezervasyon Konsolunun Emekliye Ayrılması', 'ERK Emeklilik', 'Kalan temsilci rezervasyon işlevlerini modern kanallara taşır ve konsolu emekliye ayırır.', 'Konsolu ve desteklenmeyen çatılarını 2027 2. çeyreğine kadar devreden çıkarmak.', 'Boşluk analizi, OMS temsilci API''leri, servis konsolunda temsilci arayüzü, veri arşivi.', 'Çağrı merkezi telefoni altyapısı.', 'decommissioning', 'medium', 'approved', 'at-risk', 'internal', ARRAY['legacy', 'technical-debt']::text[], 1, '2026-10-01', NULL, '2027-06-30', NULL, 5, 'initiation', 'Konsolun teknik sahibi yok; bilgi destek ekibinde toplanmış.', 'Teknik sahip atamak; boşluk analizine başlamak.', 'EUR', 650000, 0, 650000, '2026-06-02T09:00:00Z', 24, '2026-09-08T14:30:00Z', 24, '2026-09-08T10:00:00Z', 24),
  (5, 'ORP', 'Operasyonel Dayanıklılık Programı', 'Operasyonel Dayanıklılık', 'Bahar aksaklık incelemesinin ardından uçuş ve ekip operasyon sistemlerini güçlendirir.', 'Kritik operasyon sistemleri için veri merkezi arızasından 30 dakika içinde toparlanmak.', 'Uçuş Operasyon Portalı için felaket kurtarma, ekip motoru platform değişikliği değerlendirmesi, runbook otomasyonu.', 'Yer hizmetleri sistemleri.', 'infrastructure', 'critical', 'in-progress', 'critical', 'confidential', ARRAY['resilience', 'operations']::text[], 3, '2026-04-01', '2026-04-15', '2026-12-31', NULL, 35, 'design', 'Ekip motoru felaket kurtarma tasarımı kilit kişilerin müsaitliği nedeniyle bloke; çizelge senkronizasyonu eskalasyonu açık.', 'Çizelge senkronizasyonu eskalasyonunu çözmek; harici Oracle uzmanlığı sağlamak.', 'EUR', 1200000, 520000, 1480000, '2026-03-18T09:00:00Z', 24, '2026-09-24T14:30:00Z', 24, '2026-09-24T10:00:00Z', 24),
  (6, 'MRP', 'Yönetim Raporlama Programı', 'Yönetim Raporlama', 'Yönetim Raporlama Merkezi''ni Kurumsal Veri Platformu üzerinde kurar.', 'Tablo tabanlı aylık KPI paketlerinin yerini almak.', 'KPI tanımları, raporlama merkezi, finans ve operasyon gösterge panelleri.', 'Operasyonel gerçek zamanlı gösterge panelleri.', 'new-product', 'medium', 'proposed', 'on-track', 'internal', ARRAY['reporting', 'data']::text[], 2, '2026-11-02', NULL, '2027-06-30', NULL, 0, 'initiation', 'İş gerekçesi inceleniyor.', 'Yatırım komitesi kararı Ekim''de.', 'EUR', 480000, NULL, 480000, '2026-07-01T09:00:00Z', 25, '2026-09-12T14:30:00Z', 25, '2026-09-12T10:00:00Z', 25),
  (7, 'WMFA', 'Çalışan MFA Yaygınlaştırması', 'Çalışan MFA', 'Çalışanlara yönelik tüm uygulamalarda çok faktörlü kimlik doğrulamayı zorunlu hale getirdi.', 'Çalışan girişlerinde %100 MFA kapsamı.', 'CIP''te MFA politikaları, ESS ve Uçuş Operasyon Portalı''nın dahil edilmesi.', 'Müşteri MFA.', 'regulatory', 'high', 'completed', 'completed', 'internal', ARRAY['security', 'identity']::text[], 5, '2025-09-01', '2025-09-01', '2026-03-31', '2026-03-20', 100, 'closure', 'Kapandı. Çalışanlarda %100 MFA kapsamına ulaşıldı.', 'Yok.', 'EUR', 300000, 276000, 276000, '2025-08-10T09:00:00Z', 25, '2026-03-25T14:30:00Z', 25, '2026-03-25T10:00:00Z', 25),
  (8, 'NCC', 'Bildirim Kanalı Konsolidasyonu', 'Bildirim Konsolidasyonu', 'SMS sağlayıcılarını birleştirir ve bildirim alımını RabbitMQ''dan Kafka''ya taşır.', 'SMS maliyetini %25 azaltmak ve Kafka''da standartlaşmak.', 'SMS sağlayıcı ihalesi, Kafka alımı, şablon taşıma.', 'Yeni kanallar.', 'integration', 'medium', 'on-hold', 'at-risk', 'internal', ARRAY['messaging', 'cost']::text[], 5, '2026-05-04', '2026-05-18', '2026-12-11', NULL, 20, 'analysis', 'SMS gecikmesi incelemesi sonuçlanana kadar durduruldu.', 'Gecikmenin kök nedeni doğrulandıktan sonra yeniden başlatmak.', NULL, NULL, NULL, NULL, '2026-04-10T09:00:00Z', 25, '2026-09-23T14:30:00Z', 25, '2026-09-23T10:00:00Z', 25);

INSERT INTO milestones (id, project_id, title, due_date, completed_date, status) VALUES
  (1, 1, 'Keşif tamamlandı', '2026-03-27', '2026-04-03', 'completed'),
  (2, 1, 'Tedarikçi entegrasyonu hazır', '2026-08-28', NULL, 'missed'),
  (3, 1, 'UAT onayı', '2026-11-13', NULL, 'at-risk'),
  (4, 1, 'Canlıya geçiş', '2026-12-18', NULL, 'planned'),
  (5, 2, '1. geçiş provası', '2026-07-31', '2026-07-29', 'completed'),
  (6, 2, 'Üye işyeri bankası sertifikasyonu', '2026-11-30', NULL, 'in-progress'),
  (7, 2, 'Canlıya geçiş', '2027-02-28', NULL, 'planned'),
  (8, 3, 'Puan kazanım MVP', '2026-08-14', '2026-08-12', 'completed'),
  (9, 3, 'Puan harcama MVP', '2026-10-30', NULL, 'in-progress'),
  (10, 3, 'Genel lansman', '2027-01-29', NULL, 'planned'),
  (11, 4, 'Boşluk analizi tamamlandı', '2026-12-15', NULL, 'planned'),
  (12, 4, 'Konsol kapatıldı', '2027-06-30', NULL, 'planned'),
  (13, 5, 'Felaket kurtarma tasarımı onaylandı', '2026-08-31', NULL, 'missed'),
  (14, 5, 'Uçuş Operasyon felaket kurtarma canlıda', '2026-11-30', NULL, 'at-risk'),
  (15, 6, 'Yatırım kararı', '2026-10-20', NULL, 'planned'),
  (16, 7, 'Tam zorunluluk', '2026-03-31', '2026-03-20', 'completed'),
  (17, 8, 'Sağlayıcı seçildi', '2026-09-15', NULL, 'missed');

INSERT INTO application_impacts (id, project_id, application_id, impact_type, description) VALUES
  (1, 1, 1, 'modifies', 'Yeni kayıt ve doğrulama API''leri.'),
  (2, 1, 4, 'modifies', 'Yeniden tasarlanmış kayıt akışı.'),
  (3, 1, 3, 'integrates-with', 'Yeni doğrulama mesaj şablonları.'),
  (4, 2, 2, 'modifies', 'Veritabanı geçişi ve üye işyeri bankası adaptörü.'),
  (5, 2, 7, 'modifies', 'Mutabakat dosyası v2 alımı.'),
  (6, 3, 13, 'creates', 'Yeni sadakat motoru.'),
  (7, 3, 4, 'modifies', 'Üye alanı ve ödeme adımında puan harcama.'),
  (8, 3, 6, 'modifies', 'Sipariş karşılandığında puan kazanım olayları.'),
  (9, 4, 14, 'decommissions', 'Tamamen emekliye ayırma.'),
  (10, 4, 6, 'modifies', 'Temsilci değişiklik API''leri.'),
  (11, 5, 8, 'modifies', 'Aktif-aktif felaket kurtarma.'),
  (12, 5, 9, 'modifies', 'Felaket kurtarma ve platform değişikliği değerlendirmesi.'),
  (13, 6, 16, 'creates', 'Yeni raporlama merkezi.'),
  (14, 6, 11, 'integrates-with', 'Düzenlenmiş KPI veri setleri.'),
  (15, 7, 1, 'modifies', 'Çalışan MFA politikaları.'),
  (16, 7, 5, 'modifies', 'MFA zorunlu giriş.'),
  (17, 7, 8, 'modifies', 'MFA zorunlu giriş.'),
  (18, 8, 3, 'modifies', 'Kafka alımı ve sağlayıcı değişikliği.');

INSERT INTO role_assignments (id, application_id, project_id, person_id, role, sort_order) VALUES
  (1, 1, NULL, 6, 'architect', 0),
  (2, 1, NULL, 10, 'technical-owner', 1),
  (3, 1, NULL, 2, 'business-owner', 2),
  (4, 1, NULL, 11, 'product-owner', 3),
  (5, 1, NULL, 7, 'stakeholder', 4),
  (6, 2, NULL, 13, 'technical-owner', 0),
  (7, 2, NULL, 3, 'business-owner', 1),
  (8, 2, NULL, 14, 'product-owner', 2),
  (9, 2, NULL, 7, 'architect', 3),
  (10, 3, NULL, 9, 'technical-owner', 0),
  (11, 3, NULL, 2, 'business-owner', 1),
  (12, 3, NULL, 11, 'product-owner', 2),
  (13, 4, NULL, 20, 'technical-owner', 0),
  (14, 4, NULL, 2, 'business-owner', 1),
  (15, 4, NULL, 26, 'product-owner', 2),
  (16, 5, NULL, 23, 'technical-owner', 0),
  (17, 5, NULL, 5, 'business-owner', 1),
  (18, 6, NULL, 21, 'technical-owner', 0),
  (19, 6, NULL, 2, 'business-owner', 1),
  (20, 6, NULL, 6, 'architect', 2),
  (21, 7, NULL, 15, 'technical-owner', 0),
  (22, 7, NULL, 3, 'business-owner', 1),
  (23, 8, NULL, 17, 'technical-owner', 0),
  (24, 8, NULL, 4, 'business-owner', 1),
  (25, 8, NULL, 16, 'product-owner', 2),
  (26, 9, NULL, 16, 'technical-owner', 0),
  (27, 9, NULL, 4, 'business-owner', 1),
  (28, 10, NULL, 23, 'technical-owner', 0),
  (29, 10, NULL, 5, 'business-owner', 1),
  (30, 11, NULL, 18, 'technical-owner', 0),
  (31, 11, NULL, 1, 'business-owner', 1),
  (32, 12, NULL, 8, 'technical-owner', 0),
  (33, 12, NULL, 1, 'business-owner', 1),
  (34, 13, NULL, 21, 'technical-owner', 0),
  (35, 13, NULL, 22, 'business-owner', 1),
  (36, 13, NULL, 22, 'product-owner', 2),
  (37, 14, NULL, 2, 'business-owner', 0),
  (38, 15, NULL, 15, 'technical-owner', 0),
  (39, 15, NULL, 3, 'business-owner', 1),
  (40, 16, NULL, 18, 'technical-owner', 0),
  (41, 16, NULL, 3, 'business-owner', 1),
  (42, 17, NULL, 23, 'technical-owner', 0),
  (43, 17, NULL, 5, 'business-owner', 1),
  (44, NULL, 1, 2, 'sponsor', 0),
  (45, NULL, 1, 24, 'project-manager', 1),
  (46, NULL, 1, 26, 'analyst-lead', 2),
  (47, NULL, 1, 10, 'technical-lead', 3),
  (48, NULL, 1, 11, 'product-owner', 4),
  (49, NULL, 1, 7, 'stakeholder', 5),
  (50, NULL, 2, 3, 'sponsor', 0),
  (51, NULL, 2, 25, 'project-manager', 1),
  (52, NULL, 2, 13, 'technical-lead', 2),
  (53, NULL, 2, 14, 'product-owner', 3),
  (54, NULL, 3, 22, 'sponsor', 0),
  (55, NULL, 3, 25, 'project-manager', 1),
  (56, NULL, 3, 21, 'technical-lead', 2),
  (57, NULL, 3, 26, 'analyst-lead', 3),
  (58, NULL, 4, 2, 'sponsor', 0),
  (59, NULL, 4, 24, 'project-manager', 1),
  (60, NULL, 4, 21, 'technical-lead', 2),
  (61, NULL, 5, 4, 'sponsor', 0),
  (62, NULL, 5, 24, 'project-manager', 1),
  (63, NULL, 5, 17, 'technical-lead', 2),
  (64, NULL, 5, 6, 'architect', 3),
  (65, NULL, 6, 3, 'sponsor', 0),
  (66, NULL, 6, 25, 'project-manager', 1),
  (67, NULL, 6, 18, 'technical-lead', 2),
  (68, NULL, 7, 1, 'sponsor', 0),
  (69, NULL, 7, 25, 'project-manager', 1),
  (70, NULL, 7, 7, 'technical-lead', 2),
  (71, NULL, 8, 9, 'sponsor', 0),
  (72, NULL, 8, 25, 'project-manager', 1),
  (73, NULL, 8, 8, 'technical-lead', 2);

INSERT INTO team_assignments (id, application_id, project_id, team_id, responsibility) VALUES
  (1, 1, NULL, 1, 'development'),
  (2, 1, NULL, 10, 'support'),
  (3, 2, NULL, 2, 'development'),
  (4, 2, NULL, 10, 'support'),
  (5, 3, NULL, 1, 'development'),
  (6, 3, NULL, 10, 'support'),
  (7, 4, NULL, 3, 'development'),
  (8, 4, NULL, 10, 'support'),
  (9, 5, NULL, 8, 'development'),
  (10, 5, NULL, 10, 'support'),
  (11, 6, NULL, 4, 'development'),
  (12, 6, NULL, 10, 'support'),
  (13, 7, NULL, 7, 'development'),
  (14, 7, NULL, 7, 'support'),
  (15, 8, NULL, 5, 'development'),
  (16, 8, NULL, 10, 'support'),
  (17, 9, NULL, 5, 'development'),
  (18, 9, NULL, 5, 'support'),
  (19, 10, NULL, 8, 'development'),
  (20, 10, NULL, 10, 'support'),
  (21, 11, NULL, 6, 'development'),
  (22, 11, NULL, 6, 'support'),
  (23, 12, NULL, 9, 'development'),
  (24, 12, NULL, 10, 'support'),
  (25, 13, NULL, 4, 'development'),
  (26, 14, NULL, 10, 'support'),
  (27, 15, NULL, 7, 'support'),
  (28, 16, NULL, 6, 'development'),
  (29, 17, NULL, 8, 'support'),
  (30, NULL, 1, 1, 'delivery'),
  (31, NULL, 1, 3, 'delivery'),
  (32, NULL, 2, 2, 'delivery'),
  (33, NULL, 3, 4, 'delivery'),
  (34, NULL, 3, 3, 'delivery'),
  (35, NULL, 4, 4, 'delivery'),
  (36, NULL, 5, 5, 'delivery'),
  (37, NULL, 6, 6, 'delivery'),
  (38, NULL, 7, 1, 'delivery'),
  (39, NULL, 8, 1, 'delivery'),
  (40, NULL, 8, 9, 'delivery');

INSERT INTO documentation_links (id, application_id, project_id, type, title, url, description) VALUES
  (1, 1, NULL, 'architecture', 'Kimlik platformu mimarisi', 'https://wiki.corp.example/CIP/architecture', 'C4 diyagramları ve güven sınırları'),
  (2, 1, NULL, 'confluence', 'CIP Confluence alanı', 'https://wiki.corp.example/CIP', NULL),
  (3, 1, NULL, 'jira', 'CIP teslimat panosu', 'https://jira.corp.example/boards/CIP', NULL),
  (4, 1, NULL, 'runbook', 'Giriş olayı runbook''u', 'https://wiki.corp.example/CIP/runbooks/sign-in', NULL),
  (5, 1, NULL, 'monitoring', 'Kimlik altın sinyalleri', 'https://grafana.corp.example/d/identity-golden-signals', NULL),
  (6, 2, NULL, 'architecture', 'Ödeme Geçidi mimarisi', 'https://wiki.corp.example/PAY/architecture', NULL),
  (7, 2, NULL, 'analysis', 'PCI DSS kapsam değerlendirmesi 2026', 'https://wiki.corp.example/PAY/pci-2026', NULL),
  (8, 2, NULL, 'jira', 'Ödemeler panosu', 'https://jira.corp.example/boards/PAY', NULL),
  (9, 2, NULL, 'runbook', 'Üye işyeri bankası yedeğe geçiş runbook''u', 'https://wiki.corp.example/PAY/runbooks/acquirer-failover', NULL),
  (10, 2, NULL, 'dashboard', 'Provizyon başarı oranı', 'https://grafana.corp.example/d/payments-auth-rate', NULL),
  (11, 3, NULL, 'confluence', 'Bildirim Servisi alanı', 'https://wiki.corp.example/NOTIF', NULL),
  (12, 3, NULL, 'architecture', 'Kanal adaptörleri ve yönlendirme', 'https://wiki.corp.example/NOTIF/channels', NULL),
  (13, 3, NULL, 'monitoring', 'Kanala göre teslim gecikmesi', 'https://grafana.corp.example/d/notification-latency', NULL),
  (14, 4, NULL, 'confluence', 'Müşteri Portalı alanı', 'https://wiki.corp.example/CPORT', NULL),
  (15, 4, NULL, 'jira', 'Müşteri Portalı panosu', 'https://jira.corp.example/boards/CPORT', NULL),
  (16, 4, NULL, 'design', 'Müşteri Portalı tasarım kütüphanesi', 'https://design.corp.example/files/customer-portal', NULL),
  (17, 4, NULL, 'monitoring', 'Gerçek kullanıcı izleme', 'https://grafana.corp.example/d/portal-rum', NULL),
  (18, 5, NULL, 'confluence', 'ESS alanı', 'https://wiki.corp.example/ESS', NULL),
  (19, 5, NULL, 'jira', 'Çalışma Ortamı Sistemleri panosu', 'https://jira.corp.example/boards/WPS', NULL),
  (20, 6, NULL, 'architecture', 'Sipariş yaşam döngüsü ve durum makinesi', 'https://wiki.corp.example/OMS/lifecycle', NULL),
  (21, 6, NULL, 'jira', 'E-Ticaret panosu', 'https://jira.corp.example/boards/COM', NULL),
  (22, 7, NULL, 'confluence', 'Finans Platformu alanı', 'https://wiki.corp.example/FINP', NULL),
  (23, 8, NULL, 'confluence', 'Uçuş Operasyon Portalı alanı', 'https://wiki.corp.example/FOPS', NULL),
  (24, 8, NULL, 'runbook', 'Büyük aksaklık runbook''u', 'https://wiki.corp.example/FOPS/runbooks/disruption', NULL),
  (25, 8, NULL, 'jira', 'Operasyon Sistemleri panosu', 'https://jira.corp.example/boards/OPS', NULL),
  (26, 9, NULL, 'confluence', 'Ekip Planlama alanı', 'https://wiki.corp.example/CREW', NULL),
  (27, 10, NULL, 'confluence', 'DMS alanı', 'https://wiki.corp.example/DMS', NULL),
  (28, 11, NULL, 'confluence', 'Veri Platformu alanı', 'https://wiki.corp.example/EDP', NULL),
  (29, 11, NULL, 'other', 'Veri ürünü kataloğu', 'https://docs.corp.example/data-catalogue', NULL),
  (30, 12, NULL, 'architecture', 'API tasarım standartları', 'https://wiki.corp.example/INT/api-standards', NULL),
  (31, 12, NULL, 'dashboard', 'Geçit trafiği', 'https://grafana.corp.example/d/api-gateway', NULL),
  (32, 13, NULL, 'analysis', 'Sadakat programı iş analizi', 'https://wiki.corp.example/LOYAL/analysis', NULL),
  (33, 13, NULL, 'jira', 'Sadakat panosu', 'https://jira.corp.example/boards/LOY', NULL),
  (34, 15, NULL, 'confluence', 'Masraf politikası yapılandırması', 'https://wiki.corp.example/FIN/expense-config', NULL),
  (35, 16, NULL, 'analysis', 'Raporlama gereksinimleri', 'https://wiki.corp.example/MRH/requirements', NULL),
  (36, 17, NULL, 'confluence', 'İK Çekirdek alanı', 'https://wiki.corp.example/HRC', NULL),
  (37, NULL, 1, 'confluence', 'Proje beratı', 'https://wiki.corp.example/DOT/charter', NULL),
  (38, NULL, 1, 'jira', 'Kazanım epik panosu', 'https://jira.corp.example/boards/DOT', NULL),
  (39, NULL, 2, 'confluence', 'Geçiş planı', 'https://wiki.corp.example/PPM/cutover', NULL),
  (40, NULL, 3, 'analysis', 'Program kuralları analizi', 'https://wiki.corp.example/LOYAL/analysis', NULL),
  (41, NULL, 5, 'analysis', 'Bahar aksaklık incelemesi', 'https://wiki.corp.example/OPS/disruption-review-2026', NULL),
  (42, NULL, 7, 'confluence', 'Kapanış raporu', 'https://wiki.corp.example/SEC/wmfa-closure', NULL);

INSERT INTO dependencies (id, source_application_id, target_application_id, type, criticality, description, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 4, 1, 'authentication', 'critical', 'Tüm müşteri girişleri ve oturum doğrulaması.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (2, 5, 1, 'authentication', 'high', 'Çalışanlar için tek oturum açma.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (3, 8, 1, 'authentication', 'high', 'Kontrolörlerin MFA ile girişi.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (4, 12, 1, 'authentication', 'critical', 'Her API çağrısı için token doğrulama.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (5, 13, 1, 'authentication', 'high', 'Üye kimliği ve açık rıza sorgulama.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (6, 1, 3, 'messaging', 'medium', 'Doğrulama kodları ve hesap bildirimleri.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (7, 4, 6, 'runtime', 'critical', 'Sipariş oluşturma ve rezervasyon yönetimi.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (8, 4, 12, 'runtime', 'critical', 'BFF''nin backend API''lerine yaptığı tüm çağrılar geçitten geçer.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (9, 4, 13, 'runtime', 'medium', 'Üye bakiyesi ve puan harcama (planlanan canlıya geçiş).', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (10, 6, 2, 'runtime', 'critical', 'Ödeme adımında provizyon.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (11, 6, 3, 'messaging', 'medium', 'Sipariş onay mesajları.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (12, 6, 13, 'data', 'medium', 'Karşılanan siparişlerde puan kazanımı.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (13, 2, 7, 'batch', 'high', 'Mutabakat için günlük mutabakat dosyaları.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (14, 2, 3, 'messaging', 'low', 'İade bildirimleri.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (15, 8, 9, 'runtime', 'critical', 'Anlık ekip müsaitliği ve yeniden atama önerileri.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (16, 8, 3, 'messaging', 'high', 'Ekiplere ve nöbetçi yöneticilere aksaklık uyarıları.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (17, 5, 17, 'data', 'high', 'Çalışan ana verileri.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (18, 5, 10, 'runtime', 'medium', 'Bordro ve sözleşme dokümanları.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (19, 5, 15, 'runtime', 'low', 'Masraf taleplerine doğrudan bağlantılar.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (20, 11, 6, 'data', 'medium', 'Satış analitiği için sipariş olayları.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (21, 11, 2, 'data', 'medium', 'Gelir analitiği için ödeme olayları.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (22, 11, 7, 'data', 'medium', 'Mutabakatı yapılmış gelir verisi.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (23, 16, 11, 'data', 'critical', 'Tüm raporlama veri setleri.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (24, 14, 6, 'runtime', 'high', 'OMS API''leri üzerinden yazılan rezervasyon değişiklikleri.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (25, 7, 10, 'data', 'low', 'Ay sonu raporlarını arşivler.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8);

INSERT INTO integrations (id, name, type, from_application_id, to_application_id, external_party_name, frequency, data_exchanged, description, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'OIDC yetkilendirme kodu akışı', 'rest-api', 4, 1, NULL, 'real-time', 'Token''lar, kullanıcı bilgileri', 'OpenID Connect ile müşteri girişi.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (2, 'Çalışan SSO', 'rest-api', 5, 1, NULL, 'real-time', 'Token''lar, çalışan bilgileri', 'OpenID Connect ile çalışan girişi.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (3, 'Token doğrulama', 'rest-api', 12, 1, NULL, 'real-time', 'Token geçerliliği', 'Her istekte bearer token''ları doğrular.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (4, 'Hesap yaşam döngüsü olayları', 'kafka', 1, 3, NULL, 'near-real-time', 'Hesap oluşturuldu, şifre sıfırlandı, MFA kaydı yapıldı', 'Doğrulama ve güvenlik bildirimlerini tetikler.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (5, 'E-posta gönderimi', 'rest-api', 3, NULL, 'E-posta gönderim sağlayıcısı', 'real-time', 'Oluşturulmuş e-posta mesajları', 'Giden işlemsel e-posta.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (6, 'SMS gönderimi', 'rest-api', 3, NULL, 'SMS toplayıcı', 'real-time', 'SMS metni ve alıcı numarası', 'Kodlar ve uyarılar için giden SMS.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (7, 'Mobil anlık bildirim gönderimi', 'rest-api', 3, NULL, 'Mobil anlık bildirim servisi', 'real-time', 'Anlık bildirim içerikleri', 'Mobil uygulamaya anlık bildirimler.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (8, 'Ödeme provizyon API''si', 'rest-api', 6, 2, NULL, 'real-time', 'Ödeme niyeti, token, tutar', 'Ödeme adımında provizyon ve tahsilat.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (9, 'Kart üye işyeri bankası bağlantısı', 'soap', 2, NULL, 'Kart üye işyeri bankası', 'real-time', 'Provizyon istekleri', 'Üye işyeri bankasına SOAP köprüsü üzerinden ISO 8583.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (10, 'Mutabakat dosyası aktarımı', 'file-transfer', 2, 7, NULL, 'daily', 'Mutabakatı yapılmış işlemler', 'Günlük mutabakat dosyalarının SFTP ile bırakılması.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (11, 'Ödeme olayları akışı', 'kafka', 2, 11, NULL, 'near-real-time', 'Ödeme durum olayları (tokenize)', 'Gelir analitiği beslemesi.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (12, 'Sipariş olayları akışı', 'kafka', 6, 11, NULL, 'near-real-time', 'Sipariş yaşam döngüsü olayları', 'Satış analitiği beslemesi.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (13, 'Sipariş bildirim kuyruğu', 'rabbitmq', 6, 3, NULL, 'near-real-time', 'Sipariş onay içerikleri', 'Asenkron sipariş onay mesajları.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (14, 'Ekip müsaitlik API''si', 'rest-api', 8, 9, NULL, 'real-time', 'Ekip müsaitliği, öneriler', 'Aksaklık yönetimi için anlık ekip verisi.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (15, 'Aksaklık uyarıları', 'event', 8, 3, NULL, 'real-time', 'Uyarı içerikleri', 'Ekiplere ve nöbetçi yöneticilere uyarılar.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (16, 'Çalışan ana veri aktarımı', 'batch', 17, 5, NULL, 'daily', 'Çalışanlar, pozisyonlar, yöneticiler', 'Gece çalışan veri senkronizasyonu.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8),
  (17, 'Genel muhasebe kaydı', 'file-transfer', 7, NULL, 'Kurumsal ERP defteri', 'daily', 'Yevmiye kayıtları', 'Mutabakatı yapılmış yevmiyeleri deftere işler.', '2025-03-01T09:00:00Z', 8, '2026-08-15T14:30:00Z', 8, '2026-08-15T10:00:00Z', 8);

INSERT INTO risks (id, title, description, category, probability, impact, severity, status, owner_person_id, mitigation_plan, due_date, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'Ödeme defteri veritabanı desteği bitmiş sürümde', 'Ödeme defteri, genişletilmiş desteği sona ermiş Oracle 12c üzerinde çalışıyor. Artık güvenlik yaması yayımlanmıyor.', 'security', 'medium', 'high', 'high', 'open', 13, 'Ödeme Platformu Modernizasyonu projesi kapsamında Oracle 19c''ye geçmek; o zamana kadar telafi edici ağ kontrolleri.', '2027-02-28', '2025-10-02T09:00:00Z', 13, '2026-09-10T14:30:00Z', 13, '2026-09-10T10:00:00Z', 13),
  (2, 'Tek kart üye işyeri bankası', 'Tüm kart trafiği tek bir üye işyeri bankasına bağlı; bankadaki bir kesinti kartlı satışları durdurur.', 'operational', 'low', 'high', 'high', 'mitigated', 14, 'İkinci üye işyeri bankasıyla sözleşme yapıldı; adaptör sertifikasyonda.', '2026-11-30', '2025-06-11T09:00:00Z', 14, '2026-08-20T14:30:00Z', 14, '2026-08-20T10:00:00Z', 14),
  (3, 'Kimlik platformu tek bölgede aktif', 'Bölgesel bir bulut kesintisi, felaket kurtarma geçişi tamamlanana kadar tüm kanallarda girişi durdurur.', 'technical', 'low', 'high', 'critical', 'monitoring', 10, 'Üç ayda bir geçiş testleriyle sıcak yedek felaket kurtarma; 2027''de aktif-aktif yapıyı değerlendirmek.', NULL, '2025-12-01T09:00:00Z', 10, '2026-07-14T14:30:00Z', 10, '2026-07-14T10:00:00Z', 10),
  (4, 'Doğrulama tedarikçisi teslim gecikmeleri', 'Kimlik doğrulama tedarikçisi iki API teslim tarihini kaçırdı.', 'vendor', 'high', 'medium', 'high', 'open', 24, 'Haftalık tedarikçi yönlendirme toplantısı; Ekim sonuna kadar yedek tedarikçiyi değerlendirmek.', '2026-10-31', '2026-08-29T09:00:00Z', 24, '2026-09-22T14:30:00Z', 24, '2026-09-22T10:00:00Z', 24),
  (5, 'Eski Rezervasyon Konsolu''nun teknik sahibi yok', 'Konsoldan sorumlu bir mühendis yok; düzeltmeler tek bir destek mühendisine bağlı.', 'operational', 'high', 'medium', 'medium', 'open', 2, 'Emekliye ayrılana kadar E-Ticaret Mühendisliği''nden bir sahip atamak.', '2026-10-15', '2026-06-02T09:00:00Z', 24, '2026-09-08T14:30:00Z', 24, '2026-09-08T10:00:00Z', 24),
  (6, 'Ekip motoru bilgisi iki kişide toplanmış', 'Optimizasyon kurallarını ve Oracle ayarlarını yalnızca iki mühendis biliyor.', 'operational', 'medium', 'high', 'critical', 'open', 16, 'Eşli çalışma planı, dokümantasyon sprinti ve harici Oracle destek sözleşmesi.', '2026-12-31', '2026-04-20T09:00:00Z', 16, '2026-09-24T14:30:00Z', 16, '2026-09-24T10:00:00Z', 16),
  (7, 'Artan SMS gönderim maliyetleri', 'SMS hacmindeki artış anlaşılan kademeyi aşıyor ve birim maliyeti yükseltiyor.', 'financial', 'high', 'low', 'low', 'accepted', 9, 'Sağlayıcı konsolidasyonu yeniden başlayana kadar kabul edildi.', NULL, '2026-05-10T09:00:00Z', 9, '2026-08-01T14:30:00Z', 9, '2026-08-01T10:00:00Z', 9),
  (8, 'Finans Platformu kullanımdan kalkan IBM MQ''ya bağımlı', 'IBM MQ 9.1 teknoloji kataloğunda kullanımdan kalkıyor olarak işaretli ve lisans yenilemesi 2027''de.', 'technical', 'medium', 'medium', 'medium', 'open', 15, 'Kafka geçişini 2027 yol haritasına almak.', '2027-06-30', '2026-01-15T09:00:00Z', 15, '2026-01-15T14:30:00Z', 15, '2026-01-15T10:00:00Z', 15),
  (9, 'Sertifika yenilemesi elle yapılıyor', '', 'operational', 'medium', 'high', 'high', 'mitigated', 8, '', NULL, '2025-11-03T09:00:00Z', 8, '2025-11-03T14:30:00Z', 8, NULL, NULL),
  (10, 'Rapor sunucusunda tek disk', '', 'operational', 'low', 'medium', 'medium', 'closed', 17, '', NULL, '2025-12-08T09:00:00Z', 17, '2025-12-08T14:30:00Z', 17, NULL, NULL),
  (11, 'Mobil SDK sürümü desteği bitiyor', '', 'operational', 'high', 'low', 'medium', 'open', 20, '', NULL, '2026-02-10T09:00:00Z', 20, '2026-02-10T14:30:00Z', 20, NULL, NULL),
  (12, 'Veri ambarı kapasitesi sınırda', '', 'operational', 'high', 'high', 'high', 'open', 18, '', NULL, '2026-03-16T09:00:00Z', 18, '2026-03-16T14:30:00Z', 18, NULL, NULL),
  (13, 'Sadakat kampanya kuralları belgelenmemiş', '', 'operational', 'medium', 'low', 'low', 'accepted', 21, '', NULL, '2026-04-27T09:00:00Z', 21, '2026-04-27T14:30:00Z', 21, NULL, NULL),
  (14, 'Ödeme iade süreci tek kişiye bağlı', '', 'operational', 'medium', 'high', 'high', 'monitoring', 13, '', NULL, '2026-07-21T09:00:00Z', 13, '2026-07-21T14:30:00Z', 13, NULL, NULL),
  (15, 'Doküman platformunda yedek testi yapılmıyor', '', 'operational', 'medium', 'medium', 'medium', 'open', 23, '', NULL, '2026-09-01T09:00:00Z', 23, '2026-09-01T14:30:00Z', 23, NULL, NULL);

INSERT INTO escalations (id, title, description, severity, status, owner_person_id, responsible_team_id, raised_by_person_id, raised_at, target_resolution_date, resolution, resolved_on, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'Çizelge değişiklikleri Uçuş Operasyon Portalı''na ulaşmıyor', 'Ekip motorunda yapılan yeniden atamalar portalda 40 dakikaya varan gecikmeyle görünüyor.', 'critical', 'open', 17, 5, 4, '2026-09-23T06:40:00Z', '2026-09-30', NULL, NULL, '2026-09-23T09:00:00Z', 17, '2026-09-25T14:30:00Z', 17, NULL, NULL),
  (2, 'Doğrulama tedarikçisi konusunun üst yönetim sponsoruna eskalasyonu', 'Tedarikçinin tekrarlanan gecikmeleri Aralık''taki canlıya geçişi tehdit ediyor.', 'high', 'in-progress', 2, 1, 24, '2026-09-02T12:00:00Z', '2026-10-15', NULL, NULL, '2026-09-02T09:00:00Z', 24, '2026-09-20T14:30:00Z', 24, NULL, NULL),
  (3, 'SMS doğrulama kodları gecikiyor', 'Müşteriler doğrulama kodlarının süresi dolduktan sonra geldiğini bildiriyor.', 'high', 'in-progress', 9, 1, 27, '2026-09-22T08:15:00Z', '2026-09-29', NULL, NULL, '2026-09-22T09:00:00Z', 27, '2026-09-25T14:30:00Z', 27, NULL, NULL),
  (4, '3 Ağustos mutabakat toplamlarında uyuşmazlık', 'Mutabakat dosyası toplamları üye işyeri bankası raporlarıyla eşleşmedi.', 'high', 'closed', 13, 2, 3, '2026-08-04T09:00:00Z', '2026-08-08', 'Mutabakat işindeki saat dilimi kesim hatası düzeltildi ve dosyalar yeniden üretildi.', '2026-08-07', '2026-08-04T09:00:00Z', 13, '2026-08-07T14:30:00Z', 13, NULL, NULL),
  (5, 'Mobil uygulamada giriş hataları', '', 'critical', 'closed', 9, 1, 27, '2025-10-06T08:30:00Z', NULL, 'Token imzalama anahtarı rotasyonu geri alındı.', '2025-10-07', '2025-10-06T09:00:00Z', 9, '2025-10-07T14:30:00Z', 9, NULL, NULL),
  (6, 'Fatura PDF üretimi zaman aşımına uğruyor', '', 'medium', 'closed', 17, 7, 27, '2025-10-21T08:30:00Z', NULL, 'Rapor sunucusu belleği artırıldı.', '2025-10-30', '2025-10-21T09:00:00Z', 17, '2025-10-30T14:30:00Z', 17, NULL, NULL),
  (7, 'Kampanya e-postaları iki kez gönderildi', '', 'high', 'closed', 9, 1, 27, '2025-11-12T08:30:00Z', NULL, 'Tekrarlanan tüketici grubu kapatıldı.', '2025-11-13', '2025-11-12T09:00:00Z', 9, '2025-11-13T14:30:00Z', 9, NULL, NULL),
  (8, 'Sipariş durumları portalda güncellenmiyor', '', 'high', 'closed', 12, 4, 27, '2025-11-26T08:30:00Z', NULL, 'Olay kuyruğundaki tıkanan bölüm yeniden dengelendi.', '2025-12-03', '2025-11-26T09:00:00Z', 12, '2025-12-03T14:30:00Z', 12, NULL, NULL),
  (9, 'Kart ödemelerinde 3D Secure kesintisi', '', 'critical', 'closed', 13, 2, 27, '2025-12-15T08:30:00Z', NULL, 'Yedek sağlayıcıya geçildi; sağlayıcı sorunu giderdi.', '2025-12-15', '2025-12-15T09:00:00Z', 13, '2025-12-15T14:30:00Z', 13, NULL, NULL),
  (10, 'Yılsonu kapanış raporları gecikti', '', 'medium', 'closed', 17, 7, 27, '2026-01-05T08:30:00Z', NULL, 'Toplu işler yeniden sıralandı.', '2026-01-09', '2026-01-05T09:00:00Z', 17, '2026-01-09T14:30:00Z', 17, NULL, NULL),
  (11, 'Ekip planlama motorunda performans düşüşü', '', 'high', 'closed', 4, 5, 27, '2026-01-27T08:30:00Z', NULL, 'Yavaş sorgu için indeks eklendi.', '2026-02-06', '2026-01-27T09:00:00Z', 4, '2026-02-06T14:30:00Z', 4, NULL, NULL),
  (12, 'API Geçidi sertifika süresi doldu', '', 'critical', 'closed', 8, 9, 27, '2026-02-18T08:30:00Z', NULL, 'Sertifika yenilendi; otomatik yenileme alarmı eklendi.', '2026-02-18', '2026-02-18T09:00:00Z', 8, '2026-02-18T14:30:00Z', 8, NULL, NULL),
  (13, 'Masraf onayları e-postası gitmiyor', '', 'low', 'closed', 23, 8, 27, '2026-03-09T08:30:00Z', NULL, 'SMTP yönlendirme kuralı düzeltildi.', '2026-03-20', '2026-03-09T09:00:00Z', 23, '2026-03-20T14:30:00Z', 23, NULL, NULL),
  (14, 'Sadakat puanları yanlış hesaplanıyor', '', 'high', 'closed', 21, 4, 27, '2026-04-02T08:30:00Z', NULL, 'Kampanya çarpanı kuralı düzeltildi, puanlar yeniden hesaplandı.', '2026-04-10', '2026-04-02T09:00:00Z', 21, '2026-04-10T14:30:00Z', 21, NULL, NULL),
  (15, 'Portal ana sayfası yavaş açılıyor', '', 'medium', 'closed', 20, 3, 27, '2026-04-23T08:30:00Z', NULL, 'CDN önbellek kuralları güncellendi.', '2026-05-05', '2026-04-23T09:00:00Z', 20, '2026-05-05T14:30:00Z', 20, NULL, NULL),
  (16, 'Veri platformunda gecelik yükleme başarısız', '', 'high', 'closed', 18, 6, 27, '2026-05-19T08:30:00Z', NULL, 'Kaynak şema değişikliğine uyum sağlandı.', '2026-05-21', '2026-05-19T09:00:00Z', 18, '2026-05-21T14:30:00Z', 18, NULL, NULL),
  (17, 'Doküman yükleme limit hatası', '', 'low', 'closed', 23, 8, 27, '2026-06-08T08:30:00Z', NULL, 'Yükleme limiti yapılandırması güncellendi.', '2026-06-25', '2026-06-08T09:00:00Z', 23, '2026-06-25T14:30:00Z', 23, NULL, NULL),
  (18, 'Uçuş portalında harita katmanı yüklenmiyor', '', 'medium', 'closed', 17, 5, 27, '2026-06-29T08:30:00Z', NULL, 'Harita sağlayıcısı API anahtarı yenilendi (kasada).', '2026-07-03', '2026-06-29T09:00:00Z', 17, '2026-07-03T14:30:00Z', 17, NULL, NULL),
  (19, 'Ödeme iadelerinde gecikme', '', 'high', 'closed', 13, 2, 27, '2026-07-14T08:30:00Z', NULL, 'İade kuyruğu tüketici sayısı artırıldı.', '2026-07-24', '2026-07-14T09:00:00Z', 13, '2026-07-24T14:30:00Z', 13, NULL, NULL),
  (20, 'Kimlik doğrulamada aralıklı 502 hataları', '', 'critical', 'closed', 9, 1, 27, '2026-08-18T08:30:00Z', NULL, 'Yük dengeleyici sağlık kontrolü zaman aşımı düzeltildi.', '2026-08-19', '2026-08-18T09:00:00Z', 9, '2026-08-19T14:30:00Z', 9, NULL, NULL),
  (21, 'Masraf mobil uygulaması çöküyor', '', 'medium', 'closed', 23, 8, 27, '2026-09-08T08:30:00Z', NULL, 'Hatalı sürüm geri çekildi.', '2026-09-16', '2026-09-08T09:00:00Z', 23, '2026-09-16T14:30:00Z', 23, NULL, NULL);

INSERT INTO decisions (id, title, context, decision, rationale, alternatives, consequences, decision_date, status, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'Tüm girişler için standart OpenID Connect', 'Kanallar SAML, özel token''lar ve oturum çerezlerinin karışımını kullanıyordu.', 'Tüm müşteri ve çalışan uygulamaları OpenID Connect ile CIP üzerinden kimlik doğrular.', 'Tek protokol, olgun kütüphaneler, MFA ve mobil desteği.', ARRAY['İç uygulamalarda SAML''ı korumak', 'Kanal başına kimlik depoları']::text[], 'Eski uygulamalar bir adaptör gerektirir ya da emekliye ayrılmalıdır.', '2025-03-12', 'accepted', '2025-03-12T09:00:00Z', 6, '2025-03-12T14:30:00Z', 6, '2026-03-01T10:00:00Z', 6),
  (2, 'Ödeme durum değişikliklerini Kafka olayları olarak yayımlamak', 'Alt sistemler ödeme veritabanını sorguluyordu.', 'Ödeme Geçidi tokenize edilmiş ödeme olaylarını Kafka''ya yayımlar.', 'Tüketicileri ayrıştırır ve defterdeki okuma yükünü kaldırır.', ARRAY['Defter üzerinde değişiklik verisi yakalama (CDC)', 'REST webhook''ları']::text[], 'Tüketiciler en az bir kez teslimi ele almalıdır.', '2025-11-04', 'accepted', '2025-11-04T09:00:00Z', 13, '2025-11-04T14:30:00Z', 13, '2026-05-01T10:00:00Z', 13),
  (3, 'Bildirim alımını RabbitMQ''dan Kafka''ya taşımak', 'Bildirim alımı için iki ayrı mesaj aracısı işletiliyor.', 'Öneri: tüm üreticiler bildirim isteklerini Kafka''ya yayımlar.', 'Tercih edilen mesajlaşma teknolojisinde standartlaşmak.', ARRAY['Düşük gecikmeli kanallar için RabbitMQ''yu korumak']::text[], 'OMS ve Uçuş Operasyon Portalı''nda üretici değişiklikleri.', '2026-06-18', 'proposed', '2026-06-18T09:00:00Z', 8, '2026-06-18T14:30:00Z', 8, NULL, NULL),
  (4, 'Eski Rezervasyon Konsolu''nu 2027 2. çeyreğine kadar emekliye ayırmak', 'Konsol, sahibi olmayan emekli çatılar üzerinde çalışıyor.', 'Kalan temsilci işlevlerini OMS API''leri üzerinde yeniden geliştirmek ve konsolu Haziran 2027''ye kadar kapatmak.', 'İyileştirme maliyeti yeniden geliştirme maliyetini aşıyor; güvenlik açığı büyüyor.', ARRAY['Çatıları yerinde güncellemek', 'Hazır bir çağrı merkezi paketi satın almak']::text[], 'Çağrı merkezi eğitimi gerekli.', '2026-05-20', 'accepted', '2026-05-20T09:00:00Z', 6, '2026-05-20T14:30:00Z', 6, NULL, NULL),
  (5, 'Gözlemlenebilirlik için OpenTelemetry standardı', '', 'Gözlemlenebilirlik için OpenTelemetry standardı', '', '{}'::text[], '', '2025-10-14', 'accepted', '2025-10-14T09:00:00Z', 6, '2025-10-14T14:30:00Z', 6, NULL, NULL),
  (6, 'Bulut maliyet etiketleme zorunluluğu', '', 'Bulut maliyet etiketleme zorunluluğu', '', '{}'::text[], '', '2025-12-02', 'accepted', '2025-12-02T09:00:00Z', 1, '2025-12-02T14:30:00Z', 1, NULL, NULL),
  (7, 'Mobil uygulama için ortak tasarım sistemi', '', 'Mobil uygulama için ortak tasarım sistemi', '', '{}'::text[], '', '2026-01-19', 'accepted', '2026-01-19T09:00:00Z', 11, '2026-01-19T14:30:00Z', 11, NULL, NULL),
  (8, 'Ödeme sağlayıcısı yönlendirmesinde aktif-aktif yapı', '', 'Ödeme sağlayıcısı yönlendirmesinde aktif-aktif yapı', '', '{}'::text[], '', '2026-03-03', 'accepted', '2026-03-03T09:00:00Z', 13, '2026-03-03T14:30:00Z', 13, NULL, NULL),
  (9, 'Veri ambarı için sütunlu depolama', '', 'Veri ambarı için sütunlu depolama', '', '{}'::text[], '', '2026-04-14', 'superseded', '2026-04-14T09:00:00Z', 18, '2026-04-14T14:30:00Z', 18, NULL, NULL),
  (10, 'Sadakat motorunda olay tabanlı puan hesaplama', '', 'Sadakat motorunda olay tabanlı puan hesaplama', '', '{}'::text[], '', '2026-07-08', 'accepted', '2026-07-08T09:00:00Z', 21, '2026-07-08T14:30:00Z', 21, NULL, NULL),
  (11, 'Eski rezervasyon verilerinin arşiv stratejisi', '', 'Eski rezervasyon verilerinin arşiv stratejisi', '', '{}'::text[], '', '2026-09-10', 'proposed', '2026-09-10T09:00:00Z', 24, '2026-09-10T14:30:00Z', 24, NULL, NULL);

INSERT INTO decision_makers (decision_id, person_id) VALUES
  (1, 6),
  (1, 7),
  (2, 13),
  (2, 8),
  (3, 8),
  (4, 2),
  (4, 6),
  (5, 6),
  (6, 1),
  (7, 11),
  (8, 13),
  (9, 18),
  (10, 21),
  (11, 24);

INSERT INTO risk_applications (risk_id, application_id) VALUES
  (1, 2),
  (2, 2),
  (3, 1),
  (4, 1),
  (4, 4),
  (5, 14),
  (6, 9),
  (7, 3),
  (8, 7),
  (9, 12),
  (10, 7),
  (11, 4),
  (12, 11),
  (13, 13),
  (14, 2),
  (15, 10);

INSERT INTO risk_projects (risk_id, project_id) VALUES
  (1, 2),
  (2, 2),
  (4, 1),
  (5, 4),
  (6, 5),
  (7, 8);

INSERT INTO escalation_applications (escalation_id, application_id) VALUES
  (1, 8),
  (1, 9),
  (2, 1),
  (3, 3),
  (3, 1),
  (4, 2),
  (4, 7),
  (5, 1),
  (6, 7),
  (7, 3),
  (8, 6),
  (9, 2),
  (10, 7),
  (11, 9),
  (12, 12),
  (13, 15),
  (14, 13),
  (15, 4),
  (16, 11),
  (17, 10),
  (18, 8),
  (19, 2),
  (20, 1),
  (21, 15);

INSERT INTO escalation_projects (escalation_id, project_id) VALUES
  (1, 5),
  (2, 1),
  (3, 8);

INSERT INTO decision_applications (decision_id, application_id) VALUES
  (1, 1),
  (1, 4),
  (1, 5),
  (2, 2),
  (2, 11),
  (3, 3),
  (3, 6),
  (4, 14),
  (4, 6);

INSERT INTO decision_projects (decision_id, project_id) VALUES
  (1, 7),
  (2, 2),
  (3, 8),
  (4, 4),
  (7, 1),
  (8, 2),
  (10, 3),
  (11, 4);

INSERT INTO application_runbooks (id, application_id, summary, last_verified_on, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 2, 'Ödeme alınamıyor, ödeme süreleri uzadı veya banka/kart sağlayıcısı hata dönüyorsa bu rehberi kullanın. Sağlıklı durumda başarılı ödeme oranı %97 üzeri, p95 yanıt süresi 800 ms altıdır.', '2026-08-14', '2026-03-02T09:00:00Z', 13, '2026-08-14T14:30:00Z', 13, '2026-08-14T10:00:00Z', 13),
  (2, 12, 'Dış veya iç API çağrıları hata veriyor, gecikiyor ya da yetkilendirme reddediliyorsa bu rehberi kullanın. API Geçidi tüm dijital kanalların ortak giriş noktasıdır; kesinti geniş etki yaratır.', '2026-01-20', '2025-11-10T09:00:00Z', 8, '2026-01-20T14:30:00Z', 8, '2026-01-20T10:00:00Z', 8);

INSERT INTO runbook_scenarios (id, runbook_id, position, title, symptoms) VALUES
  (1, 1, 0, 'Kart sağlayıcısı zaman aşımı veriyor', 'Panoda "PROVIDER_TIMEOUT" hatası artıyor, belirli bir sağlayıcıda başarı oranı düşüyor.'),
  (2, 1, 1, '3D Secure doğrulamaları başarısız', 'Kullanıcılar doğrulama ekranında takılıyor, loglarda "3DS_FAILED" artışı var.'),
  (3, 1, 2, 'Dağıtım sonrası 5xx artışı', 'Dağıtımdan hemen sonra 5xx oranı %1 üzerine çıkıyor.'),
  (4, 2, 0, 'Hız sınırı (429) artışı', 'İstemciler 429 Too Many Requests alıyor; tek bir istemcide yoğunlaşıyor olabilir.'),
  (5, 2, 1, 'Sertifika süresi doldu', 'Tüm istemcilerde TLS el sıkışma hataları.');

INSERT INTO runbook_steps (id, runbook_id, scenario_id, position, text) VALUES
  (1, 1, NULL, 0, 'Durum sayfasında ve #payments-incident kanalında devam eden bir olay olup olmadığına bakın; varsa o olaya katılın.'),
  (2, 1, NULL, 1, 'Ödeme Geçidi panosunda başarılı ödeme oranı, p95 yanıt süresi ve 5xx oranını kontrol edin. Sorun tek bir sağlayıcıda mı, tüm ödemelerde mi?'),
  (3, 1, NULL, 2, 'Son 2 saatteki dağıtımları kontrol edin. Sorun dağıtımla başladıysa geri alma (rollback) kararı için teknik sahibe haber verin.'),
  (4, 1, NULL, 3, 'Sağlayıcı durum sayfalarına bakın (kart işlemcisi, 3D Secure). Sağlayıcı kaynaklıysa yedek sağlayıcıya geçiş senaryosunu uygulayın.'),
  (5, 1, NULL, 4, '15 dakika içinde kök neden bulunamadıysa 2. seviye eskalasyonu başlatın ve olay kaydı açın.'),
  (6, 1, 1, 0, 'Sağlayıcının durum sayfasından kesinti olup olmadığını doğrulayın.'),
  (7, 1, 1, 1, 'Sağlayıcı yönlendirme ayarlarından trafiği yedek sağlayıcıya %100 yönlendirin.'),
  (8, 1, 1, 2, 'Başarı oranının 5 dakika içinde toparlandığını panodan doğrulayın.'),
  (9, 1, 1, 3, 'Sağlayıcı düzelince trafiği kademeli olarak (%25 → %50 → %100) geri alın.'),
  (10, 1, 2, 0, 'Sorunun tek bir banka mı tüm bankalar mı olduğunu loglardan ayırın.'),
  (11, 1, 2, 1, 'Tek bankaysa bankanın durum sayfasını kontrol edip müşteri hizmetlerine bilgi notu geçin.'),
  (12, 1, 2, 2, 'Tüm bankalardaysa son dağıtımı ve 3DS sertifika geçerlilik tarihini kontrol edin; teknik sahibi arayın.'),
  (13, 1, 3, 0, 'Dağıtım hattından son sürümü geri alın (rollback).'),
  (14, 1, 3, 1, '#payments-eng kanalına sürüm numarası ve hata örnekleriyle bilgi verin.'),
  (15, 1, 3, 2, 'Geri alma sonrası hata oranının normale döndüğünü doğrulayın ve olay kaydını güncelleyin.'),
  (16, 2, NULL, 0, 'Hangi rotaların etkilendiğini API Geçidi panosundan belirleyin: tüm trafik mi, tek bir arka uç mu?'),
  (17, 2, NULL, 1, 'Tek bir arka uçsa o uygulamanın müdahale rehberine geçin ve sahibine haber verin.'),
  (18, 2, NULL, 2, 'Tüm trafikse geçit pod sayısını, CPU/bellek kullanımını ve hız sınırı (rate limit) red oranını kontrol edin.'),
  (19, 2, NULL, 3, 'Son yapılandırma değişikliklerini (rota, sertifika, rate limit) kontrol edin; şüpheli değişikliği geri alın.'),
  (20, 2, 4, 0, 'Panoda 429 dönen istemci anahtarını (client id) bulun.'),
  (21, 2, 4, 1, 'Trafik beklenen bir kampanyadan geliyorsa geçici kota artışını teknik sahiple onaylayın.'),
  (22, 2, 4, 2, 'Beklenmeyen trafikse istemci sahibine haber verin; gerekirse istemciyi geçici olarak engelleyin.'),
  (23, 2, 5, 0, 'Sertifika bitiş tarihini sağlık kontrolü çıktısından doğrulayın.'),
  (24, 2, 5, 1, 'Platform ekibinden yenilenmiş sertifikanın dağıtımını isteyin (#platform-engineering).');

INSERT INTO runbook_links (id, runbook_id, position, type, label, url, note) VALUES
  (1, 1, 0, 'dashboard', 'Ödeme Geçidi panosu', 'https://grafana.corp.example/d/payments-gateway', 'Başarılı ödeme oranı < %97 veya p95 > 800 ms ise sorun var.'),
  (2, 1, 1, 'logs', 'Uygulama logları (canlı)', 'https://logs.corp.example/app/payments-gateway?env=production', '"PROVIDER_TIMEOUT" ve "3DS_FAILED" hatalarına filtreleyin.'),
  (3, 1, 2, 'health-check', 'Sağlık kontrolü', 'https://payments.corp.example/health', '"status": "UP" ve tüm sağlayıcılar "available" olmalı.'),
  (4, 1, 3, 'alerting', 'Alarm kuralları', 'https://alerts.corp.example/rules?service=payments-gateway', ''),
  (5, 1, 4, 'status-page', 'Kart işlemcisi durum sayfası', 'https://status.cardprocessor.example', 'Sağlayıcı kaynaklı kesintileri buradan doğrulayın.'),
  (6, 1, 5, 'console', 'Sağlayıcı yönlendirme ayarları', 'https://payments-admin.corp.example/routing', 'Yedek sağlayıcıya geçiş buradan yapılır (yetki gerekir).'),
  (7, 2, 0, 'dashboard', 'API Geçidi trafik panosu', 'https://grafana.corp.example/d/api-gateway', 'Rota bazında 4xx/5xx ve gecikme.'),
  (8, 2, 1, 'logs', 'Erişim logları', 'https://logs.corp.example/app/api-gateway?env=production', ''),
  (9, 2, 2, 'health-check', 'Geçit sağlık kontrolü', 'https://api.corp.example/_health', ''),
  (10, 2, 3, 'monitoring', 'Kubernetes iş yükü', 'https://k8s.corp.example/ns/api-gateway/workloads', 'Pod yeniden başlatma sayısına bakın.');

INSERT INTO runbook_contacts (id, runbook_id, position, label, person_id, team_id, channel, "when") VALUES
  (1, 1, 0, '1. seviye — uygulama destek nöbetçisi', NULL, 10, 'Nöbet hattı: dahili 4410 · #app-support', 'Hemen'),
  (2, 1, 1, '2. seviye — ödeme mühendisliği nöbetçisi', NULL, 2, '#payments-eng · nöbet çağrısı: payments-oncall', '15 dakikada çözülmezse'),
  (3, 1, 2, 'Teknik sahip', 13, NULL, 'Telefon: dahili 4421', 'Geri alma veya sağlayıcı değişikliği kararı için'),
  (4, 1, 3, 'İş sahibi', 3, NULL, 'E-posta ve telefon', 'Kesinti 30 dakikayı geçerse bilgilendirin'),
  (5, 2, 0, '1. seviye — uygulama destek nöbetçisi', NULL, 10, 'Nöbet hattı: dahili 4410 · #app-support', 'Hemen'),
  (6, 2, 1, '2. seviye — entegrasyon servisleri', NULL, 9, '#integration · nöbet çağrısı: integration-oncall', '15 dakikada çözülmezse'),
  (7, 2, 2, 'Teknik sahip', 8, NULL, 'Telefon: dahili 4433', 'Yapılandırma geri alma kararı için');

INSERT INTO leave_records (id, person_id, type, start_date, end_date, note, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 1, 'annual', '2026-10-19', '2026-10-23', 'Yurt dışı', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (2, 1, 'training', '2026-11-17', '2026-11-18', 'Mimari zirvesi, Berlin', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (3, 2, 'annual', '2026-09-21', '2026-10-02', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (4, 2, 'excuse', '2026-11-06', '2026-11-06', 'Taşınma', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (5, 3, 'annual', '2026-10-05', '2026-10-09', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (6, 3, 'annual', '2026-12-21', '2027-01-01', 'Yılbaşı', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (7, 4, 'sick', '2026-09-24', '2026-09-29', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (8, 4, 'annual', '2026-11-02', '2026-11-13', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (9, 5, 'training', '2026-10-12', '2026-10-14', 'İK teknolojileri eğitimi', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (10, 6, 'annual', '2026-09-28', '2026-10-09', 'Aile ziyareti', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (11, 6, 'training', '2026-11-24', '2026-11-26', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (12, 7, 'annual', '2026-10-26', '2026-10-30', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (13, 8, 'excuse', '2026-10-01', '2026-10-01', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (14, 8, 'annual', '2026-11-09', '2026-11-20', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (15, 9, 'annual', '2026-08-24', '2026-09-04', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (16, 9, 'training', '2026-10-15', '2026-10-16', 'KubeCon hazırlık atölyesi', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (17, 10, 'annual', '2026-10-05', '2026-10-16', 'İsveç', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (18, 11, 'sick', '2026-10-07', '2026-10-08', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (19, 11, 'annual', '2026-12-14', '2026-12-24', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (20, 12, 'annual', '2026-09-30', '2026-10-06', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (21, 13, 'annual', '2026-10-28', '2026-11-03', 'Cumhuriyet Bayramı köprüsü', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (22, 14, 'unpaid', '2026-11-16', '2026-11-27', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (23, 15, 'annual', '2026-10-12', '2026-10-23', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (24, 16, 'excuse', '2026-10-08', '2026-10-09', 'Evlilik', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (25, 17, 'annual', '2026-09-14', '2026-09-25', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (26, 17, 'training', '2026-10-21', '2026-10-21', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (27, 18, 'annual', '2026-10-01', '2026-10-13', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (28, 19, 'sick', '2026-09-28', '2026-09-28', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (29, 19, 'annual', '2026-11-30', '2026-12-04', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (30, 20, 'annual', '2026-10-19', '2026-10-30', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (31, 21, 'training', '2026-10-06', '2026-10-07', 'Ödeme sistemleri konferansı', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (32, 22, 'annual', '2026-11-02', '2026-11-06', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (33, 23, 'annual', '2026-09-29', '2026-10-02', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (34, 24, 'annual', '2026-10-26', '2026-11-06', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (35, 25, 'excuse', '2026-10-14', '2026-10-14', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL),
  (36, 27, 'annual', '2026-12-28', '2027-01-08', '', '2026-08-15T09:00:00Z', 8, '2026-09-10T14:30:00Z', 8, NULL, NULL);

INSERT INTO resource_allocations (id, person_id, project_id, role, start_date, end_date, percent, note, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 24, 1, 'project-manager', '2026-02-16', '2026-12-18', 50, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (2, 26, 1, 'analyst-lead', '2026-02-16', '2026-10-30', 60, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (3, 10, 1, 'technical-lead', '2026-03-02', '2026-12-18', 70, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (4, 11, 1, 'product-owner', '2026-02-16', '2026-12-18', 40, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (5, 20, 1, 'developer', '2026-04-06', '2026-12-11', 80, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (6, 19, 1, 'developer', '2026-06-01', '2026-11-27', 60, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (7, 25, 2, 'project-manager', '2026-01-05', '2027-03-31', 40, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (8, 13, 2, 'technical-lead', '2026-01-05', '2027-03-31', 80, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (9, 14, 2, 'product-owner', '2026-01-05', '2027-03-31', 50, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (10, 21, 2, 'developer', '2026-09-01', '2026-12-18', 40, 'Ödeme API geçişi', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (11, 16, 2, 'architect', '2026-01-05', '2026-06-30', 30, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (12, 25, 3, 'project-manager', '2026-02-01', '2027-01-29', 40, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (13, 21, 3, 'technical-lead', '2026-02-01', '2027-01-29', 70, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (14, 26, 3, 'analyst-lead', '2026-09-01', '2027-01-29', 50, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (15, 22, 3, 'product-owner', '2026-02-01', '2027-01-29', 30, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (16, 12, 3, 'developer', '2026-05-04', '2026-12-31', 60, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (17, 24, 4, 'project-manager', '2026-10-01', '2027-06-30', 40, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (18, 21, 4, 'technical-lead', '2026-11-02', '2027-06-30', 50, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (19, 23, 4, 'analyst', '2026-10-01', '2027-02-26', 50, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (20, 20, 4, 'developer', '2027-01-04', '2027-06-30', 80, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (21, 24, 5, 'project-manager', '2026-04-15', '2026-12-31', 30, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (22, 17, 5, 'technical-lead', '2026-04-15', '2026-12-31', 70, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (23, 6, 5, 'architect', '2026-04-15', '2026-11-30', 40, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (24, 15, 5, 'developer', '2026-06-01', '2026-12-31', 80, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (25, 18, 5, 'developer', '2026-08-03', '2026-10-30', 30, 'Veri yedekleme', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (26, 25, 6, 'project-manager', '2026-11-02', '2027-06-30', 30, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (27, 18, 6, 'technical-lead', '2026-11-02', '2027-06-30', 70, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (28, 26, 6, 'analyst', '2026-11-16', '2027-03-31', 30, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (29, 12, 6, 'developer', '2027-01-04', '2027-06-30', 60, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (30, 25, 7, 'project-manager', '2025-09-01', '2026-03-20', 30, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (31, 7, 7, 'technical-lead', '2025-09-01', '2026-03-20', 60, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (32, 25, 8, 'project-manager', '2026-05-18', '2026-12-11', 20, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (33, 8, 8, 'technical-lead', '2026-05-18', '2026-12-11', 50, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (34, 10, 8, 'developer', '2026-09-14', '2026-11-13', 40, 'Kafka entegrasyonu', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (35, 7, 8, 'architect', '2026-06-01', '2026-09-30', 20, '', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL);

INSERT INTO demands (id, title, type, business_unit_id, requester_person_id, sponsor_person_id, problem, proposed_solution, expected_benefits, urgency, desired_date, deadline_reason, regulatory, affected_users, estimated_budget, currency, status, submitted_at, business_value, strategic_fit, time_criticality, risk_reduction, effort, priority, assessor_person_id, planned_start, planned_end, decision_note, project_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'Sadakat programının mobil uygulamaya taşınması', 'new-project', 1, 2, 22, 'Mil kazanımı ve harcaması yalnızca web sitesinden yapılabiliyor; mobil kullanıcıların %60’ı programa hiç giriş yapmıyor.', 'Mobil uygulamada üyelik, mil bakiyesi, kazanım ve harcama akışları.', 'Aktif üye sayısında %25 artış, ek ürün satışından yıllık gelir.', 'high', '2026-06-30', 'Yaz sezonu kampanyası.', false, 1200000, 18000000, 'TRY', 'converted', '2025-11-10T09:00:00Z', 5, 5, 4, 2, 4, 'p1', 24, '2026-01-12', '2026-12-15', 'Sadakat Programı Lansmanı projesi olarak başladı.', 3, '2025-11-10T09:00:00Z', 2, '2026-01-12T14:30:00Z', 2, NULL, NULL),
  (2, 'Tüm çalışanlar için çok faktörlü kimlik doğrulama', 'compliance', 5, 7, 1, 'Çalışan hesaplarının bir kısmı yalnızca şifreyle korunuyor; denetim bulgusu var.', 'Tüm iç uygulamalarda kurumsal kimlik sağlayıcı üzerinden MFA.', 'Hesap ele geçirme riskinin azalması, denetim bulgusunun kapanması.', 'critical', '2026-09-30', 'Bilgi güvenliği denetimi kapanış tarihi.', true, 9000, NULL, 'TRY', 'converted', '2026-01-20T09:00:00Z', 3, 4, 5, 5, 3, 'p1', 24, '2026-02-16', '2026-11-30', 'Çalışan MFA Yaygınlaştırması projesi.', 7, '2026-01-20T09:00:00Z', 7, '2026-02-16T14:30:00Z', 7, NULL, NULL),
  (3, 'Biniş kartlarının Apple Wallet ve Google Wallet’a eklenmesi', 'enhancement', 1, 2, 2, 'Yolcular biniş kartını ekran görüntüsü olarak saklıyor; kapı değişikliği gibi güncellemeleri göremiyorlar.', 'Check-in sonrası cüzdana ekleme; kapı, saat ve koltuk değişikliklerinde otomatik güncelleme.', 'Kapıda yaşanan gecikmelerde azalma, çağrı merkezi aramalarında düşüş.', 'medium', '2027-03-31', '', false, 800000, 2500000, 'TRY', 'scheduled', '2026-06-02T09:00:00Z', 4, 4, 3, 1, 2, 'p2', 24, '2027-01-11', '2027-03-31', 'Dijital Deneyim ekibinin 2027 Ç1 planına alındı.', NULL, '2026-06-02T09:00:00Z', 2, '2026-08-20T14:30:00Z', 2, NULL, NULL),
  (4, 'e-Fatura ve e-Arşiv mevzuat değişikliğine uyum', 'compliance', 2, 3, 3, 'Yeni tebliğ ile fatura şemasında zorunlu alanlar değişiyor.', 'Finans platformunda fatura şablonları ve entegratör bağlantısının güncellenmesi.', 'Ceza riskinin ortadan kalkması.', 'critical', '2026-12-31', 'Tebliğ 1 Ocak 2027’de yürürlüğe giriyor.', true, NULL, 900000, 'TRY', 'scheduled', '2026-08-11T09:00:00Z', 2, 3, 5, 5, 2, 'p1', 24, '2026-10-12', '2026-12-18', 'Finans Sistemleri ekibi Ekim’de başlıyor.', NULL, '2026-08-11T09:00:00Z', 3, '2026-08-25T14:30:00Z', 3, NULL, NULL),
  (5, 'Masraf uygulamasında fişlerin fotoğraftan okunması', 'enhancement', 2, 15, NULL, 'Çalışanlar her fişi elle giriyor; ayda yaklaşık 6.000 fiş işleniyor.', 'Fotoğraftan tutar, tarih, KDV ve satıcı bilgisinin otomatik okunması.', 'Masraf girişinde fiş başına 3 dakika tasarruf, hatalı girişlerde azalma.', 'low', NULL, '', false, 4000, 600000, 'TRY', 'approved', '2026-05-19T09:00:00Z', 3, 2, 1, 1, 2, 'p3', 24, NULL, NULL, 'Kapasite açıldığında planlanacak.', NULL, '2026-05-19T09:00:00Z', 15, '2026-06-24T14:30:00Z', 15, NULL, NULL),
  (6, 'Uçuş ekibi yorgunluk riski raporlama paneli', 'reporting', 3, 4, 4, 'Ekip çizelgelerindeki yorgunluk riski elle hesaplanıyor; otoriteye raporlama bir haftayı buluyor.', 'Çizelge verisinden günlük yorgunluk skoru ve otorite raporu.', 'Raporlama süresinin bir günden kısa olması; emniyet riskinin erken görülmesi.', 'high', '2027-04-30', 'Sivil havacılık otoritesinin yeni raporlama döngüsü.', true, 150, NULL, 'TRY', 'in-review', '2026-09-08T09:00:00Z', 3, 4, 4, 4, 3, NULL, 24, NULL, NULL, '', NULL, '2026-09-08T09:00:00Z', 4, '2026-09-16T14:30:00Z', 4, NULL, NULL),
  (7, 'Bakım planlama sisteminin yenilenmesi', 'new-application', 3, 17, 4, 'Mevcut bakım planlama aracı üreticisi tarafından 2027 sonunda destekten çıkıyor.', 'Piyasa ürünü seçimi, veri taşıma ve uçuş operasyonlarıyla entegrasyon.', 'Destek dışı yazılım riskinin kapanması, planlama doğruluğu.', 'high', '2027-12-31', 'Üretici desteğinin bitişi.', false, NULL, 35000000, 'TRY', 'scheduled', '2026-04-14T09:00:00Z', 4, 4, 4, 5, 5, 'p2', 24, '2027-02-01', '2027-11-30', 'Ürün seçimi 2027 Ç1, uygulama Ç2–Ç4.', NULL, '2026-04-14T09:00:00Z', 17, '2026-07-01T14:30:00Z', 17, NULL, NULL),
  (8, 'Log yönetimi platformlarının tek platformda birleştirilmesi', 'infrastructure', 5, 27, 1, 'Üç ayrı log aracı var; olay anında loglar üç yerde aranıyor ve lisans maliyeti yüksek.', 'Tek log platformu, ortak saklama politikası ve hazır panolar.', 'Yıllık lisans tasarrufu ve olaylarda daha kısa çözüm süresi.', 'medium', NULL, '', false, NULL, 3200000, 'TRY', 'approved', '2026-07-21T09:00:00Z', 3, 3, 3, 3, 3, 'p2', 24, NULL, NULL, 'Lisans yenileme tarihinden önce başlanmalı.', NULL, '2026-07-21T09:00:00Z', 27, '2026-09-01T14:30:00Z', 27, NULL, NULL),
  (9, 'Yönetim için anlık gelir panosu', 'reporting', 2, 14, NULL, 'Gelir rakamları ertesi gün geliyor.', '', 'Gün içi karar alma.', 'medium', NULL, '', false, NULL, NULL, 'TRY', 'rejected', '2026-03-03T09:00:00Z', 3, 2, 2, 1, 3, 'p4', 24, NULL, NULL, 'Yönetim Raporlama Programı bu ihtiyacı 2026 Ç4’te karşılıyor; ayrı bir çalışma açılmayacak.', NULL, '2026-03-03T09:00:00Z', 14, '2026-03-17T14:30:00Z', 14, NULL, NULL),
  (10, 'Tedarikçi fatura takip portalı', 'new-application', 2, 15, NULL, 'Tedarikçiler fatura durumunu e-postayla soruyor.', '', 'Finans ekibinde e-posta yükünün azalması.', 'low', NULL, '', false, NULL, NULL, 'TRY', 'withdrawn', '2026-02-09T09:00:00Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, '2026-02-09T09:00:00Z', 15, '2026-03-02T14:30:00Z', 15, NULL, NULL),
  (11, 'İzin taleplerinin mobil uygulamadan yapılabilmesi', 'enhancement', 4, 5, NULL, 'Saha ve kabin ekipleri izin talebi için ofis bilgisayarına ihtiyaç duyuyor.', 'Çalışan self servis uygulamasına mobil izin talebi ve onayı.', 'Çalışan memnuniyeti, onay süresinin kısalması.', 'medium', NULL, '', false, 6000, NULL, 'TRY', 'needs-info', '2026-08-26T09:00:00Z', NULL, NULL, NULL, NULL, NULL, NULL, 24, NULL, NULL, 'Kaç çalışanın şirket telefonu yok? Kişisel cihazdan erişim gerekiyorsa güvenlik değerlendirmesi de eklenmeli.', NULL, '2026-08-26T09:00:00Z', 5, '2026-09-09T14:30:00Z', 5, NULL, NULL),
  (12, 'Müşteri hizmetlerinde yapay zekâ destekli ön karşılama', 'new-project', 1, 22, 2, 'Çağrı merkezine gelen taleplerin %40’ı rezervasyon durumu ve bagaj hakkı sorusu.', 'Web ve mobilde sık sorulan sorular için sohbet asistanı; gerekirse temsilciye aktarma.', 'Çağrı hacminde %25 azalma, 7/24 hizmet.', 'high', '2027-06-30', '', false, 2000000, 7500000, 'TRY', 'in-review', '2026-09-01T09:00:00Z', 5, 5, 3, 2, 4, NULL, 24, NULL, NULL, '', NULL, '2026-09-01T09:00:00Z', 22, '2026-09-10T14:30:00Z', 22, NULL, NULL),
  (13, 'Yolcu bildirim tercih merkezi', 'enhancement', 1, 2, NULL, 'Yolcular hangi bildirimleri hangi kanaldan alacağını seçemiyor; şikâyetler artıyor.', 'Profilde kanal (SMS, e-posta, push) ve konu bazında tercih ekranı.', 'SMS maliyetinde düşüş, KVKK uyumu, şikâyetlerde azalma.', 'medium', NULL, '', false, 3000000, NULL, 'TRY', 'submitted', '2026-09-22T09:00:00Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, '2026-09-22T09:00:00Z', 2, '2026-09-22T14:30:00Z', 2, NULL, NULL),
  (14, 'VPN yerine sıfır güven tabanlı uzaktan erişim', 'infrastructure', 5, 6, NULL, 'VPN tüm iç ağa erişim veriyor; kapasite sorunları yaşanıyor.', 'Uygulama bazlı erişim, cihaz durumu kontrolü.', 'Saldırı yüzeyinin küçülmesi, kullanıcı deneyimi.', 'high', NULL, '', false, 9000, NULL, 'TRY', 'submitted', '2026-10-01T09:00:00Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, '2026-10-01T09:00:00Z', 6, '2026-10-01T14:30:00Z', 6, NULL, NULL),
  (15, 'Kargo gönderi takibinin müşteri portalına eklenmesi', 'integration', 3, 4, NULL, 'Kargo müşterileri gönderi durumunu öğrenmek için çağrı merkezini arıyor.', 'Kargo sisteminden durum bilgisinin API ile portala aktarılması.', 'Çağrı hacminde azalma, kurumsal müşteri memnuniyeti.', 'medium', NULL, '', false, NULL, NULL, 'TRY', 'submitted', '2026-09-29T09:00:00Z', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '', NULL, '2026-09-29T09:00:00Z', 4, '2026-09-29T14:30:00Z', 4, NULL, NULL);

INSERT INTO demand_benefit_types (demand_id, code, position) VALUES
  (1, 'revenue', 0),
  (1, 'customer-experience', 1),
  (2, 'compliance', 0),
  (2, 'risk-reduction', 1),
  (3, 'customer-experience', 0),
  (3, 'efficiency', 1),
  (4, 'compliance', 0),
  (5, 'efficiency', 0),
  (5, 'cost-saving', 1),
  (6, 'compliance', 0),
  (6, 'risk-reduction', 1),
  (6, 'efficiency', 2),
  (7, 'risk-reduction', 0),
  (7, 'efficiency', 1),
  (8, 'cost-saving', 0),
  (8, 'efficiency', 1),
  (9, 'revenue', 0),
  (10, 'efficiency', 0),
  (11, 'efficiency', 0),
  (12, 'cost-saving', 0),
  (12, 'customer-experience', 1),
  (13, 'customer-experience', 0),
  (13, 'cost-saving', 1),
  (13, 'compliance', 2),
  (14, 'risk-reduction', 0),
  (15, 'customer-experience', 0);

INSERT INTO demand_applications (demand_id, application_id, position) VALUES
  (1, 13, 0),
  (1, 4, 1),
  (2, 1, 0),
  (2, 5, 1),
  (3, 4, 0),
  (3, 3, 1),
  (4, 7, 0),
  (5, 15, 0),
  (6, 9, 0),
  (6, 11, 1),
  (7, 8, 0),
  (11, 5, 0),
  (11, 17, 1),
  (12, 4, 0),
  (12, 6, 1),
  (13, 3, 0),
  (13, 4, 1),
  (15, 4, 0),
  (15, 12, 1);

INSERT INTO demand_events (id, demand_id, at, by_person_id, status, note) VALUES
  (1, 1, '2025-11-10T09:00:00Z', 2, 'submitted', ''),
  (2, 1, '2025-11-18T09:00:00Z', 24, 'in-review', ''),
  (3, 1, '2025-12-05T09:00:00Z', 24, 'approved', 'Gelir etkisi yüksek; 2026 bütçesine alındı.'),
  (4, 1, '2026-01-12T09:00:00Z', 24, 'converted', 'Sadakat Programı Lansmanı projesi olarak başladı.'),
  (5, 2, '2026-01-20T09:00:00Z', 7, 'submitted', ''),
  (6, 2, '2026-01-27T09:00:00Z', 24, 'approved', 'Denetim bulgusu; erteleme seçeneği yok.'),
  (7, 2, '2026-02-16T09:00:00Z', 24, 'converted', 'Çalışan MFA Yaygınlaştırması projesi.'),
  (8, 3, '2026-06-02T09:00:00Z', 2, 'submitted', ''),
  (9, 3, '2026-06-15T09:00:00Z', 24, 'in-review', ''),
  (10, 3, '2026-07-08T09:00:00Z', 24, 'approved', 'Yüksek müşteri etkisi, düşük efor.'),
  (11, 3, '2026-08-20T09:00:00Z', 24, 'scheduled', 'Dijital Deneyim ekibinin 2027 Ç1 planına alındı.'),
  (12, 4, '2026-08-11T09:00:00Z', 3, 'submitted', ''),
  (13, 4, '2026-08-14T09:00:00Z', 24, 'approved', 'Yasal zorunluluk.'),
  (14, 4, '2026-08-25T09:00:00Z', 24, 'scheduled', 'Finans Sistemleri ekibi Ekim’de başlıyor.'),
  (15, 5, '2026-05-19T09:00:00Z', 15, 'submitted', ''),
  (16, 5, '2026-06-03T09:00:00Z', 24, 'in-review', ''),
  (17, 5, '2026-06-24T09:00:00Z', 24, 'approved', 'Kapasite açıldığında planlanacak.'),
  (18, 6, '2026-09-08T09:00:00Z', 4, 'submitted', ''),
  (19, 6, '2026-09-16T09:00:00Z', 24, 'in-review', 'Veri ekibiyle kapsam görüşülüyor.'),
  (20, 7, '2026-04-14T09:00:00Z', 17, 'submitted', ''),
  (21, 7, '2026-04-28T09:00:00Z', 24, 'in-review', ''),
  (22, 7, '2026-06-10T09:00:00Z', 24, 'approved', ''),
  (23, 7, '2026-07-01T09:00:00Z', 24, 'scheduled', 'Ürün seçimi 2027 Ç1, uygulama Ç2–Ç4.'),
  (24, 8, '2026-07-21T09:00:00Z', 27, 'submitted', ''),
  (25, 8, '2026-08-04T09:00:00Z', 24, 'in-review', ''),
  (26, 8, '2026-09-01T09:00:00Z', 24, 'approved', 'Lisans yenileme tarihinden önce başlanmalı.'),
  (27, 9, '2026-03-03T09:00:00Z', 14, 'submitted', ''),
  (28, 9, '2026-03-17T09:00:00Z', 24, 'rejected', 'Yönetim Raporlama Programı bu ihtiyacı 2026 Ç4’te karşılıyor; ayrı bir çalışma açılmayacak.'),
  (29, 10, '2026-02-09T09:00:00Z', 15, 'submitted', ''),
  (30, 10, '2026-03-02T09:00:00Z', 15, 'withdrawn', 'Satın alınan ERP modülü bu ihtiyacı karşılıyor.'),
  (31, 11, '2026-08-26T09:00:00Z', 5, 'submitted', ''),
  (32, 11, '2026-09-09T09:00:00Z', 24, 'needs-info', 'Kaç çalışanın şirket telefonu yok? Kişisel cihazdan erişim gerekiyorsa güvenlik değerlendirmesi de eklenmeli.'),
  (33, 12, '2026-09-01T09:00:00Z', 22, 'submitted', ''),
  (34, 12, '2026-09-10T09:00:00Z', 24, 'in-review', ''),
  (35, 13, '2026-09-22T09:00:00Z', 2, 'submitted', ''),
  (36, 14, '2026-10-01T09:00:00Z', 6, 'submitted', ''),
  (37, 15, '2026-09-29T09:00:00Z', 4, 'submitted', '');

INSERT INTO vendors (id, name, tax_number, contact_name, contact_email, contact_phone, website, notes, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'Northwind Yazılım A.Ş.', '6310000001', 'Derya Aksoy', 'derya.aksoy@northwind.example', '+90 212 000 00 00', 'https://www.northwind.example', '', '2025-09-01T09:00:00Z', 24, '2026-06-01T14:30:00Z', 24, NULL, NULL),
  (2, 'Contoso Cloud Hizmetleri', '2140000002', 'Mark Ellis', 'mark.ellis@contoso.example', '+90 212 000 00 00', 'https://www.contoso.example', '', '2025-09-01T09:00:00Z', 24, '2026-06-01T14:30:00Z', 24, NULL, NULL),
  (3, 'Fabrikam Donanım Ltd.', '3870000003', 'Okan Tekin', 'okan.tekin@fabrikam.example', '+90 212 000 00 00', 'https://www.fabrikam.example', '', '2025-09-01T09:00:00Z', 24, '2026-06-01T14:30:00Z', 24, NULL, NULL),
  (4, 'Atlas Danışmanlık', '1050000004', 'Seda Korkmaz', 'seda.korkmaz@atlas.example', '+90 212 000 00 00', 'https://www.atlas.example', '', '2025-09-01T09:00:00Z', 24, '2026-06-01T14:30:00Z', 24, NULL, NULL),
  (5, 'Kuzey Güvenlik Teknolojileri', '5560000005', 'Murat Işık', 'murat.isik@kuzey.example', '+90 212 000 00 00', 'https://www.kuzey.example', '', '2025-09-01T09:00:00Z', 24, '2026-06-01T14:30:00Z', 24, NULL, NULL),
  (6, 'Tailspin Mesajlaşma', '7720000006', 'Lena Vogt', 'lena.vogt@tailspin.example', '+90 212 000 00 00', 'https://www.tailspin.example', '', '2025-09-01T09:00:00Z', 24, '2026-06-01T14:30:00Z', 24, NULL, NULL);

INSERT INTO contracts (id, title, project_id, vendor_id, type, status, description, owner_person_id, purchase_order_number, signed_date, start_date, end_date, notice_period_days, auto_renewal, total_value, currency, billing_frequency, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 'Uzaktan kimlik doğrulama (e-KYC) hizmeti', 1, 5, 'subscription', 'active', 'Video görüşmeli ve NFC kimlik kartı okumalı müşteri doğrulama; aylık 50.000 doğrulamaya kadar, %99,9 erişilebilirlik.', 11, 'PO-2026-0112', '2026-01-20', '2026-02-01', '2027-01-31', 90, true, 2400000, 'TRY', 'quarterly', '2026-01-10T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (2, 'Kullanıcı araştırması ve UX danışmanlığı', 1, 4, 'consulting', 'expired', 'Başvuru akışı için 3 tur kullanılabilirlik testi ve tasarım önerileri.', 20, 'PO-2025-0981', '2025-11-03', '2025-11-10', '2026-03-31', NULL, false, 750000, 'TRY', 'one-time', '2025-10-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (3, 'Ödeme HSM cihazları (2 adet, yüksek erişilebilir)', 2, 3, 'hardware', 'active', 'İki veri merkezine birer HSM, kurulum ve 3 yıl donanım garantisi.', 13, 'PO-2025-0744', '2025-09-12', '2025-10-01', '2028-09-30', NULL, false, 180000, 'EUR', 'one-time', '2025-09-01T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (4, 'Ödeme yönlendirme yazılımı lisansı ve destek', 2, 1, 'license', 'active', 'Kurumsal lisans, 7/24 destek ve sürüm güncellemeleri.', 14, 'PO-2026-0034', '2025-12-18', '2026-01-01', '2026-12-31', 60, true, 420000, 'EUR', 'yearly', '2025-12-01T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (5, 'Rezervasyon verisi taşıma hizmeti', 4, 1, 'professional-services', 'in-procurement', 'Eski konsoldaki 12 yıllık rezervasyon verisinin yeni platforma taşınması ve doğrulanması.', 25, '', NULL, '2026-11-01', '2027-04-30', NULL, false, 3100000, 'TRY', 'monthly', '2026-08-20T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (6, 'Felaket kurtarma merkezi barındırma hizmeti', 5, 2, 'outsourcing', 'active', 'İkinci bölgede aktif-pasif barındırma, yılda iki tatbikat.', 9, 'PO-2026-0201', '2026-03-01', '2026-03-15', '2029-03-14', 180, false, 1250000, 'USD', 'monthly', '2026-02-10T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (7, 'Gözlemlenebilirlik platformu aboneliği', 5, 2, 'subscription', 'active', 'Log, metrik ve iz toplama; 200 ana makine ve 2 TB/gün log.', 27, 'PO-2025-0655', '2025-11-10', '2025-11-15', '2026-11-14', 30, true, 96000, 'USD', 'yearly', '2025-10-28T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (8, 'Kurumsal raporlama (BI) platformu lisansı', 6, 1, 'license', 'draft', '150 görüntüleyici ve 20 geliştirici lisansı; teklif değerlendiriliyor.', 18, '', NULL, NULL, NULL, NULL, false, 210000, 'EUR', 'yearly', '2026-09-05T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (9, 'Çok faktörlü doğrulama hizmeti ve donanım anahtarları', 7, 5, 'subscription', 'active', '9.000 kullanıcı için MFA aboneliği ve 1.500 donanım anahtarı.', 7, 'PO-2025-1020', '2025-12-01', '2025-12-01', '2026-11-30', 60, false, 1800000, 'TRY', 'quarterly', '2025-11-15T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL),
  (10, 'SMS gönderim hizmeti', 8, 6, 'subscription', 'active', 'Yurt içi ve yurt dışı SMS; mesaj başına ücret, aylık faturalama.', 20, 'PO-2024-0412', '2024-04-01', '2024-04-01', '2026-09-30', 30, false, 960000, 'TRY', 'monthly', '2024-03-15T09:00:00Z', 24, '2026-09-15T14:30:00Z', 24, NULL, NULL);

INSERT INTO contract_applications (contract_id, application_id, position) VALUES
  (1, 1, 0),
  (1, 4, 1),
  (3, 2, 0),
  (4, 2, 0),
  (4, 6, 1),
  (5, 14, 0),
  (6, 8, 0),
  (6, 9, 1),
  (8, 16, 0),
  (8, 11, 1),
  (9, 1, 0),
  (9, 5, 1),
  (10, 3, 0);

INSERT INTO contract_payments (id, contract_id, description, due_date, amount, status, invoice_number, paid_date) VALUES
  (1, 1, '1. çeyrek', '2026-02-15', 600000, 'paid', 'KZY-2026-0211', '2026-02-27'),
  (2, 1, '2. çeyrek', '2026-05-15', 600000, 'paid', 'KZY-2026-0519', '2026-05-29'),
  (3, 1, '3. çeyrek', '2026-08-15', 600000, 'invoiced', 'KZY-2026-0814', NULL),
  (4, 1, '4. çeyrek', '2026-11-15', 600000, 'planned', '', NULL),
  (5, 2, 'Teslim sonrası', '2026-04-15', 750000, 'paid', 'ATL-2026-044', '2026-04-30'),
  (6, 3, 'Teslimat', '2025-10-15', 90000, 'paid', 'FAB-25-3301', '2025-10-30'),
  (7, 3, 'Kurulum kabulü', '2025-12-15', 90000, 'paid', 'FAB-25-3420', '2025-12-22'),
  (8, 4, 'Yıllık lisans', '2026-01-31', 420000, 'paid', 'NW-2026-0007', '2026-02-10'),
  (9, 6, 'Temmuz', '2026-07-31', 34700, 'paid', 'CC-2607-118', '2026-08-12'),
  (10, 6, 'Ağustos', '2026-08-31', 34700, 'invoiced', 'CC-2608-131', NULL),
  (11, 6, 'Eylül', '2026-09-30', 34700, 'planned', '', NULL),
  (12, 6, 'Ekim', '2026-10-31', 34700, 'planned', '', NULL),
  (13, 7, 'Yıllık abonelik', '2025-11-30', 96000, 'paid', 'CC-2511-077', '2025-12-05'),
  (14, 9, '1. dönem', '2025-12-15', 450000, 'paid', 'KZY-2025-1203', '2025-12-26'),
  (15, 9, '2. dönem', '2026-03-15', 450000, 'paid', 'KZY-2026-0310', '2026-03-24'),
  (16, 9, '3. dönem', '2026-06-15', 450000, 'paid', 'KZY-2026-0612', '2026-06-25'),
  (17, 9, '4. dönem', '2026-09-15', 450000, 'invoiced', 'KZY-2026-0911', NULL);

INSERT INTO attachments (id, application_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (1, 2, 'architecture', 'Ödeme Geçidi — Mimari doküman v3.pdf', 'application/pdf', 769, 'Bileşenler, sağlayıcı yönlendirme ve veri akışları.', '2026-03-10T10:00:00Z', 7, '2026-03-10T09:00:00Z', 7, '2026-03-10T14:30:00Z', 7, NULL, NULL);

INSERT INTO attachments (id, application_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (2, 2, 'security-assessment', 'Ödeme Geçidi — PCI DSS değerlendirmesi 2026.pdf', 'application/pdf', 777, 'Yıllık PCI DSS uyum değerlendirmesi ve bulgular.', '2026-05-22T10:00:00Z', 13, '2026-05-22T09:00:00Z', 13, '2026-05-22T14:30:00Z', 13, NULL, NULL);

INSERT INTO attachments (id, application_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (3, 2, 'operations-guide', 'Ödeme Geçidi — Operasyon kılavuzu.pdf', 'application/pdf', 750, 'Dağıtım, izleme ve nöbet devri.', '2026-06-04T10:00:00Z', 13, '2026-06-04T09:00:00Z', 13, '2026-06-04T14:30:00Z', 13, NULL, NULL);

INSERT INTO attachments (id, application_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (4, 2, 'contract', 'Kart işlemcisi hizmet sözleşmesi (özet).pdf', 'application/pdf', 759, 'SLA ve destek seviyeleri özeti.', '2025-12-01T10:00:00Z', 3, '2025-12-01T09:00:00Z', 3, '2025-12-01T14:30:00Z', 3, NULL, NULL);

INSERT INTO attachments (id, application_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (5, 1, 'architecture', 'CIP — Mimari genel bakış.pdf', 'application/pdf', 745, 'OIDC akışları ve bölgesel yerleşim.', '2026-02-14T10:00:00Z', 6, '2026-02-14T09:00:00Z', 6, '2026-02-14T14:30:00Z', 6, NULL, NULL);

INSERT INTO attachments (id, application_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (6, 12, 'architecture', 'API Geçidi — Mimari.pdf', 'application/pdf', 752, 'Rota yapısı, hız sınırlama ve kimlik doğrulama.', '2026-01-20T10:00:00Z', 8, '2026-01-20T09:00:00Z', 8, '2026-01-20T14:30:00Z', 8, NULL, NULL);

INSERT INTO attachments (id, application_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (7, 12, 'operations-guide', 'API Geçidi — Operasyon kılavuzu.pdf', 'application/pdf', 753, 'Sertifika yenileme ve ölçeklendirme.', '2026-01-21T10:00:00Z', 8, '2026-01-21T09:00:00Z', 8, '2026-01-21T14:30:00Z', 8, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (8, 1, 'charter', 'DOT — Proje beratı.pdf', 'application/pdf', 736, 'Kapsam, hedefler ve bütçe onayı.', '2026-02-10T10:00:00Z', 24, '2026-02-10T09:00:00Z', 24, '2026-02-10T14:30:00Z', 24, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (9, 1, 'requirements', 'DOT — İş analizi v2.pdf', 'application/pdf', 742, 'Müşteri kazanım akışı gereksinimleri.', '2026-04-03T10:00:00Z', 26, '2026-04-03T09:00:00Z', 26, '2026-04-03T14:30:00Z', 26, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (10, 1, 'meeting-notes', 'DOT — Yönlendirme komitesi notları (Eylül).pdf', 'application/pdf', 769, 'Tedarikçi gecikmesi ve alınan kararlar.', '2026-09-18T10:00:00Z', 24, '2026-09-18T09:00:00Z', 24, '2026-09-18T14:30:00Z', 24, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (11, 2, 'charter', 'PAYMOD — Proje beratı.pdf', 'application/pdf', 741, 'Modernizasyon kapsamı ve aşamalar.', '2026-01-08T10:00:00Z', 25, '2026-01-08T09:00:00Z', 25, '2026-01-08T14:30:00Z', 25, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (12, 2, 'requirements', 'PAYMOD — Gereksinimler.pdf', 'application/pdf', 757, 'Fonksiyonel ve fonksiyonel olmayan gereksinimler.', '2026-03-02T10:00:00Z', 14, '2026-03-02T09:00:00Z', 14, '2026-03-02T14:30:00Z', 14, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (13, 2, 'design', 'PAYMOD — Teknik tasarım.pdf', 'application/pdf', 737, 'Hedef mimari ve geçiş planı.', '2026-04-15T10:00:00Z', 13, '2026-04-15T09:00:00Z', 13, '2026-04-15T14:30:00Z', 13, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (14, 7, 'charter', 'WMFA — Proje beratı.pdf', 'application/pdf', 740, 'Çalışan MFA yaygınlaştırma kapsamı.', '2025-09-01T10:00:00Z', 25, '2025-09-01T09:00:00Z', 25, '2025-09-01T14:30:00Z', 25, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (15, 7, 'requirements', 'WMFA — Gereksinimler.pdf', 'application/pdf', 747, 'Desteklenen doğrulayıcılar ve istisnalar.', '2025-09-20T10:00:00Z', 7, '2025-09-20T09:00:00Z', 7, '2025-09-20T14:30:00Z', 7, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (16, 7, 'test-report', 'WMFA — Test raporu.pdf', 'application/pdf', 735, 'Pilot ve kabul testi sonuçları.', '2026-02-27T10:00:00Z', 7, '2026-02-27T09:00:00Z', 7, '2026-02-27T14:30:00Z', 7, NULL, NULL);

INSERT INTO attachments (id, project_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (17, 7, 'go-live-approval', 'WMFA — Canlıya geçiş onayı.pdf', 'application/pdf', 744, 'Değişiklik danışma kurulu onayı.', '2026-03-05T10:00:00Z', 1, '2026-03-05T09:00:00Z', 1, '2026-03-05T14:30:00Z', 1, NULL, NULL);

INSERT INTO attachments (id, team_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (18, 1, 'operations-guide', 'Platform ekibi — Nöbet el kitabı.pdf', 'application/pdf', 762, 'Nöbet sırası, eskalasyon ve devir kuralları.', '2026-05-12T10:00:00Z', 9, '2026-05-12T09:00:00Z', 9, '2026-05-12T14:30:00Z', 9, NULL, NULL);

INSERT INTO attachments (id, technology_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (19, 17, 'license', 'Kafka — Kurumsal destek sözleşmesi.pdf', 'application/pdf', 754, 'Destek kapsamı ve yenileme tarihi.', '2026-01-30T10:00:00Z', 6, '2026-01-30T09:00:00Z', 6, '2026-01-30T14:30:00Z', 6, NULL, NULL);

INSERT INTO attachments (id, risk_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (20, 1, 'security-assessment', 'Oracle 12c — Yama durumu değerlendirmesi.pdf', 'application/pdf', 764, 'Telafi edici kontroller ve kalan risk.', '2026-08-30T10:00:00Z', 13, '2026-08-30T09:00:00Z', 13, '2026-08-30T14:30:00Z', 13, NULL, NULL);

INSERT INTO attachments (id, escalation_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (21, 4, 'incident-report', 'Mutabakat uyuşmazlığı — Olay raporu.pdf', 'application/pdf', 755, 'Kök neden ve düzeltici aksiyonlar.', '2026-08-08T10:00:00Z', 13, '2026-08-08T09:00:00Z', 13, '2026-08-08T14:30:00Z', 13, NULL, NULL);

INSERT INTO attachments (id, decision_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (22, 4, 'design', 'LBC emeklilik — Geçiş tasarımı.pdf', 'application/pdf', 762, 'Kanalların taşınma sırası ve geri dönüş planı.', '2026-06-20T10:00:00Z', 24, '2026-06-20T09:00:00Z', 24, '2026-06-20T14:30:00Z', 24, NULL, NULL);

INSERT INTO attachments (id, contract_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (23, 1, 'contract', 'SZL-0001 — e-KYC hizmet sözleşmesi (imzalı).pdf', 'application/pdf', 758, 'İmzalı sözleşme ve SLA eki.', '2026-01-20T10:00:00Z', 11, '2026-01-20T09:00:00Z', 11, '2026-01-20T14:30:00Z', 11, NULL, NULL);

INSERT INTO attachments (id, contract_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (24, 1, 'invoice', 'KZY-2026-0814 — 3. çeyrek faturası.pdf', 'application/pdf', 735, 'Ödeme bekliyor.', '2026-08-16T10:00:00Z', 11, '2026-08-16T09:00:00Z', 11, '2026-08-16T14:30:00Z', 11, NULL, NULL);

INSERT INTO attachments (id, contract_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (25, 3, 'contract', 'SZL-0003 — HSM satın alma sözleşmesi (imzalı).pdf', 'application/pdf', 772, 'Teslimat, kurulum ve garanti koşulları.', '2025-09-12T10:00:00Z', 13, '2025-09-12T09:00:00Z', 13, '2025-09-12T14:30:00Z', 13, NULL, NULL);

INSERT INTO attachments (id, contract_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (26, 4, 'contract', 'SZL-0004 — Lisans ve destek sözleşmesi (imzalı).pdf', 'application/pdf', 768, 'Yıllık lisans, destek seviyeleri.', '2025-12-18T10:00:00Z', 14, '2025-12-18T09:00:00Z', 14, '2025-12-18T14:30:00Z', 14, NULL, NULL);

INSERT INTO attachments (id, contract_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (27, 5, 'offer', 'Northwind — Veri taşıma teklifi v2.pdf', 'application/pdf', 752, 'Revize teklif; müzakere sürüyor.', '2026-09-10T10:00:00Z', 25, '2026-09-10T09:00:00Z', 25, '2026-09-10T14:30:00Z', 25, NULL, NULL);

INSERT INTO attachments (id, contract_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (28, 6, 'contract', 'SZL-0006 — Felaket kurtarma barındırma sözleşmesi (imzalı).pdf', 'application/pdf', 773, '3 yıllık hizmet sözleşmesi.', '2026-03-01T10:00:00Z', 9, '2026-03-01T09:00:00Z', 9, '2026-03-01T14:30:00Z', 9, NULL, NULL);

INSERT INTO attachments (id, contract_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (29, 6, 'purchase-order', 'PO-2026-0201 — Satın alma siparişi.pdf', 'application/pdf', 720, '', '2026-03-02T10:00:00Z', 9, '2026-03-02T09:00:00Z', 9, '2026-03-02T14:30:00Z', 9, NULL, NULL);

INSERT INTO attachments (id, contract_id, document_type, file_name, content_type, size_bytes, description, uploaded_at, uploaded_by_person_id, created_at, created_by_person_id, updated_at, updated_by_person_id, last_reviewed_at, last_reviewed_by_person_id) VALUES
  (30, 9, 'contract', 'SZL-0009 — MFA hizmet sözleşmesi (imzalı).pdf', 'application/pdf', 775, 'Abonelik ve donanım anahtarı teslim koşulları.', '2025-12-01T10:00:00Z', 7, '2025-12-01T09:00:00Z', 7, '2025-12-01T14:30:00Z', 7, NULL, NULL);

INSERT INTO attachment_contents (attachment_id, content) VALUES
  (1, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313938203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28d664656d65204765e769646920204d696d61726920646f6bfc6d616e2076332920546a0a2f46312031312054662030202d32382054640a2842696c6573656e6c65722c207361676c61796963692079f66e6c656e6469726d65207665207665726920616b69736c6172692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3538370a2525454f46'::bytea),
  (2, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820323036203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28d664656d65204765e76964692020504349204453532064656765726c656e6469726d65736920323032362920546a0a2f46312031312054662030202d32382054640a2859696c6c696b2050434920445353207579756d2064656765726c656e6469726d6573692076652062756c67756c61722e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3539350a2525454f46'::bytea),
  (3, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313739203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28d664656d65204765e769646920204f7065726173796f6e206b696c6176757a752920546a0a2f46312031312054662030202d32382054640a284461676974696d2c20697a6c656d65207665206ef66265742064657672692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3536380a2525454f46'::bytea),
  (4, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313838203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a284b6172742069736c656d636973692068697a6d65742073f67a6c65736d657369205c28f67a65745c292920546a0a2f46312031312054662030202d32382054640a28534c412076652064657374656b207365766979656c65726920f67a6574692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3537370a2525454f46'::bytea),
  (5, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313734203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a2843495020204d696d6172692067656e656c2062616b69732920546a0a2f46312031312054662030202d32382054640a284f49444320616b69736c6172692076652062f66c676573656c207965726c6573696d2e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3536330a2525454f46'::bytea),
  (6, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313831203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28415049204765e769646920204d696d6172692920546a0a2f46312031312054662030202d32382054640a28526f7461207961706973692c2068697a2073696e69726c616d61207665206b696d6c696b20646f6772756c616d612e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3537300a2525454f46'::bytea),
  (7, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313832203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28415049204765e769646920204f7065726173796f6e206b696c6176757a752920546a0a2f46312031312054662030202d32382054640a28536572746966696b612079656e696c656d6520766520f66ce7656b6c656e6469726d652e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3537310a2525454f46'::bytea),
  (8, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313635203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28444f54202050726f6a65206265726174692920546a0a2f46312031312054662030202d32382054640a284b617073616d2c2068656465666c65722076652062fc74e765206f6e6179692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3535340a2525454f46'::bytea),
  (9, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313731203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28444f542020497320616e616c697a692076322920546a0a2f46312031312054662030202d32382054640a284dfc7374657269206b617a616e696d20616b69736920676572656b73696e696d6c6572692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3536300a2525454f46'::bytea),
  (10, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313938203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28444f54202059f66e6c656e6469726d65206b6f6d6974657369206e6f746c617269205c2845796cfc6c5c292920546a0a2f46312031312054662030202d32382054640a285465646172696be76920676563696b6d65736920766520616c696e616e206b617261726c61722e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3538370a2525454f46'::bytea),
  (11, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313730203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a285041594d4f44202050726f6a65206265726174692920546a0a2f46312031312054662030202d32382054640a284d6f6465726e697a6173796f6e206b617073616d69207665206173616d616c61722e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3535390a2525454f46'::bytea),
  (12, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313836203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a285041594d4f442020476572656b73696e696d6c65722920546a0a2f46312031312054662030202d32382054640a28466f6e6b7369796f6e656c20766520666f6e6b7369796f6e656c206f6c6d6179616e20676572656b73696e696d6c65722e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3537350a2525454f46'::bytea),
  (13, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313636203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a285041594d4f44202054656b6e696b207461736172696d2920546a0a2f46312031312054662030202d32382054640a284865646566206d696d617269207665206765e7697320706c616e692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3535350a2525454f46'::bytea),
  (14, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313639203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28574d4641202050726f6a65206265726174692920546a0a2f46312031312054662030202d32382054640a28c7616c6973616e204d46412079617967696e6c61737469726d61206b617073616d692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3535380a2525454f46'::bytea),
  (15, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313736203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28574d46412020476572656b73696e696d6c65722920546a0a2f46312031312054662030202d32382054640a2844657374656b6c656e656e20646f6772756c61796963696c61722076652069737469736e616c61722e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3536350a2525454f46'::bytea),
  (16, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313634203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28574d4641202054657374207261706f72752920546a0a2f46312031312054662030202d32382054640a2850696c6f74207665206b6162756c20746573746920736f6e75e76c6172692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3535330a2525454f46'::bytea),
  (17, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313733203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28574d4641202043616e6c697961206765e76973206f6e6179692920546a0a2f46312031312054662030202d32382054640a284465676973696b6c696b2064616e69736d61206b7572756c75206f6e6179692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3536320a2525454f46'::bytea),
  (18, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313931203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28506c6174666f726d20656b69626920204ef662657420656c206b69746162692920546a0a2f46312031312054662030202d32382054640a284ef6626574207369726173692c2065736b616c6173796f6e207665206465766972206b7572616c6c6172692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3538300a2525454f46'::bytea),
  (19, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313833203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a284b61666b6120204b7572756d73616c2064657374656b2073f67a6c65736d6573692920546a0a2f46312031312054662030202d32382054640a2844657374656b206b617073616d692076652079656e696c656d65207461726968692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3537320a2525454f46'::bytea),
  (20, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313933203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a284f7261636c6520313263202059616d6120647572756d752064656765726c656e6469726d6573692920546a0a2f46312031312054662030202d32382054640a2854656c616669206564696369206b6f6e74726f6c6c6572207665206b616c616e207269736b2e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3538320a2525454f46'::bytea),
  (21, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313834203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a284d75746162616b617420757975736d617a6c69676920204f6c6179207261706f72752920546a0a2f46312031312054662030202d32382054640a284bf66b206e6564656e2076652064fc7a656c7469636920616b7369796f6e6c61722e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3537330a2525454f46'::bytea),
  (22, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313931203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a284c424320656d656b6c696c696b20204765e76973207461736172696d692920546a0a2f46312031312054662030202d32382054640a284b616e616c6c6172696e20746173696e6d612073697261736920766520676572692064f66efc7320706c616e692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3538300a2525454f46'::bytea),
  (23, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313837203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28535a4c2d303030312020652d4b59432068697a6d65742073f67a6c65736d657369205c28696d7a616c695c292920546a0a2f46312031312054662030202d32382054640a28496d7a616c692073f67a6c65736d6520766520534c4120656b692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3537360a2525454f46'::bytea),
  (24, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313634203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a284b5a592d323032362d303831342020332e20e7657972656b2066617475726173692920546a0a2f46312031312054662030202d32382054640a28d664656d652062656b6c69796f722e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3535330a2525454f46'::bytea),
  (25, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820323031203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28535a4c2d30303033202048534d20736174696e20616c6d612073f67a6c65736d657369205c28696d7a616c695c292920546a0a2f46312031312054662030202d32382054640a285465736c696d61742c206b7572756c756d20766520676172616e7469206b6f73756c6c6172692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3539300a2525454f46'::bytea),
  (26, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313937203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28535a4c2d3030303420204c6973616e732076652064657374656b2073f67a6c65736d657369205c28696d7a616c695c292920546a0a2f46312031312054662030202d32382054640a2859696c6c696b206c6973616e732c2064657374656b207365766979656c6572692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3538360a2525454f46'::bytea),
  (27, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313831203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a284e6f72746877696e6420205665726920746173696d612074656b6c6966692076322920546a0a2f46312031312054662030202d32382054640a28526576697a652074656b6c69663b206dfc7a616b6572652073fc72fc796f722e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3537300a2525454f46'::bytea),
  (28, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820323032203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28535a4c2d30303036202046656c616b6574206b75727461726d6120626172696e6469726d612073f67a6c65736d657369205c28696d7a616c695c292920546a0a2f46312031312054662030202d32382054640a28332079696c6c696b2068697a6d65742073f67a6c65736d6573692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3539310a2525454f46'::bytea),
  (29, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820313439203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28504f2d323032362d303230312020536174696e20616c6d612073697061726973692920546a0a2f46312031312054662030202d32382054640a282920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3533380a2525454f46'::bytea),
  (30, '\x255044462d312e340a312030206f626a0a3c3c202f54797065202f436174616c6f67202f5061676573203220302052203e3e0a656e646f626a0a322030206f626a0a3c3c202f54797065202f5061676573202f4b696473205b33203020525d202f436f756e742031203e3e0a656e646f626a0a332030206f626a0a3c3c202f54797065202f50616765202f506172656e74203220302052202f4d65646961426f78205b30203020353935203834325d202f5265736f7572636573203c3c202f466f6e74203c3c202f4631203420302052203e3e203e3e202f436f6e74656e7473203520302052203e3e0a656e646f626a0a342030206f626a0a3c3c202f54797065202f466f6e74202f53756274797065202f5479706531202f42617365466f6e74202f48656c766574696361202f456e636f64696e67202f57696e416e7369456e636f64696e67203e3e0a656e646f626a0a352030206f626a0a3c3c202f4c656e67746820323034203e3e0a73747265616d0a4254202f4631203230205466203536203737302054640a28535a4c2d3030303920204d46412068697a6d65742073f67a6c65736d657369205c28696d7a616c695c292920546a0a2f46312031312054662030202d32382054640a2841626f6e656c696b20766520646f6e616e696d20616e616874617269207465736c696d206b6f73756c6c6172692e2920546a0a30202d31362054640a284365726562726f2064656d6f2062656c67657369202d206f726e656b2069636572696b2e2920546a0a30202d31362054640a45540a656e6473747265616d0a656e646f626a0a787265660a3020360a303030303030303030302036353533352066200a30303030303030303039203030303030206e200a30303030303030303538203030303030206e200a30303030303030313135203030303030206e200a30303030303030323431203030303030206e200a30303030303030333338203030303030206e200a747261696c65720a3c3c202f53697a652036202f526f6f74203120302052203e3e0a7374617274787265660a3539330a2525454f46'::bytea);

-- Rows were inserted with their ids: move each sequence past them.
SELECT setval(pg_get_serial_sequence('business_units', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM business_units), false);
SELECT setval(pg_get_serial_sequence('people', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM people), false);
SELECT setval(pg_get_serial_sequence('roles', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM roles), false);
SELECT setval(pg_get_serial_sequence('user_accounts', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM user_accounts), false);
SELECT setval(pg_get_serial_sequence('teams', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM teams), false);
SELECT setval(pg_get_serial_sequence('team_members', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM team_members), false);
SELECT setval(pg_get_serial_sequence('technologies', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM technologies), false);
SELECT setval(pg_get_serial_sequence('applications', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM applications), false);
SELECT setval(pg_get_serial_sequence('technology_usages', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM technology_usages), false);
SELECT setval(pg_get_serial_sequence('data_stores', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM data_stores), false);
SELECT setval(pg_get_serial_sequence('source_repositories', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM source_repositories), false);
SELECT setval(pg_get_serial_sequence('environments', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM environments), false);
SELECT setval(pg_get_serial_sequence('projects', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM projects), false);
SELECT setval(pg_get_serial_sequence('milestones', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM milestones), false);
SELECT setval(pg_get_serial_sequence('application_impacts', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM application_impacts), false);
SELECT setval(pg_get_serial_sequence('role_assignments', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM role_assignments), false);
SELECT setval(pg_get_serial_sequence('team_assignments', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM team_assignments), false);
SELECT setval(pg_get_serial_sequence('documentation_links', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM documentation_links), false);
SELECT setval(pg_get_serial_sequence('dependencies', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM dependencies), false);
SELECT setval(pg_get_serial_sequence('integrations', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM integrations), false);
SELECT setval(pg_get_serial_sequence('risks', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM risks), false);
SELECT setval(pg_get_serial_sequence('escalations', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM escalations), false);
SELECT setval(pg_get_serial_sequence('decisions', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM decisions), false);
SELECT setval(pg_get_serial_sequence('decision_makers', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM decision_makers), false);
SELECT setval(pg_get_serial_sequence('risk_applications', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM risk_applications), false);
SELECT setval(pg_get_serial_sequence('risk_projects', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM risk_projects), false);
SELECT setval(pg_get_serial_sequence('escalation_applications', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM escalation_applications), false);
SELECT setval(pg_get_serial_sequence('escalation_projects', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM escalation_projects), false);
SELECT setval(pg_get_serial_sequence('decision_applications', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM decision_applications), false);
SELECT setval(pg_get_serial_sequence('decision_projects', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM decision_projects), false);
SELECT setval(pg_get_serial_sequence('application_runbooks', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM application_runbooks), false);
SELECT setval(pg_get_serial_sequence('runbook_scenarios', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM runbook_scenarios), false);
SELECT setval(pg_get_serial_sequence('runbook_steps', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM runbook_steps), false);
SELECT setval(pg_get_serial_sequence('runbook_links', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM runbook_links), false);
SELECT setval(pg_get_serial_sequence('runbook_contacts', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM runbook_contacts), false);
SELECT setval(pg_get_serial_sequence('leave_records', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM leave_records), false);
SELECT setval(pg_get_serial_sequence('resource_allocations', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM resource_allocations), false);
SELECT setval(pg_get_serial_sequence('demands', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM demands), false);
SELECT setval(pg_get_serial_sequence('demand_events', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM demand_events), false);
SELECT setval(pg_get_serial_sequence('vendors', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM vendors), false);
SELECT setval(pg_get_serial_sequence('contracts', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM contracts), false);
SELECT setval(pg_get_serial_sequence('contract_payments', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM contract_payments), false);
SELECT setval(pg_get_serial_sequence('attachments', 'id'), (SELECT COALESCE(max(id), 0) + 1 FROM attachments), false);
