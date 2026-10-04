import type {
  Technology,
  TechnologyCategory,
  TechnologyId,
  TechnologyStatus,
} from '@/domains/technologies/types';
import { TECH } from './ids';

type TechSeed = [
  id: TechnologyId,
  name: string,
  category: TechnologyCategory,
  status: TechnologyStatus,
  description: string,
];

const seeds: TechSeed[] = [
  [
    TECH.react,
    'React',
    'frontend',
    'preferred',
    'Web uygulamaları için bileşen tabanlı arayüz kütüphanesi.',
  ],
  [TECH.angular, 'Angular', 'frontend', 'supported', 'Tam özellikli web uygulama çatısı.'],
  [
    TECH.angularjs,
    'AngularJS',
    'frontend',
    'retired',
    "Angular'ın eski öncülü; desteği sona erdi.",
  ],
  [TECH.typescript, 'TypeScript', 'frontend', 'preferred', "JavaScript'in tipli üst kümesi."],
  [TECH.java, 'Java', 'backend', 'preferred', 'Backend servisleri için JVM dili.'],
  [
    TECH.springBoot,
    'Spring Boot',
    'backend',
    'preferred',
    'Kuralları belirlenmiş Java servis çatısı.',
  ],
  [TECH.kotlin, 'Kotlin', 'backend', 'preferred', 'Modern JVM dili.'],
  [
    TECH.nodejs,
    'Node.js',
    'backend',
    'supported',
    "Servisler ve BFF'ler için JavaScript çalışma ortamı.",
  ],
  [TECH.dotnet, '.NET', 'backend', 'supported', 'Microsoft uygulama platformu.'],
  [TECH.python, 'Python', 'backend', 'supported', 'Veri hatları ve otomasyon için dil.'],
  [TECH.struts, 'Apache Struts 1', 'backend', 'retired', 'Eski Java web çatısı; desteklenmiyor.'],
  [TECH.postgresql, 'PostgreSQL', 'database', 'preferred', 'İlişkisel veritabanı.'],
  [TECH.oracle, 'Oracle Database', 'database', 'supported', 'Ticari ilişkisel veritabanı.'],
  [TECH.mongodb, 'MongoDB', 'database', 'supported', 'Doküman veritabanı.'],
  [TECH.redis, 'Redis', 'database', 'preferred', 'Bellek içi veri deposu ve önbellek.'],
  [TECH.elasticsearch, 'Elasticsearch', 'database', 'supported', 'Arama ve analitik motoru.'],
  [TECH.kafka, 'Apache Kafka', 'messaging', 'preferred', 'Dağıtık olay akışı platformu.'],
  [TECH.rabbitmq, 'RabbitMQ', 'messaging', 'supported', 'İş kuyrukları için mesaj aracısı.'],
  [TECH.ibmMq, 'IBM MQ', 'messaging', 'deprecated', "Eski mesaj kuyruğu; Kafka'ya taşınmalı."],
  [
    TECH.kubernetes,
    'Kubernetes',
    'infrastructure',
    'preferred',
    'Konteyner orkestrasyon platformu.',
  ],
  [TECH.docker, 'Docker', 'infrastructure', 'preferred', 'Konteyner imaj araçları.'],
  [TECH.terraform, 'Terraform', 'devops', 'preferred', 'Kod olarak altyapı.'],
  [TECH.aws, 'Amazon Web Services', 'infrastructure', 'preferred', 'Genel bulut sağlayıcı.'],
  [TECH.vmware, 'VMware vSphere', 'infrastructure', 'supported', 'Şirket içi sanallaştırma.'],
  [TECH.envoy, 'Envoy Proxy', 'infrastructure', 'preferred', "Uç ve servis proxy'si."],
  [TECH.gitlabCi, 'GitLab CI', 'devops', 'preferred', 'CI/CD hatları.'],
  [TECH.jenkins, 'Jenkins', 'devops', 'deprecated', "Eski CI sunucusu; GitLab CI'a taşınmalı."],
  [TECH.prometheus, 'Prometheus', 'monitoring', 'preferred', 'Metrik toplama ve alarm.'],
  [TECH.grafana, 'Grafana', 'monitoring', 'preferred', 'Gösterge panelleri ve gözlemlenebilirlik.'],
  [TECH.playwright, 'Playwright', 'testing', 'preferred', 'Uçtan uca tarayıcı testi.'],
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
