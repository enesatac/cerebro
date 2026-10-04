import { Field, Input } from '@takeoff-ui/react-spar';
import { SearchIconOutlinedRounded } from '@takeoff-icons/react/search';
import { useState } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

interface SearchFieldProps {
  label?: string;
  placeholder: string;
  /** Committed (URL) value. */
  value: string;
  /** Called with the trimmed text after typing pauses. */
  onCommit: (value: string) => void;
  delayMs?: number;
}

/**
 * Filter-bar search box. Typing stays responsive in local state; the committed value (usually
 * the URL) updates after a pause. External changes (back button, "clear filters") are adopted.
 */
export function SearchField({
  label = 'Ara',
  placeholder,
  value,
  onCommit,
  delayMs = 300,
}: SearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  const commit = useDebouncedCallback((next: string) => onCommit(next.trim()), delayMs);

  return (
    <Field className="c-toolbar__search">
      <Field.Label>{label}</Field.Label>
      <Input size="small">
        <Input.LeadingIcon>
          <SearchIconOutlinedRounded aria-hidden="true" />
        </Input.LeadingIcon>
        <Input.Field
          type="search"
          placeholder={placeholder}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            commit(event.target.value);
          }}
        />
      </Input>
    </Field>
  );
}
