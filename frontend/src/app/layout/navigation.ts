import { AlignLeftIconOutlinedRounded } from '@takeoff-icons/react/align-left';
import { BulbIconOutlinedRounded } from '@takeoff-icons/react/bulb';
import { CalendarIconOutlinedRounded } from '@takeoff-icons/react/calendar';
import { CategoryIconOutlinedRounded } from '@takeoff-icons/react/category';
import { ChartBarIconOutlinedRounded } from '@takeoff-icons/react/chart-bar';
import { DashboardIconOutlinedRounded } from '@takeoff-icons/react/dashboard';
import { DataObjectIconOutlinedRounded } from '@takeoff-icons/react/data-object';
import { FlagIconOutlinedRounded } from '@takeoff-icons/react/flag';
import { FolderCopyIconOutlinedRounded } from '@takeoff-icons/react/folder-copy';
import { GroupIconOutlinedRounded } from '@takeoff-icons/react/group';
import { KeyIconOutlinedRounded } from '@takeoff-icons/react/key';
import { ShoppingBagIconOutlinedRounded } from '@takeoff-icons/react/shopping-bag';
import { StructureTreeIconOutlinedRounded } from '@takeoff-icons/react/structure-tree';
import { TruckIconOutlinedRounded } from '@takeoff-icons/react/truck';
import { UserSettingsIconOutlinedRounded } from '@takeoff-icons/react/user-settings';
import { WarningIconOutlinedRounded } from '@takeoff-icons/react/warning';
import type { ComponentType, SVGProps } from 'react';
import type { Privilege } from '@/domains/auth/types';
import { paths } from '../router/paths';

export interface NavigationItem {
  label: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** The screen's view privilege; the item is listed only for roles holding it. */
  privilege: Privilege;
  /** Match only the exact path (used for the index route). */
  end?: boolean;
}

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  {
    label: 'Gösterge paneli',
    to: paths.dashboard(),
    icon: DashboardIconOutlinedRounded,
    privilege: 'dashboard:view',
    end: true,
  },
  {
    label: 'Talepler',
    to: paths.demands.list(),
    icon: BulbIconOutlinedRounded,
    privilege: 'demands:view',
    end: true,
  },
  {
    label: 'Talep yönetimi',
    to: paths.demands.manage(),
    icon: FlagIconOutlinedRounded,
    privilege: 'demandManagement:view',
  },
  {
    label: 'Projeler',
    to: paths.projects.list(),
    icon: FolderCopyIconOutlinedRounded,
    privilege: 'projects:view',
  },
  {
    label: 'Sözleşmeler',
    to: paths.contracts.list(),
    icon: ShoppingBagIconOutlinedRounded,
    privilege: 'contracts:view',
  },
  {
    label: 'Satın alma takibi',
    to: paths.procurement.list(),
    icon: TruckIconOutlinedRounded,
    privilege: 'procurement:view',
  },
  {
    label: 'Uygulamalar',
    to: paths.applications.list(),
    icon: CategoryIconOutlinedRounded,
    privilege: 'applications:view',
  },
  {
    label: 'Bağlantılar',
    to: paths.architecture(),
    icon: StructureTreeIconOutlinedRounded,
    privilege: 'connections:view',
  },
  {
    label: 'Ekipler',
    to: paths.teams.list(),
    icon: GroupIconOutlinedRounded,
    privilege: 'teams:view',
  },
  {
    label: 'Teknolojiler',
    to: paths.technologies.list(),
    icon: DataObjectIconOutlinedRounded,
    privilege: 'technologies:view',
  },
  {
    label: 'Riskler ve Eskalasyonlar',
    to: paths.risks(),
    icon: WarningIconOutlinedRounded,
    privilege: 'risks:view',
  },
  {
    label: 'Kaynak planı',
    to: paths.resources(),
    icon: AlignLeftIconOutlinedRounded,
    privilege: 'resources:view',
  },
  {
    label: 'İzinler',
    to: paths.leaves(),
    icon: CalendarIconOutlinedRounded,
    privilege: 'leaves:view',
  },
  {
    label: 'Raporlar',
    to: paths.reports(),
    icon: ChartBarIconOutlinedRounded,
    privilege: 'reports:view',
  },
];

export const ADMIN_NAVIGATION: NavigationItem[] = [
  {
    label: 'Ana veriler',
    to: paths.admin.masterData(),
    icon: DataObjectIconOutlinedRounded,
    privilege: 'masterData:view',
  },
  {
    label: 'Kullanıcılar',
    to: paths.admin.users(),
    icon: UserSettingsIconOutlinedRounded,
    privilege: 'users:view',
  },
  {
    label: 'Roller ve yetkiler',
    to: paths.admin.roles(),
    icon: KeyIconOutlinedRounded,
    privilege: 'roles:view',
  },
];
