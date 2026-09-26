import { Card } from '@takeoff-ui/react-spar';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  /** Short line explaining what the section answers. */
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Heading level for the section title (defaults to h2 under the page h1). */
  level?: 2 | 3 | 4;
}

/** A titled content section on detail pages, built on Takeoff `Card`. */
export function SectionCard({
  title,
  description,
  actions,
  children,
  level = 2,
}: SectionCardProps) {
  return (
    <Card className="c-section-card">
      <Card.Header headerType="divided" className="c-section-card__header">
        <div>
          <Card.Title level={level} className="c-section-card__title">
            {title}
          </Card.Title>
          {description && (
            <Card.Description className="c-section-card__description">
              {description}
            </Card.Description>
          )}
        </div>
        {actions}
      </Card.Header>
      <Card.Body className="c-section-card__body">{children}</Card.Body>
    </Card>
  );
}
