import { Input } from '@takeoff-ui/react-spar';
import { SearchIconOutlinedRounded } from '@takeoff-icons/react/search';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '../router/paths';

export function GlobalSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = term.trim();
    if (trimmed) void navigate(paths.search(trimmed));
  };

  return (
    <form role="search" className="c-global-search" onSubmit={submit}>
      <Input size="small">
        <Input.LeadingIcon>
          <SearchIconOutlinedRounded aria-hidden="true" />
        </Input.LeadingIcon>
        <Input.Field
          type="search"
          aria-label="Search applications, projects, teams and people"
          placeholder="Search Cerebro…"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
      </Input>
    </form>
  );
}
