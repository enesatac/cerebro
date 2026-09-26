import { ButtonLink } from '../actions/ButtonLink';
import { EmptyState } from './EmptyState';

interface PermissionDeniedStateProps {
  /** What the user tried to do, e.g. "uygulama düzenleme". */
  action: string;
  backTo: string;
  backLabel: string;
}

export function PermissionDeniedState({ action, backTo, backLabel }: PermissionDeniedStateProps) {
  return (
    <div className="c-not-found">
      <h1 className="c-page-header__title">Erişim yetkiniz yok</h1>
      <EmptyState
        title={`Rolünüz şu işleme izin vermiyor: ${action}`}
        description="Bu erişime ihtiyacınız varsa bir Cerebro yöneticisine başvurun."
        action={
          <ButtonLink to={backTo} variant="neutral" appearance="outlined">
            {backLabel}
          </ButtonLink>
        }
      />
    </div>
  );
}
