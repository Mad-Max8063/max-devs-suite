import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, useAppointments } from '../context/AppContext';
import BottomNavigation from '../components/BottomNavigation';
import DemoBanner from '../components/DemoBanner';

const AgendaPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { setSlug } = useApp();
  const { appointments, loading, error, refresh } = useAppointments();
  const [filter, setFilter] = useState<'Pendiente' | 'Confirmado'>('Pendiente');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Sync slug from URL
  useEffect(() => {
    if (slug) {
      setSlug(slug);
    }
  }, [slug, setSlug]);

  // Refresh when filter changes (with stable reference check)
  useEffect(() => {
    if (isInitialLoad) {
      refresh(filter);
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, filter, refresh]);

  // Handle filter change
  const handleFilterChange = (newFilter: 'Pendiente' | 'Confirmado') => {
    if (newFilter !== filter) {
      setFilter(newFilter);
      refresh(newFilter);
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => apt.Estado === filter);

  // Group by date
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = filteredAppointments.filter(apt => apt.Fecha === today);
  const futureAppointments = filteredAppointments.filter(apt => apt.Fecha > today);

  // Count for badges
  const pendingCount = appointments.filter(apt => apt.Estado === 'Pendiente').length;
  const confirmedCount = appointments.filter(apt => apt.Estado === 'Confirmado').length;

  // Mini stats
  const miniStats = useMemo(() => {
    const todayAll = appointments.filter(a => a.Fecha === today);
    const confirmedEarnings = appointments
      .filter(a => a.Estado === 'Confirmado')
      .reduce((sum, a) => sum + (a.MontoSena || 0), 0);
    return {
      todayCount: todayAll.length,
      totalCount: appointments.length,
      earnings: confirmedEarnings,
    };
  }, [appointments, today]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="flex flex-col h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">

      {/* Demo Banner */}
      {slug && <DemoBanner slug={slug} />}

      {/* Header */}
      <header className="flex items-center px-4 py-3 justify-between bg-surface-light dark:bg-surface-dark sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="text-primary bg-primary/10 rounded-full p-2 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
          </div>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-center">Agenda</h2>
        <button
          onClick={() => refresh()}
          className="flex items-center justify-center rounded-full p-2 text-text-primary-light dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </header>

      {/* Mini Stats Row */}
      <div className="bg-surface-light dark:bg-surface-dark px-4 pt-2 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary/5 dark:bg-primary/10 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-black text-primary">{miniStats.todayCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">hoy</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2 text-center">
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">{pendingCount}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">a validar</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 text-center">
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {miniStats.earnings > 0 ? `$${miniStats.earnings.toLocaleString('es-AR')}` : '—'}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">cobrado</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 bg-surface-light dark:bg-surface-dark border-b border-gray-50 dark:border-gray-800/50">
        <div className="flex h-10 w-full items-center justify-center rounded-lg bg-[#f3f0f4] dark:bg-gray-800 p-1">
          <button
            onClick={() => handleFilterChange('Pendiente')}
            className={`flex-1 h-full rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${filter === 'Pendiente' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-text-secondary-light dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            data-testid="filter-pending"
          >
            <span>Pendientes</span>
            {pendingCount > 0 && (
              <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{pendingCount}</span>
            )}
          </button>
          <button
            onClick={() => handleFilterChange('Confirmado')}
            className={`flex-1 h-full rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${filter === 'Confirmado' ? 'bg-white dark:bg-surface-dark text-primary shadow-sm' : 'text-text-secondary-light dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            data-testid="filter-confirmed"
          >
            <span>Confirmados</span>
            {confirmedCount > 0 && (
              <span className="bg-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{confirmedCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* List */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="max-w-6xl mx-auto w-full px-4 lg:px-6">

        {/* Helper Tip */}
          <div className="mt-3 mb-1 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex gap-3 items-start border border-blue-100 dark:border-blue-800">
            <span className="material-symbols-outlined text-blue-500 text-[18px] mt-0.5 shrink-0">info</span>
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              Chequeá tu Mercado Pago. Si recibiste la seña, entrá al turno y marcalo como <b>Confirmado</b> ✅
            </p>
          </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mx-4 mt-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm">Uy, algo salió mal. {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAppointments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in-up">
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
        )}

        {/* Today Section */}
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

        {/* Future Appointments */}
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
        </div>
      </main>

      {/* Bottom Navigation */}
      {slug && <BottomNavigation slug={slug} />}
    </div>
  );
};

// Appointment Card Component
interface AppointmentCardProps {
  appointment: {
    ID: string;
    Estado: 'Pendiente' | 'Confirmado' | 'Cancelado';
    Hora: string;
    NombreCliente: string;
    Servicio: string;
    MontoSena: number;
    TelefonoCliente: string;
  };
  onClick: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onClick }) => {
  const isPending = appointment.Estado === 'Pendiente';
  const avatarSeed = appointment.NombreCliente.toLowerCase().replace(/\s/g, '');

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark px-4 py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-primary/30 transition-colors group relative overflow-hidden"
    >
      {/* Status Line Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isPending ? 'bg-orange-400' : 'bg-emerald-500'}`}></div>

      <div className="flex items-center gap-4 flex-1 pl-2">
        <div className="relative">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12"
            style={{ backgroundImage: `url("https://picsum.photos/seed/${avatarSeed}/100")` }}
          ></div>
          {isPending && (
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 ring-2 ring-white dark:ring-surface-dark animate-pulse">
              <span className="material-symbols-outlined text-[10px] text-white font-bold">priority_high</span>
            </span>
          )}
        </div>
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