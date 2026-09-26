import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { UserRole } from '../types';

export const ROLE_PRESENTATION: Record<UserRole, StatusPresentation & { description: string }> = {
  admin: {
    label: 'Admin',
    variant: 'primary',
    description: 'Can create, edit and delete everything and manage users.',
  },
  user: {
    label: 'User',
    variant: 'neutral',
    description: 'Can view everything. Cannot make changes.',
  },
};

export const ACCOUNT_STATUS_PRESENTATION: Record<'active' | 'inactive', StatusPresentation> = {
  active: { label: 'Active', variant: 'success' },
  inactive: { label: 'Deactivated', variant: 'neutral' },
};
