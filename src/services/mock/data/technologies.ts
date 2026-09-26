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
    'Component-based UI library for web applications.',
  ],
  ['tech-angular', 'Angular', 'frontend', 'supported', 'Full-featured web application framework.'],
  [
    'tech-angularjs',
    'AngularJS',
    'frontend',
    'retired',
    'Legacy predecessor of Angular; end of life.',
  ],
  ['tech-typescript', 'TypeScript', 'frontend', 'preferred', 'Typed superset of JavaScript.'],
  ['tech-java', 'Java', 'backend', 'preferred', 'JVM language for backend services.'],
  [
    'tech-spring-boot',
    'Spring Boot',
    'backend',
    'preferred',
    'Opinionated Java service framework.',
  ],
  ['tech-kotlin', 'Kotlin', 'backend', 'preferred', 'Modern JVM language.'],
  ['tech-nodejs', 'Node.js', 'backend', 'supported', 'JavaScript runtime for services and BFFs.'],
  ['tech-dotnet', '.NET', 'backend', 'supported', 'Microsoft application platform.'],
  ['tech-python', 'Python', 'backend', 'supported', 'Language for data pipelines and automation.'],
  [
    'tech-struts',
    'Apache Struts 1',
    'backend',
    'retired',
    'Legacy Java web framework; unsupported.',
  ],
  ['tech-postgresql', 'PostgreSQL', 'database', 'preferred', 'Relational database.'],
  ['tech-oracle', 'Oracle Database', 'database', 'supported', 'Commercial relational database.'],
  ['tech-mongodb', 'MongoDB', 'database', 'supported', 'Document database.'],
  ['tech-redis', 'Redis', 'database', 'preferred', 'In-memory data store and cache.'],
  ['tech-elasticsearch', 'Elasticsearch', 'database', 'supported', 'Search and analytics engine.'],
  ['tech-kafka', 'Apache Kafka', 'messaging', 'preferred', 'Distributed event streaming platform.'],
  ['tech-rabbitmq', 'RabbitMQ', 'messaging', 'supported', 'Message broker for work queues.'],
  ['tech-ibm-mq', 'IBM MQ', 'messaging', 'deprecated', 'Legacy message queue; migrate to Kafka.'],
  [
    'tech-kubernetes',
    'Kubernetes',
    'infrastructure',
    'preferred',
    'Container orchestration platform.',
  ],
  ['tech-docker', 'Docker', 'infrastructure', 'preferred', 'Container image tooling.'],
  ['tech-terraform', 'Terraform', 'devops', 'preferred', 'Infrastructure as code.'],
  ['tech-aws', 'Amazon Web Services', 'infrastructure', 'preferred', 'Public cloud provider.'],
  ['tech-vmware', 'VMware vSphere', 'infrastructure', 'supported', 'On-premises virtualisation.'],
  ['tech-envoy', 'Envoy Proxy', 'infrastructure', 'preferred', 'Edge and service proxy.'],
  ['tech-gitlab-ci', 'GitLab CI', 'devops', 'preferred', 'CI/CD pipelines.'],
  ['tech-jenkins', 'Jenkins', 'devops', 'deprecated', 'Legacy CI server; migrate to GitLab CI.'],
  ['tech-prometheus', 'Prometheus', 'monitoring', 'preferred', 'Metrics collection and alerting.'],
  ['tech-grafana', 'Grafana', 'monitoring', 'preferred', 'Dashboards and observability.'],
  ['tech-playwright', 'Playwright', 'testing', 'preferred', 'End-to-end browser testing.'],
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
