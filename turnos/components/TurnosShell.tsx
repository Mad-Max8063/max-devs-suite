import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfile } from '../context/AppContext';

interface TurnosShellProps {
  children: React.ReactNode;
}

const clientRouteFragments = ['/booking', '/confirmation', '/cancel', '/login', '/register'];

function isAdminPath(pathname: string): boolean {
  if (pathname === '/') return false;
  return !clientRouteFragments.some((fragment) => pathname.includes(fragment));
}

function getSlug(pathname: string): string {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return firstSegment || 'demo';
}

const navItems = [
  { label: 'Panel', icon: 'dashboard', suffix: '' },
  { label: 'Diseno', icon: 'style', suffix: 'identidad', module: 'card' },
  { label: 'Agenda', icon: 'calendar_month', suffix: 'agenda', module: 'appointments' },
  { label: 'Horarios', icon: 'event_available', suffix: 'schedule', module: 'appointments' },
  { label: 'Ajustes', icon: 'settings_suggest', suffix: 'config' },
];

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const slug = getSlug(location.pathname);
  const activeModules = profile?.ActiveModules || ['card'];
  const visibleNavItems = navItems.filter((item) => !item.module || activeModules.includes(item.module));

  return (
    <aside className="hidden lg:flex sticky top-0 z-40 h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#121212]/72 backdrop-blur-2xl shadow-2xl">
      <div className="px-6 pb-5 pt-7">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Suito</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Turnos</h2>
        <p className="mt-1 text-xs font-semibold text-on-surface-variant">Panel de administracion</p>
      </div>

      <nav className="flex-1 space-y-2 px-4">
        {visibleNavItems.map((item) => {
          const href = item.suffix ? `/${slug}/${item.suffix}` : `/${slug}`;
          const isRoot = item.suffix === '';
          const isActive = isRoot
            ? location.pathname === href
            : location.pathname.startsWith(href);

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(href)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition-all ${
                isActive
                  ? 'border border-primary/35 bg-primary/18 text-white shadow-lg shadow-black/20'
                  : 'text-on-surface-variant hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill text-primary' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black text-white">Modo operador</p>
          <p className="mt-1 text-[11px] leading-4 text-on-surface-variant">
            Gestiona agenda, diseno y ajustes desde el panel ancho.
          </p>
        </div>
      </div>
    </aside>
  );
};

const TurnosShell: React.FC<TurnosShellProps> = ({ children }) => {
  const location = useLocation();
  const isAdminMode = isAdminPath(location.pathname);

  if (!isAdminMode) {
    return (
      <div className="min-h-screen w-full bg-[#0f0f10] selection:bg-primary/25">
        <main className="mx-auto min-h-screen w-full max-w-xl bg-surface dark:bg-background-dark shadow-2xl">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0f0f10] text-on-surface selection:bg-primary/25">
      <div className="fixed inset-0 mesh-gradient-bg opacity-[0.05]" />
      <div className="relative flex min-h-screen w-full">
        <AdminSidebar />
        <main className="min-h-screen w-full flex-1 overflow-x-hidden">
          <div className="mx-auto min-h-screen w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TurnosShell;
