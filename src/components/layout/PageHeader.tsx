import { Breadcrumb } from '@takeoff-ui/react-spar';
import { Fragment, type ReactNode } from 'react';
import { Link } from 'react-router';

export interface BreadcrumbEntry {
  label: string;
  /** Omit for the current page. */
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  breadcrumbs?: BreadcrumbEntry[];
  /** Status badges and key identifiers shown under the title. */
  meta?: ReactNode;
  /** Primary and secondary page actions (right-aligned). */
  actions?: ReactNode;
}

/** The single page-title pattern: optional breadcrumb, one `h1`, subtitle, meta and actions. */
export function PageHeader({ title, subtitle, breadcrumbs, meta, actions }: PageHeaderProps) {
  return (
    <header className="c-page-header">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb aria-label="Breadcrumb" className="c-page-header__breadcrumb">
          <Breadcrumb.List>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <Breadcrumb.Separator />}
                <Breadcrumb.Item>
                  {crumb.to ? (
                    <Breadcrumb.Link as={Link} to={crumb.to}>
                      {crumb.label}
                    </Breadcrumb.Link>
                  ) : (
                    <Breadcrumb.Page>{crumb.label}</Breadcrumb.Page>
                  )}
                </Breadcrumb.Item>
              </Fragment>
            ))}
          </Breadcrumb.List>
        </Breadcrumb>
      )}
      <div className="c-page-header__row">
        <div className="c-page-header__heading">
          <h1 className="c-page-header__title">{title}</h1>
          {subtitle && <p className="c-page-header__subtitle">{subtitle}</p>}
          {meta && <div className="c-page-header__meta">{meta}</div>}
        </div>
        {actions && <div className="c-page-header__actions">{actions}</div>}
      </div>
    </header>
  );
}
