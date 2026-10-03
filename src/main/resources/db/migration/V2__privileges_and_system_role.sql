-- Privilege catalogue and the locked system administrator role.
-- Generated from the frontend catalogue (cerebro: src/domains/auth/types PRIVILEGE_MODULES). The
-- application checks these codes; keep `PrivilegeModule` (Java) and this list in sync — a test
-- compares them.

INSERT INTO privileges (code, module, level, description) VALUES
  ('dashboard:view', 'dashboard', 'view', 'Portföy özetini ve dikkat listesini görür.'),
  ('projects:view', 'projects', 'view', 'Projeleri, kilometre taşlarını ve belgeleri görür.'),
  ('projects:edit', 'projects', 'edit', 'Proje oluşturur ve düzenler; belge yükler.'),
  ('projects:delete', 'projects', 'delete', 'Proje ve proje belgelerini siler.'),
  ('applications:view', 'applications', 'view', 'Uygulamaları, ortamları ve müdahale rehberlerini görür.'),
  ('applications:edit', 'applications', 'edit', 'Uygulama ve müdahale rehberi oluşturur, düzenler; belge yükler.'),
  ('applications:delete', 'applications', 'delete', 'Uygulama, rehber ve belgeleri siler.'),
  ('connections:view', 'connections', 'view', 'Bağımlılıkları, entegrasyonları ve etki analizini görür.'),
  ('connections:edit', 'connections', 'edit', 'Bağımlılık ve entegrasyon kaydeder, düzenler.'),
  ('connections:delete', 'connections', 'delete', 'Bağımlılık ve entegrasyon siler.'),
  ('risks:view', 'risks', 'view', 'Risk, eskalasyon ve kararları görür.'),
  ('risks:edit', 'risks', 'edit', 'Risk ve karar kaydeder, eskalasyon açar ve günceller.'),
  ('risks:delete', 'risks', 'delete', 'Risk, eskalasyon ve kararları siler.'),
  ('contracts:view', 'contracts', 'view', 'Sözleşmeleri, bedelleri, ödeme planlarını ve tedarikçileri görür.'),
  ('contracts:edit', 'contracts', 'edit', 'Sözleşme ve tedarikçi kaydeder, ödemeleri günceller, sözleşme belgesi yükler.'),
  ('contracts:delete', 'contracts', 'delete', 'Sözleşme, tedarikçi ve sözleşme belgelerini siler.'),
  ('reports:view', 'reports', 'view', 'Rapor ve grafikleri görür, dışa aktarır.'),
  ('teams:view', 'teams', 'view', 'Ekipleri ve üyelerini görür.'),
  ('teams:edit', 'teams', 'edit', 'Ekip oluşturur, üyeleri ve iletişim bilgilerini düzenler.'),
  ('teams:delete', 'teams', 'delete', 'Ekip siler.'),
  ('people:view', 'people', 'view', 'Kişi sayfalarını (sorumluluklar, iş yükü) görür.'),
  ('people:edit', 'people', 'edit', 'Kişi kayıtlarını ekler ve düzenler.'),
  ('people:delete', 'people', 'delete', 'Kişi kaydı siler.'),
  ('technologies:view', 'technologies', 'view', 'Teknoloji kataloğunu ve kullanımını görür.'),
  ('technologies:edit', 'technologies', 'edit', 'Teknoloji ekler ve durumunu değiştirir.'),
  ('technologies:delete', 'technologies', 'delete', 'Teknoloji siler.'),
  ('resources:view', 'resources', 'view', 'Kimin hangi projede çalıştığını ve yükünü görür.'),
  ('resources:edit', 'resources', 'edit', 'Kaynak ataması ekler, değiştirir ve kaldırır.'),
  ('leaves:view', 'leaves', 'view', 'İzin takvimini görür.'),
  ('leaves:edit', 'leaves', 'edit', 'İzin ekler, değiştirir ve siler.'),
  ('demands:view', 'demands', 'view', 'Tüm talepleri ve kararları görür.'),
  ('demands:edit', 'demands', 'edit', 'Talep açar; kendi talebini karar verilene kadar düzenler, geri çeker, dosya ekler.'),
  ('demandManagement:view', 'demandManagement', 'view', 'Gelen kutusunu, önceliklendirmeyi ve yol haritasını görür.'),
  ('demandManagement:edit', 'demandManagement', 'edit', 'Talepleri değerlendirir, önceliklendirir, takvime alır; her talebi düzenler.'),
  ('demandManagement:delete', 'demandManagement', 'delete', 'Talep siler.'),
  ('masterData:view', 'masterData', 'view', 'Değer listelerini ve iş birimlerini görür.'),
  ('masterData:edit', 'masterData', 'edit', 'Değer listelerini ve iş birimlerini düzenler.'),
  ('users:view', 'users', 'view', 'Kullanıcı hesaplarını ve rollerini görür.'),
  ('users:edit', 'users', 'edit', 'Kullanıcı ekler, rollerini değiştirir, devre dışı bırakır ve siler.'),
  ('roles:view', 'roles', 'view', 'Rolleri ve yetki matrisini görür.'),
  ('roles:edit', 'roles', 'edit', 'Rol oluşturur, yetkilerini değiştirir ve siler.');

INSERT INTO roles (name, description, system)
VALUES ('Sistem yöneticisi',
        'Her ekranda tam yetki; kullanıcıları, rolleri ve ana verileri yönetir. Değiştirilemez.',
        true);

INSERT INTO role_privileges (role_id, privilege_code)
SELECT r.id, p.code FROM roles r CROSS JOIN privileges p WHERE r.system;
