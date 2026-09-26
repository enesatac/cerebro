import { Button } from '@takeoff-ui/react-spar';
import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { DeleteIconOutlinedRounded } from '@takeoff-icons/react/delete';
import type { ReactNode } from 'react';

interface RepeatableListProps {
  /** `fields` from `useFieldArray` (their `id` is the stable React key). */
  items: readonly { id: string }[];
  renderItem: (index: number) => ReactNode;
  /** Accessible name of each row's remove button, e.g. "Remove environment 2". */
  removeLabel: (index: number) => string;
  onRemove: (index: number) => void;
  onAdd: () => void;
  addLabel: string;
  emptyText: string;
  /** Validation message for the list as a whole (e.g. "Add at least one…"). */
  error?: string;
}

/** A dynamic list of grouped fields with add/remove controls (environments, milestones…). */
export function RepeatableList({
  items,
  renderItem,
  removeLabel,
  onRemove,
  onAdd,
  addLabel,
  emptyText,
  error,
}: RepeatableListProps) {
  return (
    <div className="c-repeatable">
      {items.length === 0 ? (
        <p className="c-muted c-repeatable__empty">{emptyText}</p>
      ) : (
        <ol className="c-repeatable__list">
          {items.map((item, index) => (
            <li key={item.id} className="c-repeatable__item">
              <div className="c-repeatable__fields">{renderItem(index)}</div>
              <Button
                type="button"
                size="small"
                variant="neutral"
                appearance="text"
                startContent={<DeleteIconOutlinedRounded aria-hidden="true" />}
                aria-label={removeLabel(index)}
                onClick={() => onRemove(index)}
                className="c-repeatable__remove"
              />
            </li>
          ))}
        </ol>
      )}
      {error && (
        <p className="c-form-error" role="alert">
          {error}
        </p>
      )}
      <Button
        type="button"
        size="small"
        variant="neutral"
        appearance="outlined"
        startContent={<AddIconOutlinedRounded aria-hidden="true" />}
        onClick={onAdd}
      >
        {addLabel}
      </Button>
    </div>
  );
}
