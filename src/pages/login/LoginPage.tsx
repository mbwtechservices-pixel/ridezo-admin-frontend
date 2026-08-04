import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { adminLogin } from '@/shared/api/auth.api';
import { useAuthStore, type AdminProfile } from '@/shared/store/auth.store';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password required'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@ridezo.com', password: 'Admin@123' },
  });

  if (isAuthenticated) return <Navigate to="/" replace />;

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError('');
    try {
      const result = await adminLogin(values);
      const user: AdminProfile = {
        id: result.admin.id,
        email: result.admin.email,
        firstName: result.admin.firstName,
        lastName: result.admin.lastName,
        roles: result.admin.roleIds.length ? result.admin.roleIds : ['Admin'],
        permissions: result.admin.permissions.length ? result.admin.permissions : ['*'],
      };
      setAuth(user, result.tokens.accessToken, result.tokens.refreshToken);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Sign in failed. Use admin@ridezo.com / Admin@123',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-admin-sidebar px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(20,184,166,0.35), transparent 40%), radial-gradient(circle at 80% 10%, rgba(2,132,199,0.25), transparent 35%)',
        }}
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl"
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-admin-teal text-lg font-bold text-white">
            R
          </div>
          <div>
            <h1 className="text-xl font-bold text-admin-ink">Ridezo Admin</h1>
            <p className="text-sm text-admin-muted">Enterprise control center</p>
          </div>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-sm font-medium text-admin-muted">Email</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
            <input className="admin-input pl-9" type="email" {...register('email')} />
          </span>
          {errors.email && (
            <span className="mt-1 block text-xs text-admin-rose">{errors.email.message}</span>
          )}
        </label>

        <label className="mb-6 block">
          <span className="mb-1.5 block text-sm font-medium text-admin-muted">Password</span>
          <span className="relative block">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
            <input className="admin-input pl-9" type="password" {...register('password')} />
          </span>
          {errors.password && (
            <span className="mt-1 block text-xs text-admin-rose">{errors.password.message}</span>
          )}
        </label>

        <button type="submit" className="admin-btn-primary w-full" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p className="mt-3 text-center text-sm text-admin-rose">{error}</p>}
        <p className="mt-4 text-center text-xs text-admin-muted">
          Default: admin@ridezo.com / Admin@123
        </p>
      </form>
    </div>
  );
}
