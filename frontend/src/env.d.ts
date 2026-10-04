/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** `http` uses the Cerebro API (../backend); anything else the in-browser demo data. */
  readonly VITE_DATA_SOURCE?: string;
  /** API origin when it is not the same origin as the app (default: same origin, `/api`). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
