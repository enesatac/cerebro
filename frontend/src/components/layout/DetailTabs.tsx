import { Tabs } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';

export interface DetailTab<T extends string> {
  id: T;
  label: string;
  /** Shown as "(n)" after the label when known without extra loading. */
  count?: number | null;
}

interface DetailTabsProps<T extends string> {
  /** Accessible name of the tab list, e.g. "Application sections". */
  label: string;
  tabs: readonly DetailTab<T>[];
  active: T;
  onSelect: (tab: string) => void;
  /** Renders only the active panel so each tab loads its data lazily. */
  renderPanel: (tab: T) => ReactNode;
}

/** Takeoff `Tabs` configured for detail pages. */
export function DetailTabs<T extends string>({
  label,
  tabs,
  active,
  onSelect,
  renderPanel,
}: DetailTabsProps<T>) {
  return (
    <Tabs value={active} onValueChange={onSelect} size="small" className="c-detail-tabs">
      <Tabs.List aria-label={label} className="c-detail-tabs__list">
        {tabs.map((tab) => (
          <Tabs.Trigger key={tab.id} value={tab.id}>
            {tab.label}
            {tab.count != null && <span className="c-tab-count"> ({tab.count})</span>}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.id} value={tab.id} className="c-detail-tabs__panel">
          {active === tab.id && renderPanel(tab.id)}
        </Tabs.Content>
      ))}
    </Tabs>
  );
}
