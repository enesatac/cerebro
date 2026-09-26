import type { BusinessUnit } from '@/domains/business-units/types';

export const businessUnits: BusinessUnit[] = [
  {
    id: 'bu-digital-channels',
    code: 'DCH',
    name: 'Digital Channels',
    description: 'Customer-facing web and mobile channels, commerce and loyalty.',
    headId: 'person-elif-kaya',
  },
  {
    id: 'bu-finance',
    code: 'FIN',
    name: 'Finance & Treasury',
    description: 'Payments, accounting, settlement and financial reporting.',
    headId: 'person-hannah-schulz',
  },
  {
    id: 'bu-operations',
    code: 'OPS',
    name: 'Operations',
    description: 'Flight, crew and ground operations planning and control.',
    headId: 'person-omar-haddad',
  },
  {
    id: 'bu-people-workplace',
    code: 'PWP',
    name: 'People & Workplace',
    description: 'HR, employee services and internal collaboration.',
    headId: 'person-claire-dubois',
  },
  {
    id: 'bu-technology',
    code: 'TEC',
    name: 'Technology Platforms',
    description: 'Shared platforms: identity, integration, data and messaging.',
    headId: 'person-can-ozturk',
  },
];
