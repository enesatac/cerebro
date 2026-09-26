import type { DependencyType, IntegrationFrequency, IntegrationType } from '../types';

export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, string> = {
  runtime: 'Çalışma zamanı',
  authentication: 'Kimlik doğrulama',
  data: 'Veri',
  messaging: 'Mesajlaşma',
  batch: 'Toplu iş',
  build: 'Derleme',
};

export const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  'rest-api': 'REST API',
  soap: 'SOAP',
  graphql: 'GraphQL',
  kafka: 'Kafka',
  rabbitmq: 'RabbitMQ',
  database: 'Veritabanı',
  'file-transfer': 'Dosya aktarımı',
  batch: 'Toplu iş',
  event: 'Olay',
  other: 'Diğer',
};

export const INTEGRATION_FREQUENCY_LABELS: Record<IntegrationFrequency, string> = {
  'real-time': 'Gerçek zamanlı',
  'near-real-time': 'Gerçek zamana yakın',
  hourly: 'Saatlik',
  daily: 'Günlük',
  'on-demand': 'İsteğe bağlı',
};
