import { Alert } from '@takeoff-ui/react-spar';
import { formatDate, toIsoDate } from '@/lib/dates';
import type { Contract } from '../types';
import { contractAlerts } from '../utils/contractSchedule';

/** The contract's warnings (ending, notice deadline, overdue payments) as page alerts. */
export function ContractAlerts({ contract }: { contract: Contract }) {
  const alerts = contractAlerts(contract, toIsoDate(new Date()));
  if (alerts.length === 0) return null;
  return (
    <div className="c-stack c-stack--s" role="region" aria-label="Sözleşme uyarıları">
      {alerts.map((alert) => (
        <Alert key={alert.kind} variant={alert.tone} appearance="outlined">
          <Alert.Content>
            <Alert.Description>
              <strong>{formatDate(alert.date)}:</strong> {alert.message}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ))}
    </div>
  );
}
