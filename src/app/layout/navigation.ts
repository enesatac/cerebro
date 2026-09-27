import { CalendarIconOutlinedRounded } from '@takeoff-icons/react/calendar';
import { CategoryIconOutlinedRounded } from '@takeoff-icons/react/category';
import { ChartBarIconOutlinedRounded } from '@takeoff-icons/react/chart-bar';
import { DashboardIconOutlinedRounded } from '@takeoff-icons/react/dashboard';
import { DataObjectIconOutlinedRounded } from '@takeoff-icons/react/data-object';
import { FolderCopyIconOutlinedRounded } from '@takeoff-icons/react/folder-copy';
import { GroupIconOutlinedRounded } from '@takeoff-icons/react/group';
import { StructureTreeIconOutlinedRounded } from '@takeoff-icons/react/structure-tree';
import { WarningIconOutlinedRounded } from '@takeoff-icons/react/warning';
import type { ComponentType, SVGProps } from 'react';
import { paths } from '../router/paths';

export interface NavigationItem {
  label: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Match only the exact path (used for the index route). */
  end?: boolean;
}

export const PRIMARY_NAVIGATION: NavigationItem[] = [
  {
    label: 'Gösterge paneli',
    to: paths.dashboard(),
    icon: DashboardIconOutlinedRounded,
    end: true,
  },
  { label: 'Projeler', to: paths.projects.list(), icon: FolderCopyIconOutlinedRounded },
  { label: 'Uygulamalar', to: paths.applications.list(), icon: CategoryIconOutlinedRounded },
  { label: 'Bağlantılar', to: paths.architecture(), icon: StructureTreeIconOutlinedRounded },
  { label: 'Ekipler', to: paths.teams.list(), icon: GroupIconOutlinedRounded },
  { label: 'Teknolojiler', to: paths.technologies.list(), icon: DataObjectIconOutlinedRounded },
  { label: 'Riskler ve Eskalasyonlar', to: paths.risks(), icon: WarningIconOutlinedRounded },
  { label: 'İzinler', to: paths.leaves(), icon: CalendarIconOutlinedRounded },
  { label: 'Raporlar', to: paths.reports(), icon: ChartBarIconOutlinedRounded },
];
