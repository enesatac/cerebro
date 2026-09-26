import { Progress } from '@takeoff-ui/react-spar';
import { DetailList } from '@/components/data-display/DetailList';
import { TagList } from '@/components/data-display/TagList';
import { SectionCard } from '@/components/layout/SectionCard';
import { StakeholderList } from '@/domains/people/components/StakeholderList';
import { formatInteger } from '@/lib/format';
import type { Application } from '../../types';
import { evaluateApplicationCompleteness } from '../../utils/applicationCompleteness';
import { APPLICATION_TYPE_LABELS } from '../../utils/applicationPresentation';

export function OverviewTab({ application }: { application: Application }) {
  return (
    <div className="c-two-column">
      <div className="c-stack">
        <AboutSection application={application} />
        <OwnershipSection application={application} />
      </div>
      <div className="c-stack">
        <CompletenessSection application={application} />
      </div>
    </div>
  );
}

function AboutSection({ application }: { application: Application }) {
  return (
    <SectionCard title="About">
      <p className="c-prose">{application.detailedDescription}</p>
      <DetailList
        items={[
          { label: 'Business purpose', value: application.businessPurpose },
          { label: 'Application type', value: APPLICATION_TYPE_LABELS[application.type] },
          { label: 'Business processes', value: application.businessProcesses.join(', ') },
          { label: 'User groups', value: application.userGroups.join(', ') },
          { label: 'Estimated users', value: formatInteger(application.estimatedUserCount, '') },
          {
            label: 'Tags',
            value: application.tags.length > 0 ? <TagList tags={application.tags} /> : null,
          },
        ]}
      />
    </SectionCard>
  );
}

function OwnershipSection({ application }: { application: Application }) {
  return (
    <SectionCard title="Ownership & contacts" description="Who to contact about this application.">
      <StakeholderList roles={application.roles} teams={application.teams} />
    </SectionCard>
  );
}

function CompletenessSection({ application }: { application: Application }) {
  const report = evaluateApplicationCompleteness(application);
  const variant = report.score >= 90 ? 'success' : report.score >= 70 ? 'warning' : 'danger';

  return (
    <SectionCard
      title="Information completeness"
      description="Weighted share of the data-quality rules this record meets."
    >
      <div className="c-completeness">
        <span className="c-completeness__score">{report.score}%</span>
        <Progress
          value={report.score}
          variant={variant}
          aria-label={`Information completeness ${report.score}%`}
        />
      </div>
      {report.missing.length === 0 ? (
        <p className="c-muted">All completeness rules are met.</p>
      ) : (
        <ul className="c-rule-list" aria-label="Missing information">
          {report.missing.map((rule) => (
            <li key={rule.id} className="c-rule-list__item">
              <span className="c-rule-list__label">
                {rule.label}
                {rule.importance === 'required' && (
                  <span className="c-text-warning"> · required</span>
                )}
              </span>
              <span className="c-muted">{rule.description}</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
