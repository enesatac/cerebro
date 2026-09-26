import { Button, Dropdown } from '@takeoff-ui/react-spar';
import { ChevronBottomIconOutlinedRounded } from '@takeoff-icons/react/chevron-bottom';
import { useNavigate } from 'react-router';

export interface ActionMenuItem {
  label: string;
  to: string;
}

/** Secondary page actions ("Add risk", "Record decision"…) kept out of the primary header row. */
export function ActionMenu({
  label = 'More actions',
  items,
}: {
  label?: string;
  items: ActionMenuItem[];
}) {
  const navigate = useNavigate();
  if (items.length === 0) return null;
  return (
    <Dropdown>
      <Dropdown.Trigger
        as={Button}
        variant="neutral"
        appearance="outlined"
        endContent={<ChevronBottomIconOutlinedRounded aria-hidden="true" />}
      >
        {label}
      </Dropdown.Trigger>
      <Dropdown.Content align="end">
        {items.map((item) => (
          <Dropdown.Item key={item.to} onSelect={() => void navigate(item.to)}>
            {item.label}
          </Dropdown.Item>
        ))}
      </Dropdown.Content>
    </Dropdown>
  );
}
