import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, useProfile, useAppointments } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import BottomNavigation from '../components/BottomNavigation';
import DemoBanner from '../components/DemoBanner';
import { SubscriptionBanner } from '../components/SubscriptionBanner';
import SetupChecklist from '../components/SetupChecklist';
import { resolveAccessPriority } from '../utils/access-resolver';

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams<{ slug: string }>();
  const { slug: contextSlug, setSlug } = useApp();
  const { profile, loading } = useProfile();
  const { appointments, refresh } = useAppointments();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const slug = urlSlug || contextSlug || 'demo';

  useEffect(() => {
    if (urlSlug && urlSlug !== contextSlug) {
      setSlug(urlSlug);
    }
  }, [urlSlug, contextSlug, setSlug]);

  useEffect(() => {
    refresh('all');
  }, [refresh]);

  const getLocalDateString = (offsetDays: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const today = getLocalDateString();
  const tomorrow = getLocalDateString(1);
  const stats = useMemo(() => {
    const todayAll = appointments.filter(a => a.Fecha === today);
    const pendingCount = appointments.filter(a => a.Estado === 'Pendiente').length;
    const todayEarnings = todayAll
      .filter(a => a.Estado === 'Confirmado')
      .reduce((sum, a) => sum + (a.MontoSena || 0), 0);
    return { todayCount: todayAll.length, pendingCount, todayEarnings };
  }, [appointments, today]);

  const pendingReminders = useMemo(() => {
    return appointments
      .filter(a => a.Fecha === tomorrow && a.Estado !== 'Cancelado')
      .sort((a, b) => a.Hora.localeCompare(b.Hora));
  }, [appointments, tomorrow]);

  const pendingPaymentChecks = useMemo(() => {
    return appointments
      .filter(a => a.Estado === 'Pendiente')
      .sort((a, b) => `${a.Fecha} ${a.Hora}`.localeCompare(`${b.Fecha} ${b.Hora}`))
      .slice(0, 3);
  }, [appointments]);

  const handleShareApp = async () => {
    const shareUrl = `${window.location.origin}/#/${slug}/booking`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.NombreNegocio || 'Sacar turno',
          text: `Sacá tu turno en ${profile?.NombreNegocio}`,
          url: shareUrl,
        });
      } catch {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatReminderDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const normalizeWhatsAppPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
    if (!digits) return '';
    if (digits.startsWith('549')) return digits;
    if (digits.startsWith('54')) return `549${digits.slice(2)}`;
    if (digits.startsWith('9')) return `54${digits}`;
    return `549${digits}`;
  };

  const buildReminderLink = (appointment: typeof appointments[number]) => {
    const phone = normalizeWhatsAppPhone(appointment.TelefonoCliente || '');
    const message = [
      `Hola ${appointment.NombreCliente}, te recordamos tu turno en ${profile?.NombreNegocio || negocioNombre}.`,
      `Fecha: ${formatReminderDate(appointment.Fecha)} a las ${appointment.Hora}.`,
      appointment.Servicio ? `Servicio: ${appointment.Servicio}.` : '',
      'Te esperamos.',
    ].filter(Boolean).join('\n');

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const buildMercadoPagoSearchLink = (clientName: string) => {
    return `https://www.mercadopago.com.ar/activities?search=${encodeURIComponent(clientName)}`;
  };

  const negocioNombre = loading ? '...' : (profile?.NombreNegocio || 'Tu Negocio');
  const valorSena = profile?.ValorSena?.toLocaleString('es-AR') || '0';

  const activeModules = profile?.ActiveModules || ['appointments', 'card'];
  const hasAppointments = activeModules.includes('appointments');
  const hasCard = activeModules.includes('card');

  const hasAccess = resolveAccessPriority(profile);
  const isExpired = profile?.trial_ends_at ? new Date(profile.trial_ends_at) < new Date() : false;
  const isHardLocked = !hasAccess && isExpired;

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface font-sans relative overflow-hidden">
      
      {/* Mesh Background Decorative */}
      <div className="fixed inset-0 mesh-gradient-bg opacity-[0.07] -z-10" />
      
      {/* Demo Banner */}
      <DemoBanner slug={slug} />

      {/* Header */}
      <header className="px-6 pt-12 pb-6 w-full z-20 sticky top-0 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="animate-fade-in-up">
            <h1 className="text-xl font-black tracking-tighter text-primary leading-none mb-1">
              {negocioNombre}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-50">Panel de Control</p>
          </div>
          <div className="flex items-center gap-3">
             <button
              onClick={handleLogout}
              className="size-10 rounded-2xl bg-surface border border-white/10 flex items-center justify-center text-on-surface-variant hover:bg-red-500/10 hover:text-red-500 transition-all shrink-0 ambient-shadow"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto pb-32 no-scrollbar px-6">
        
        {/* Subscription Banner */}
        <SubscriptionBanner />

        {isHardLocked ? (
          <div className="mt-10 text-center animate-fade-in">
             <div className="size-20 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[40px]">lock</span>
             </div>
             <h2 className="text-2xl font-black tracking-tighter mb-4">Agenda Bloqueada</h2>
             <p className="text-sm text-on-surface-variant opacity-70 mb-8 leading-relaxed">
               Tu período de prueba ha finalizado. Para seguir gestionando tus turnos y recibiendo reservas de clientes, por favor activá tu suscripción.
             </p>
             <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Precio Protegido</p>
                <p className="text-lg font-black tracking-tight">Congelá tu precio por 90 días</p>
             </div>
          </div>
        ) : (
          <>
            {/* Hero Stats Card */}
            {hasAppointments && (
              <SetupChecklist slug={slug} profile={profile} />
            )}

            {hasAppointments && (
          <div className="mt-6 mb-8 animate-scale-in">
            <div className="glass-card ambient-shadow rounded-[2rem] p-7 overflow-hidden relative border-white/60">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Actividad de Hoy</p>
                  <h2 className="text-3xl font-black tracking-tighter">Turnos <span className="opacity-30">&</span> Senas</h2>
                </div>
                <div className="bg-primary/10 text-primary p-2.5 rounded-2xl">
                    <span className="material-symbols-outlined">analytics</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface/40 border border-white/5 rounded-3xl p-5">
                  <p className="text-4xl font-black tracking-tighter mb-1 text-primary">{stats.todayCount}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Agendados</p>
                </div>
                <div className="bg-surface/40 border border-white/5 rounded-3xl p-5">
                  <p className="text-4xl font-black tracking-tighter mb-1 text-tertiary">${valorSena}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Valor Seña</p>
                </div>
              </div>

              {stats.pendingCount > 0 && (
                 <button
                  onClick={() => navigate(`/${slug}/agenda`)}
                  className="w-full bg-surface border border-primary/20 text-primary py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all ambient-shadow"
                >
                  <span className="material-symbols-outlined text-amber-500">notification_important</span>
                  {stats.pendingCount === 1
                    ? '1 Turno por Validar'
                    : `${stats.pendingCount} Turnos por Validar`}
                </button>
              )}
            </div>
          </div>
        )}

        {hasAppointments && pendingPaymentChecks.length > 0 && (
          <section className="mb-10 animate-fade-in-up">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">Cobros</p>
                <h3 className="mt-1 text-xl font-black tracking-tighter text-white">Verificar en MP</h3>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-400">
                <span className="material-symbols-outlined text-[22px]">account_balance_wallet</span>
              </div>
            </div>

            <div className="space-y-3">
              {pendingPaymentChecks.map((appointment) => (
                <div
                  key={appointment.ID}
                  className="rounded-3xl border border-white/5 bg-surface/35 p-4 ambient-shadow"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-white">{appointment.NombreCliente}</p>
                      <p className="mt-1 truncate text-xs font-bold text-on-surface-variant opacity-60">
                        {formatReminderDate(appointment.Fecha)} · {appointment.Hora}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.open(buildMercadoPagoSearchLink(appointment.NombreCliente), '_blank', 'noopener,noreferrer')}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-sky-400/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-sky-300 transition-all hover:bg-sky-400 hover:text-white active:scale-95"
                      title={`Buscar cobro de ${appointment.NombreCliente} en Mercado Pago`}
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      MP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasAppointments && (
          <section className="mb-10 animate-fade-in-up">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">Automatización</p>
                <h3 className="mt-1 text-xl font-black tracking-tighter text-white">Recordatorios Pendientes</h3>
              </div>
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#25d366]/10 text-[#25d366]">
                <span className="material-symbols-outlined text-[22px]">notifications_active</span>
              </div>
            </div>

            <div className="glass-card ambient-shadow rounded-[2rem] border-white/60 p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Mañana</p>
                  <p className="mt-1 text-sm font-bold capitalize text-on-surface-variant">
                    {formatReminderDate(tomorrow)}
                  </p>
                </div>
                <span className="rounded-full bg-surface/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  {pendingReminders.length}
                </span>
              </div>

              {pendingReminders.length === 0 ? (
                <div className="rounded-3xl border border-white/5 bg-surface/35 px-5 py-6 text-center">
                  <span className="material-symbols-outlined mb-3 text-[28px] text-on-surface-variant opacity-40">task_alt</span>
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant opacity-60">
                    Sin recordatorios para enviar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingReminders.map((appointment) => {
                    const phone = normalizeWhatsAppPhone(appointment.TelefonoCliente || '');
                    const reminderLink = buildReminderLink(appointment);

                    return (
                      <div
                        key={appointment.ID}
                        className="rounded-3xl border border-white/5 bg-surface/35 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black text-primary">
                                {appointment.Hora}
                              </span>
                              <span className="truncate text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-45">
                                {appointment.Estado}
                              </span>
                            </div>
                            <p className="mt-3 truncate text-sm font-black text-white">{appointment.NombreCliente}</p>
                            <p className="mt-1 truncate text-xs font-bold text-on-surface-variant opacity-60">
                              {appointment.Servicio || 'Servicio reservado'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => phone && window.open(reminderLink, '_blank', 'noopener,noreferrer')}
                            disabled={!phone}
                            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95 ${
                              phone
                                ? 'bg-[#25d366] text-white shadow-lg shadow-[#25d366]/20'
                                : 'bg-surface text-on-surface-variant opacity-40'
                            }`}
                            title={phone ? 'Enviar recordatorio por WhatsApp' : 'Sin teléfono cargado'}
                          >
                            <span className="material-symbols-outlined text-[22px]">send</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Quick Actions Title */}
        <div className="mb-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-40">Herramientas</h3>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 gap-4 mb-10">
            {hasAppointments && (
               <button
                onClick={() => navigate(`/${slug}/agenda`)}
                className="group flex flex-col gap-4 p-5 bg-surface/40 border border-white/5 rounded-[2rem] text-left transition-all hover:bg-surface ambient-shadow"
              >
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">calendar_today</span>
                </div>
                <div>
                  <p className="font-black text-sm tracking-tight text-white">Ver Agenda</p>
                  <p className="text-[10px] font-bold text-on-surface-variant opacity-50">Calendario completo</p>
                </div>
              </button>
            )}

             <button
              onClick={() => navigate(`/${slug}/config`)}
              className="group flex flex-col gap-4 p-5 bg-surface/40 border border-white/5 rounded-[2rem] text-left transition-all hover:bg-surface ambient-shadow"
            >
              <div className="size-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[24px]">store</span>
              </div>
              <div>
                <p className="font-black text-sm tracking-tight text-white">Mi Negocio</p>
                <p className="text-[10px] font-bold text-on-surface-variant opacity-50">Perfil y servicios</p>
              </div>
            </button>

             <button
              onClick={handleShareApp}
              className="group flex flex-col gap-4 p-5 bg-surface/40 border border-white/5 rounded-[2rem] text-left transition-all hover:bg-surface ambient-shadow"
            >
              <div className="size-12 rounded-2xl bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[24px]">qr_code_2</span>
              </div>
              <div>
                <p className="font-black text-sm tracking-tight text-white">Compartir</p>
                <p className="text-[10px] font-bold text-on-surface-variant opacity-50">Link para clientes</p>
              </div>
            </button>

             {hasAppointments && (
              <button
                onClick={() => navigate(`/${slug}/schedule`)}
                className="group flex flex-col gap-4 p-5 bg-surface/40 border border-white/5 rounded-[2rem] text-left transition-all hover:bg-surface ambient-shadow"
              >
                <div className="size-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">timer</span>
                </div>
                <div>
                  <p className="font-black text-sm tracking-tight text-white">Horarios</p>
                  <p className="text-[10px] font-bold text-on-surface-variant opacity-50">Franjas horarias</p>
                </div>
              </button>
            )}
            
             {hasCard && (
              <button
                onClick={() => navigate(`/${slug}/identidad`)}
                className="group flex flex-col gap-4 p-5 bg-surface/40 border border-white/5 rounded-[2rem] text-left transition-all hover:bg-surface ambient-shadow col-span-2"
              >
                <div className="flex items-center gap-5">
                    <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <span className="material-symbols-outlined text-[30px]">style</span>
                    </div>
                    <div>
                    <p className="font-black text-lg tracking-tighter text-white">Identidad Visual</p>
                    <p className="text-xs font-bold text-on-surface-variant opacity-50">Personalizar mi Tarjeta Virtual Premium</p>
                    </div>
                    <div className="ml-auto">
                        <span className="material-symbols-outlined text-primary/40">chevron_right</span>
                    </div>
                </div>
              </button>
            )}
        </div>

        {/* Footer Info */}
        <div className="mb-12">
            <div className="bg-primary/5 rounded-[2rem] p-6 border border-primary/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Tu Enlace Público</p>
                 <div className="flex items-center justify-between gap-4">
                    <code className="text-xs font-bold text-white opacity-60 truncate flex-1">
                        {`${window.location.origin}/#/${slug}/booking`}
                    </code>
                    <button 
                        onClick={() => copyToClipboard(`${window.location.origin}/#/${slug}/booking`)}
                        className="p-3 bg-surface rounded-xl border border-white/10 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-[18px] text-white">content_copy</span>
                    </button>
                </div>
            </div>
          </div>
          </>
        )}

      </main>

      {/* Bottom Navigation */}
      {slug && <BottomNavigation slug={slug} />}
    </div>
  );
};

export default WelcomePage;
