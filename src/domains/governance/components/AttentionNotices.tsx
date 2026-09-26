import { Alert, Button } from '@takeoff-ui/react-spar';
import { useEscalations } from '@/domains/escalations/api/queries';
import { isActiveEscalation } from '@/domains/escalations/utils/escalationPresentation';
import { pluralize } from '@/lib/format';
import type { RelatedEntityFilter } from '@/domains/risks/types';
import type { AuditMetadata } from '@/domains/shared/types';
import { getReviewState, REVIEW_INTERVAL_DAYS } from '../utils/staleness';

interface AttentionNoticesProps {
  /** Which application or project the notices are for. */
  filter: RelatedEntityFilter;
  audit: Pick<AuditMetadata, 'lastReviewedAt'>;
  /** "application" / "project" — used in the copy. */
  entityLabel: string;
  onOpenRisks: () => void;
}

/**
 * Surfaces what needs attention without alarming the whole page: one notice for active
 * escalations and one for review staleness. Nothing renders when all is well.
 */
export function AttentionNotices({
  filter,
  audit,
  entityLabel,
  onOpenRisks,
}: AttentionNoticesProps) {
  const escalations = useEscalations(filter);
  const active = (escalations.data ?? []).filter((escalation) =>
    isActiveEscalation(escalation.status),
  );
  const hasCritical = active.some((escalation) => escalation.severity === 'critical');
  const review = getReviewState(audit);

  if (active.length === 0 && review.kind === 'current') return null;

  return (
    <div className="c-stack c-stack--s">
      {active.length > 0 && (
        <Alert variant={hasCritical ? 'danger' : 'warning'} appearance="outlined">
          <Alert.Content>
            <Alert.Title level={2}>{pluralize(active.length, 'active escalation')}</Alert.Title>
            <Alert.Description>
              {active.map((escalation) => escalation.title).join(' · ')}
            </Alert.Description>
          </Alert.Content>
          <Alert.Actions>
            <Button
              size="small"
              appearance="text"
              variant={hasCritical ? 'danger' : 'warning'}
              onClick={onOpenRisks}
            >
              View escalations
            </Button>
          </Alert.Actions>
        </Alert>
      )}
      {review.kind !== 'current' && (
        <Alert variant="info" appearance="outlined">
          <Alert.Content>
            <Alert.Title level={2}>Information may be out of date</Alert.Title>
            <Alert.Description>
              {review.kind === 'never-reviewed'
                ? `This ${entityLabel} has never been reviewed by its owners.`
                : `Last reviewed ${review.daysSinceReview} days ago — reviews are expected every ${REVIEW_INTERVAL_DAYS} days.`}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </div>
  );
}
