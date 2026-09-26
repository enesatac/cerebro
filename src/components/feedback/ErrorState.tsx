import { Alert, Button } from '@takeoff-ui/react-spar';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Persistent, inline error for failed loads. Transient operation feedback uses toasts instead. */
export function ErrorState({
  title = 'Bu bilgi yüklenemedi',
  description = 'Bağlantınızı kontrol edip tekrar deneyin. Sorun devam ederse Uygulama Destek ekibine başvurun.',
  onRetry,
  retryLabel = 'Tekrar dene',
}: ErrorStateProps) {
  return (
    <Alert variant="danger" appearance="outlined" role="alert" className="c-error-state">
      <Alert.Content>
        <Alert.Title level={2}>{title}</Alert.Title>
        <Alert.Description>{description}</Alert.Description>
      </Alert.Content>
      {onRetry && (
        <Alert.Actions>
          <Button size="small" variant="danger" appearance="outlined" onClick={onRetry}>
            {retryLabel}
          </Button>
        </Alert.Actions>
      )}
    </Alert>
  );
}
