import { Button } from '@takeoff-ui/react-spar';
import { AddIconOutlinedRounded } from '@takeoff-icons/react/add';
import { ArrowBottomIconOutlinedRounded } from '@takeoff-icons/react/arrow-bottom';
import { ArrowTopIconOutlinedRounded } from '@takeoff-icons/react/arrow-top';
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
  /** When given, rows get move up / down buttons (for lists whose order matters). */
  onMove?: (from: number, to: number) => void;
  /** Accessible name prefix for the move buttons, e.g. "2. kişi". */
  itemLabel?: (index: number) => string;
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
  onMove,
  itemLabel = (index) => `${index + 1}. satır`,
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
              <div className="c-repeatable__controls">
                {onMove && (
                  <>
                    <Button
                      type="button"
                      size="small"
                      variant="neutral"
                      appearance="text"
                      startContent={<ArrowTopIconOutlinedRounded aria-hidden="true" />}
                      aria-label={`${itemLabel(index)}: yukarı taşı`}
                      disabled={index === 0}
                      onClick={() => onMove(index, index - 1)}
                    />
                    <Button
                      type="button"
                      size="small"
                      variant="neutral"
                      appearance="text"
                      startContent={<ArrowBottomIconOutlinedRounded aria-hidden="true" />}
                      aria-label={`${itemLabel(index)}: aşağı taşı`}
                      disabled={index === items.length - 1}
                      onClick={() => onMove(index, index + 1)}
                    />
                  </>
                )}
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
              </div>
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
