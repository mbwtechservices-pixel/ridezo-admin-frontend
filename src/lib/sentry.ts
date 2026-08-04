import * as Sentry from '@sentry/react';

export function initClientSentry(appName: string): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    sendDefaultPii: false,
    initialScope: { tags: { app: appName } },
  });
}
