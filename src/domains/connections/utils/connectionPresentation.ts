import type { DependencyType, IntegrationFrequency, IntegrationType } from '../types';

export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, string> = {
  runtime: 'Runtime',
  authentication: 'Authentication',
  data: 'Data',
  messaging: 'Messaging',
  batch: 'Batch',
  build: 'Build',
};

export const INTEGRATION_TYPE_LABELS: Record<IntegrationType, string> = {
  'rest-api': 'REST API',
  soap: 'SOAP',
  graphql: 'GraphQL',
  kafka: 'Kafka',
  rabbitmq: 'RabbitMQ',
  database: 'Database',
  'file-transfer': 'File transfer',
  batch: 'Batch',
  event: 'Event',
  other: 'Other',
};

export const INTEGRATION_FREQUENCY_LABELS: Record<IntegrationFrequency, string> = {
  'real-time': 'Real time',
  'near-real-time': 'Near real time',
  hourly: 'Hourly',
  daily: 'Daily',
  'on-demand': 'On demand',
};
