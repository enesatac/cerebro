import { Badge } from '@takeoff-ui/react-spar';

export function TagList({ tags }: { tags: readonly string[] }) {
  return (
    <ul className="c-inline-list" aria-label="Tags">
      {tags.map((tag) => (
        <li key={tag}>
          <Badge variant="neutral" appearance="outlined" size="small">
            {tag}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
