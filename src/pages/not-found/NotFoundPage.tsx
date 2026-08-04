import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-admin-bg px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-admin-teal text-lg font-bold text-white">
        R
      </div>
      <h1 className="text-2xl font-bold text-admin-ink">Page not found</h1>
      <p className="max-w-sm text-sm text-admin-muted">
        That admin route does not exist. Return to the dashboard.
      </p>
      <Link to="/" className="admin-btn-primary">
        Go to dashboard
      </Link>
    </div>
  );
}
