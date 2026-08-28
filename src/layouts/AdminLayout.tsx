import {
  LayoutDashboard,
  Users,
  CarFront,
  Car,
  Route,
  CreditCard,
  Ticket,
  FileText,
  MapPin,
  Sparkles,
  BarChart3,
  Bell,
  Shield,
  KeyRound,
  ScrollText,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Music2,
  Megaphone,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/store/auth.store';
import { useUiStore } from '@/shared/store/ui.store';
import { cn } from '@/shared/lib/cn';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/drivers', label: 'Drivers', icon: CarFront },
  { to: '/vehicles', label: 'Vehicles', icon: Car },
  { to: '/trips', label: 'Trips', icon: Route },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/coupons', label: 'Coupons', icon: Ticket },
  { to: '/locations', label: 'Locations', icon: MapPin },
  { to: '/recommended-places', label: 'Recommended Places', icon: Sparkles },
  { to: '/cms', label: 'CMS', icon: FileText },
  { to: '/ringtones', label: 'Ride Ringtones', icon: Music2 },
  { to: '/ad-banners', label: 'Ad Banners', icon: Megaphone },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/roles', label: 'Roles', icon: Shield },
  { to: '/permissions', label: 'Permissions', icon: KeyRound },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <div className="min-h-screen bg-admin-bg">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-admin-sidebar text-admin-sidebar-ink transition-all duration-200',
          collapsed ? 'w-[76px]' : 'w-64',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-4">
          <img
            src="/logo.png"
            alt="Ridezo"
            className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/20"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold lowercase text-white">ridezo</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-admin-teal-soft">
                Admin
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-admin-teal text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
            onClick={() => {
              if (!window.confirm('Are you sure you want to sign out?')) return;
              clearAuth();
              navigate('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className={cn('transition-all duration-200', collapsed ? 'ml-[76px]' : 'ml-64')}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-admin-line bg-admin-panel/90 px-6 backdrop-blur">
          <button
            type="button"
            className="admin-btn-ghost h-9 w-9 px-0"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
          <div className="text-right">
            <p className="text-sm font-semibold text-admin-ink">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-admin-muted">{user?.roles[0] ?? 'Admin'}</p>
          </div>
        </header>
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
