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
  { label: 'Dashboard', to: paths.dashboard(), icon: DashboardIconOutlinedRounded, end: true },
  { label: 'Projects', to: paths.projects.list(), icon: FolderCopyIconOutlinedRounded },
  { label: 'Applications', to: paths.applications.list(), icon: CategoryIconOutlinedRounded },
  { label: 'Connections', to: paths.architecture(), icon: StructureTreeIconOutlinedRounded },
  { label: 'Teams', to: paths.teams.list(), icon: GroupIconOutlinedRounded },
  { label: 'Technologies', to: paths.technologies.list(), icon: DataObjectIconOutlinedRounded },
  { label: 'Risks & Escalations', to: paths.risks(), icon: WarningIconOutlinedRounded },
  { label: 'Reports', to: paths.reports(), icon: ChartBarIconOutlinedRounded },
];
