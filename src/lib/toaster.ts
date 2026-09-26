import { createToaster } from '@takeoff-ui/react-spar';

/** App-wide toast controller for transient operation feedback. Mounted once in `AppProviders`. */
export const toaster = createToaster({ placement: 'bottom-end', maxVisibleToasts: 4 });
