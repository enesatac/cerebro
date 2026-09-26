import type {
  Technology,
  TechnologyCategory,
  TechnologyStatus,
} from '@/domains/technologies/types';

type TechSeed = [
  id: string,
  name: string,
  category: TechnologyCategory,
  status: TechnologyStatus,
  description: string,
];

const seeds: TechSeed[] = [
  [
    'tech-react',
    'React',
    'frontend',
    'preferred',
    'Web uygulamaları için bileşen tabanlı arayüz kütüphanesi.',
  ],
  ['tech-angular', 'Angular', 'frontend', 'supported', 'Tam özellikli web uygulama çatısı.'],
  [
    'tech-angularjs',
    'AngularJS',
    'frontend',
    'retired',
    "Angular'ın eski öncülü; desteği sona erdi.",
  ],
  ['tech-typescript', 'TypeScript', 'frontend', 'preferred', "JavaScript'in tipli üst kümesi."],
  ['tech-java', 'Java', 'backend', 'preferred', 'Backend servisleri için JVM dili.'],
  [
    'tech-spring-boot',
    'Spring Boot',
    'backend',
    'preferred',
    'Kuralları belirlenmiş Java servis çatısı.',
  ],
  ['tech-kotlin', 'Kotlin', 'backend', 'preferred', 'Modern JVM dili.'],
  [
    'tech-nodejs',
    'Node.js',
    'backend',
    'supported',
    "Servisler ve BFF'ler için JavaScript çalışma ortamı.",
  ],
  ['tech-dotnet', '.NET', 'backend', 'supported', 'Microsoft uygulama platformu.'],
  ['tech-python', 'Python', 'backend', 'supported', 'Veri hatları ve otomasyon için dil.'],
  ['tech-struts', 'Apache Struts 1', 'backend', 'retired', 'Eski Java web çatısı; desteklenmiyor.'],
  ['tech-postgresql', 'PostgreSQL', 'database', 'preferred', 'İlişkisel veritabanı.'],
  ['tech-oracle', 'Oracle Database', 'database', 'supported', 'Ticari ilişkisel veritabanı.'],
  ['tech-mongodb', 'MongoDB', 'database', 'supported', 'Doküman veritabanı.'],
  ['tech-redis', 'Redis', 'database', 'preferred', 'Bellek içi veri deposu ve önbellek.'],
  ['tech-elasticsearch', 'Elasticsearch', 'database', 'supported', 'Arama ve analitik motoru.'],
  ['tech-kafka', 'Apache Kafka', 'messaging', 'preferred', 'Dağıtık olay akışı platformu.'],
  ['tech-rabbitmq', 'RabbitMQ', 'messaging', 'supported', 'İş kuyrukları için mesaj aracısı.'],
  ['tech-ibm-mq', 'IBM MQ', 'messaging', 'deprecated', "Eski mesaj kuyruğu; Kafka'ya taşınmalı."],
  [
    'tech-kubernetes',
    'Kubernetes',
    'infrastructure',
    'preferred',
    'Konteyner orkestrasyon platformu.',
  ],
  ['tech-docker', 'Docker', 'infrastructure', 'preferred', 'Konteyner imaj araçları.'],
  ['tech-terraform', 'Terraform', 'devops', 'preferred', 'Kod olarak altyapı.'],
  ['tech-aws', 'Amazon Web Services', 'infrastructure', 'preferred', 'Genel bulut sağlayıcı.'],
  ['tech-vmware', 'VMware vSphere', 'infrastructure', 'supported', 'Şirket içi sanallaştırma.'],
  ['tech-envoy', 'Envoy Proxy', 'infrastructure', 'preferred', "Uç ve servis proxy'si."],
  ['tech-gitlab-ci', 'GitLab CI', 'devops', 'preferred', 'CI/CD hatları.'],
  ['tech-jenkins', 'Jenkins', 'devops', 'deprecated', "Eski CI sunucusu; GitLab CI'a taşınmalı."],
  ['tech-prometheus', 'Prometheus', 'monitoring', 'preferred', 'Metrik toplama ve alarm.'],
  [
    'tech-grafana',
    'Grafana',
    'monitoring',
    'preferred',
    'Gösterge panelleri ve gözlemlenebilirlik.',
  ],
  ['tech-playwright', 'Playwright', 'testing', 'preferred', 'Uçtan uca tarayıcı testi.'],
];

export const technologies: Technology[] = seeds.map(
  ([id, name, category, status, description]) => ({
    id,
    name,
    category,
    status,
    description,
  }),
);
