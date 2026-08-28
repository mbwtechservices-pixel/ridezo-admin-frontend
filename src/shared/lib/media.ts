const API_ORIGIN = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.PROD
    ? 'https://ridezo-backend.onrender.com/api/v1'
    : 'http://localhost:4000/api/v1')
).replace(/\/api\/v\d+$/, '');

export function resolveMediaUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}
