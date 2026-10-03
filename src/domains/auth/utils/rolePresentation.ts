import type { StatusPresentation } from '@/domains/shared/utils/presentation';
import type { UserRole } from '../types';

export const ROLE_PRESENTATION: Record<UserRole, StatusPresentation & { description: string }> = {
  admin: {
    label: 'Yönetici',
    variant: 'primary',
    description: 'Her şeyi oluşturabilir, düzenleyebilir, silebilir ve kullanıcıları yönetebilir.',
  },
  user: {
    label: 'Kullanıcı',
    variant: 'neutral',
    description:
      'Her şeyi görüntüleyebilir ve talep açabilir; kendi taleplerini karar verilene kadar düzenleyebilir. Diğer kayıtları değiştiremez.',
  },
};

export const ACCOUNT_STATUS_PRESENTATION: Record<'active' | 'inactive', StatusPresentation> = {
  active: { label: 'Aktif', variant: 'success' },
  inactive: { label: 'Devre dışı', variant: 'neutral' },
};
