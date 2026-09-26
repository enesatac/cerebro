import { AuditHistory } from '@/domains/governance/components/AuditHistory';
import type { Application } from '../../types';

export function HistoryTab({ application }: { application: Application }) {
  return <AuditHistory audit={application.audit} />;
}
