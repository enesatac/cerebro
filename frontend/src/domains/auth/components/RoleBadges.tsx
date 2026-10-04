import { Badge } from '@takeoff-ui/react-spar';

/** A user's role names as small badges. */
export function RoleBadges({ names }: { names: readonly string[] }) {
  if (names.length === 0) return <span className="c-muted">Rol yok</span>;
  return (
    <ul className="c-inline-list" aria-label="Roller">
      {names.map((name) => (
        <li key={name}>
          <Badge variant="neutral" appearance="filledLight" size="small">
            {name}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
