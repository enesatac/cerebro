-- Privilege catalogue and the locked system administrator role. Generated from the frontend
-- catalogue (frontend/src/domains/auth/types PRIVILEGE_MODULES). `PrivilegeModule` (Java) and this
-- list are kept in step by PrivilegeCatalogTest.

INSERT INTO access_privileges (code, module, access_level, description) VALUES ('dashboard:view', 'dashboard', 'view', 'Portföy özetini ve dikkat listesini görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('projects:view', 'projects', 'view', 'Projeleri, kilometre taşlarını ve belgeleri görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('projects:edit', 'projects', 'edit', 'Proje oluşturur ve düzenler; belge yükler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('projects:delete', 'projects', 'delete', 'Proje ve proje belgelerini siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('applications:view', 'applications', 'view', 'Uygulamaları, ortamları ve müdahale rehberlerini görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('applications:edit', 'applications', 'edit', 'Uygulama ve müdahale rehberi oluşturur, düzenler; belge yükler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('applications:delete', 'applications', 'delete', 'Uygulama, rehber ve belgeleri siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('connections:view', 'connections', 'view', 'Bağımlılıkları, entegrasyonları ve etki analizini görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('connections:edit', 'connections', 'edit', 'Bağımlılık ve entegrasyon kaydeder, düzenler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('connections:delete', 'connections', 'delete', 'Bağımlılık ve entegrasyon siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('risks:view', 'risks', 'view', 'Risk, eskalasyon ve kararları görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('risks:edit', 'risks', 'edit', 'Risk ve karar kaydeder, eskalasyon açar ve günceller.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('risks:delete', 'risks', 'delete', 'Risk, eskalasyon ve kararları siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('contracts:view', 'contracts', 'view', 'Sözleşmeleri, bedelleri, ödeme planlarını ve tedarikçileri görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('contracts:edit', 'contracts', 'edit', 'Sözleşme ve tedarikçi kaydeder, ödemeleri günceller, sözleşme belgesi yükler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('contracts:delete', 'contracts', 'delete', 'Sözleşme, tedarikçi ve sözleşme belgelerini siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('reports:view', 'reports', 'view', 'Rapor ve grafikleri görür, dışa aktarır.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('teams:view', 'teams', 'view', 'Ekipleri ve üyelerini görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('teams:edit', 'teams', 'edit', 'Ekip oluşturur, üyeleri ve iletişim bilgilerini düzenler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('teams:delete', 'teams', 'delete', 'Ekip siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('people:view', 'people', 'view', 'Kişi sayfalarını (sorumluluklar, iş yükü) görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('people:edit', 'people', 'edit', 'Kişi kayıtlarını ekler ve düzenler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('people:delete', 'people', 'delete', 'Kişi kaydı siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('technologies:view', 'technologies', 'view', 'Teknoloji kataloğunu ve kullanımını görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('technologies:edit', 'technologies', 'edit', 'Teknoloji ekler ve durumunu değiştirir.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('technologies:delete', 'technologies', 'delete', 'Teknoloji siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('resources:view', 'resources', 'view', 'Kimin hangi projede çalıştığını ve yükünü görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('resources:edit', 'resources', 'edit', 'Kaynak ataması ekler, değiştirir ve kaldırır.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('leaves:view', 'leaves', 'view', 'İzin takvimini görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('leaves:edit', 'leaves', 'edit', 'İzin ekler, değiştirir ve siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('demands:view', 'demands', 'view', 'Tüm talepleri ve kararları görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('demands:edit', 'demands', 'edit', 'Talep açar; kendi talebini karar verilene kadar düzenler, geri çeker, dosya ekler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('demandManagement:view', 'demandManagement', 'view', 'Gelen kutusunu, önceliklendirmeyi ve yol haritasını görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('demandManagement:edit', 'demandManagement', 'edit', 'Talepleri değerlendirir, önceliklendirir, takvime alır; her talebi düzenler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('demandManagement:delete', 'demandManagement', 'delete', 'Talep siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('masterData:view', 'masterData', 'view', 'Değer listelerini ve iş birimlerini görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('masterData:edit', 'masterData', 'edit', 'Değer listelerini ve iş birimlerini düzenler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('users:view', 'users', 'view', 'Kullanıcı hesaplarını ve rollerini görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('users:edit', 'users', 'edit', 'Kullanıcı ekler, rollerini değiştirir, devre dışı bırakır ve siler.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('roles:view', 'roles', 'view', 'Rolleri ve yetki matrisini görür.');
INSERT INTO access_privileges (code, module, access_level, description) VALUES ('roles:edit', 'roles', 'edit', 'Rol oluşturur, yetkilerini değiştirir ve siler.');

INSERT INTO roles (name, description, system_role) VALUES ('Sistem yöneticisi',
  'Her ekranda tam yetki; kullanıcıları, rolleri ve ana verileri yönetir. Değiştirilemez.', 1);

INSERT INTO role_privileges (role_id, privilege_code)
  SELECT r.id, p.code FROM roles r CROSS JOIN access_privileges p WHERE r.system_role = 1;
