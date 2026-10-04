import type { ReactNode } from 'react';

interface ToolbarProps {
  /** Accessible name for the group of controls, e.g. "Filter applications". */
  label: string;
  children: ReactNode;
  /** Right-aligned secondary content (result counts, reset buttons). */
  end?: ReactNode;
  /** Optional create action shown after the result summary. */
  add?: ReactNode;
}

export function Toolbar({ label, children, end, add }: ToolbarProps) {
  return (
    <div className="c-toolbar">
      <div className="c-toolbar__controls" role="group" aria-label={label}>
        {children}
      </div>
      {(end || add) && (
        <div className="c-toolbar__end">
          {end}
          {add}
        </div>
      )}
    </div>
  );
}
