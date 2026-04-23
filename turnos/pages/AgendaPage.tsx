import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTurnos } from '../hooks/useTurnos';
import { useTenant } from '../context/TenantContext';
import BottomNavigation from '../components/BottomNavigation';
import DemoBanner from '../components/DemoBanner';

const AgendaPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, tenantSlug: slug, isLoading: tenantLoading, isInvalid: tenantInvalid } = useTenant();
  const [filter, setFilter] = useState<'Pendiente' | 'Confirmado' | 'all'>('Pendiente');

  // TanStack Query v5: El tenantId (UUID) en la queryKey garantiza aislamiento total entre inquilinos
  const { 
    data: appointments = [], 
    isLoading: queryLoading, 
    isError, 
    error: queryError, 
    refetch 
  } = useTurnos(filter);

  const isLoading = tenantLoading || queryLoading;

  // Agrupación por fecha (Hoy vs Futuro)
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = useMemo(() => appointments.filter(apt => apt.Fecha === today), [appointments, today]);
  const futureAppointments = useMemo(() => appointments.filter(apt => apt.Fecha > today), [appointments, today]);

  // Estadísticas rápidas (derivadas de la caché actual para eficiencia de red)
  const stats = useMemo(() => {
    const pending = appointments.filter(a => a.Estado === 'Pendiente').length;
    const confirmed = appointments.filter(a => a.Estado === 'Confirmado').length;
    const earnings = appointments
      .filter(a => a.Estado === 'Confirmado')
      .reduce((sum, a) => sum + (a.MontoSena || 0), 0);
    
    return { pending, confirmed, earnings, todayCount: todayAppointments.length };
  }, [appointments, todayAppointments.length]);

  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      {slug && <DemoBanner slug={slug} />}

      {/* Header con Estado de Carga */}
      <header className="flex items-center px-4 py-3 justify-between bg-surface-light dark:bg-surface-dark sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="text-primary bg-primary/10 rounded-full p-2 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
          </div>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-center">Agenda</h2>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center justify-center rounded-full p-2 text-text-primary-light dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </header>

      {/* Mini Stats Row */}
      <div className="bg-surface-light dark:bg-surface-dark px-4 pt-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-3 gap-2">
          <StatCard value={stats.todayCount} label="hoy" color="primary" />
          <StatCard value={stats.pending} label="a validar" color="amber" />
          <StatCard 
            value={stats.earnings > 0 ? `$${stats.earnings.toLocaleString('es-AR')}` : '—'} 
            label="cobrado" 
            color="emerald" 
          />
        </div>
      </div>

      {/* Filtros Multi-tenant */}
      <div className="px-4 py-3 bg-surface-light dark:bg-surface-dark border-b border-gray-50 dark:border-gray-800/50">
        <div className="flex h-10 w-full items-center justify-center rounded-lg bg-[#f3f0f4] dark:bg-gray-800 p-1">
          <FilterButton 
            active={filter === 'Pendiente'} 
            onClick={() => setFilter('Pendiente')} 
            label="Pendientes" 
            count={stats.pending} 
            badgeColor="orange"
          />
          <FilterButton 
            active={filter === 'Confirmado'} 
            onClick={() => setFilter('Confirmado')} 
            label="Confirmados" 
            count={stats.confirmed} 
            badgeColor="emerald"
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-6">
          <div className="mt-3 mb-1 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex gap-3 items-start border border-blue-100 dark:border-blue-800">
            <span className="material-symbols-outlined text-blue-500 text-[18px] mt-0.5 shrink-0">info</span>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Chequeá tu Mercado Pago. Si recibiste la seña, entrá al turno y marcalo como <b>Confirmado</b> ✅
            </p>
          </div>

          {isLoading && <AgendaSkeleton />}

          {tenantInvalid && (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="size-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-4xl text-red-500">error</span>
              </div>
              <h3 className="font-bold text-lg mb-1">Acceso Denegado</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[260px] leading-relaxed">
                No pudimos validar tu acceso a este negocio. Por favor, verificá la URL.
              </p>
            </div>
          )}

          {isError && !tenantInvalid && (
            <div className="mx-4 mt-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800 animate-in fade-in zoom-in duration-300">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                No pudimos cargar tu agenda. Por favor, reintenta en unos momentos.
              </p>
              <p className="text-[10px] text-red-400 mt-1 opacity-70">
                PostgREST Code: {(queryError as any)?.code || 'NETWORK_FAILURE'}
              </p>
            </div>
          )}

          {!isLoading && !isError && !tenantInvalid && appointments.length === 0 && (
            <EmptyAgendaState filter={filter} />
          )}

          {!isLoading && !isError && !tenantInvalid && appointments.length > 0 && (
            <>
              {/* Sección Hoy */}
              {todayAppointments.length > 0 && (
                <>
                  <div className="bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm py-3 mt-6 border-b border-gray-100 dark:border-gray-800/50">
                    <h3 className="text-base font-bold leading-tight capitalize">Hoy — {formatDate(today)}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {todayAppointments.map(apt => (
                      <AppointmentCard
                        key={apt.ID}
                        appointment={apt}
                        onClick={() => navigate(`/${slug}/detail/${apt.ID}`)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Sección Futuro */}
              {futureAppointments.length > 0 && (
                <>
                  {Array.from(new Set(futureAppointments.map(a => a.Fecha))).map(date => (
                    <React.Fragment key={date}>
                      <div className="bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm py-3 mt-8 border-b border-gray-100 dark:border-gray-800/50">
                        <h3 className="text-base font-bold leading-tight capitalize">{formatDate(date)}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {futureAppointments.filter(a => a.Fecha === date).map(apt => (
                          <AppointmentCard
                            key={apt.ID}
                            appointment={apt}
                            onClick={() => navigate(`/${slug}/detail/${apt.ID}`)}
                          />
                        ))}
                      </div>
                    </React.Fragment>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {slug && <BottomNavigation slug={slug} />}
    </div>
  );
};

// --- SUB-COMPONENTES AUXILIARES ---

const StatCard: React.FC<{ value: string | number; label: string; color: 'primary' | 'amber' | 'emerald' }> = ({ value, label, color }) => {
  const colors = {
    primary: 'bg-primary/5 dark:bg-primary/10 text-primary',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  };
  return (
    <div className={`${colors[color]} rounded-xl px-3 py-2 text-center transition-all hover:scale-[1.02]`}>
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{label}</p>
    </div>
  );
};

const FilterButton: React.FC<{ active: boolean; onClick: () => void; label: string; count: number; badgeColor: 'orange' | 'emerald' }> = ({ active, onClick, label, count, badgeColor }) => {
  const badgeColors = {
    orange: 'bg-orange-100 text-orange-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-full rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${active ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-text-secondary-light dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
    >
      <span>{label}</span>
      {count > 0 && <span className={`${badgeColors[badgeColor]} text-[10px] px-1.5 py-0.5 rounded-full font-bold`}>{count}</span>}
    </button>
  );
};

const AgendaSkeleton = () => (
  <div className="mt-6 space-y-4 animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl w-full" />
    ))}
  </div>
);

const EmptyAgendaState: React.FC<{ filter: string }> = ({ filter }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-in fade-in slide-in-from-bottom-4">
    <div className="size-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-5">
      <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-500">
        {filter === 'Pendiente' ? 'done_all' : 'event_available'}
      </span>
    </div>
    <h3 className="font-bold text-lg mb-1">
      {filter === 'Pendiente' ? '¡Todo tranquilo por acá! 🙌' : 'Sin turnos confirmados'}
    </h3>
    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[260px] leading-relaxed">
      {filter === 'Pendiente'
        ? 'No tenés turnos pendientes de validación. ¡La estás rompiendo!'
        : 'Cuando confirmes los turnos, aparecen acá para tener el historial.'}
    </p>
  </div>
);

const AppointmentCard: React.FC<{ appointment: any; onClick: () => void }> = ({ appointment, onClick }) => {
  const isPending = appointment.Estado === 'Pendiente';
  const avatarSeed = appointment.NombreCliente.toLowerCase().replace(/\s/g, '');

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark px-4 py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-primary/30 transition-all group relative overflow-hidden active:scale-95"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isPending ? 'bg-orange-400' : 'bg-emerald-500'}`}></div>
      <div className="flex items-center gap-4 flex-1 pl-2">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 border border-gray-200 dark:border-gray-700"
          style={{ backgroundImage: `url("https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}")` }}
        ></div>
        <div className="flex flex-col justify-center min-w-0">
          <p className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">{appointment.NombreCliente}</p>
          <p className="text-text-secondary-light dark:text-gray-400 text-sm font-medium line-clamp-1">
            {appointment.Hora} · {appointment.Servicio}
          </p>
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <p className="text-primary font-bold text-base">${appointment.MontoSena?.toLocaleString('es-AR')}</p>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${isPending
            ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
            : 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20'
          }`}>
          {isPending ? '⚡ Validar' : '✓ OK'}
        </span>
      </div>
    </div>
  );
};

export default AgendaPage;