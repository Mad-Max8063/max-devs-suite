import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile, sheetsService } from '../services/sheetsService';
import { useApiMode } from '../hooks/useApiMode';

interface SetupChecklistProps {
  slug: string;
  profile: Profile | null;
}

interface ChecklistState {
  services: boolean;
  schedule: boolean;
}

const initialState: ChecklistState = {
  services: false,
  schedule: false,
};

const SetupChecklist: React.FC<SetupChecklistProps> = ({ slug, profile }) => {
  const navigate = useNavigate();
  const { shouldCallApi, isDemo } = useApiMode(slug);
  const [state, setState] = useState<ChecklistState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSetupState = async () => {
      if (!slug) return;

      setLoading(true);

      try {
        if (!shouldCallApi || isDemo) {
          if (!cancelled) {
            setState({ services: true, schedule: true });
          }
          return;
        }

        const [servicesData, scheduleData] = await Promise.all([
          sheetsService.getServices(slug),
          sheetsService.getSchedule(slug),
        ]);

        const hasServices = servicesData.services.some(service => service.activo !== false);
        const hasSchedule = Object.values(scheduleData.horariosPorDia)
          .some(slots => Array.isArray(slots) && slots.length > 0);

        if (!cancelled) {
          setState({ services: hasServices, schedule: hasSchedule });
        }
      } catch {
        if (!cancelled) {
          setState(initialState);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSetupState();

    return () => {
      cancelled = true;
    };
  }, [slug, shouldCallApi, isDemo]);

  const hasContactAndPayments = Boolean(
    profile?.Telefono?.trim() &&
    (profile?.AliasMP?.trim() || profile?.LinkPago?.trim() || profile?.QrImageUrl?.trim())
  );

  const items = useMemo(() => [
    {
      id: 'services',
      label: 'Alta de servicio',
      done: state.services,
      icon: 'design_services',
      route: `/${slug}/config`,
    },
    {
      id: 'schedule',
      label: 'Parametrización de horarios',
      done: state.schedule,
      icon: 'event_available',
      route: `/${slug}/schedule`,
    },
    {
      id: 'integrations',
      label: 'Contacto y pagos',
      done: hasContactAndPayments,
      icon: 'payments',
      route: `/${slug}/config`,
    },
  ], [hasContactAndPayments, slug, state.schedule, state.services]);

  const completedCount = items.filter(item => item.done).length;
  const completion = Math.round((completedCount / items.length) * 100);

  if (loading || completion === 100) {
    return null;
  }

  return (
    <section className="mb-10 animate-fade-in-up">
      <div className="glass-card ambient-shadow rounded-[2rem] border-white/60 p-6">
        <div className="mb-5 flex items-start justify-between gap-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Primeros pasos</p>
            <h3 className="mt-1 text-xl font-black tracking-tighter text-white">Configurá tu agenda</h3>
          </div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <span className="text-lg font-black">{completion}%</span>
          </div>
        </div>

        <div className="mb-5 h-2 overflow-hidden rounded-full bg-surface/70">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>

        <div className="space-y-3">
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.route)}
              className="flex w-full items-center gap-4 rounded-3xl border border-white/5 bg-surface/35 p-4 text-left transition-all hover:bg-surface/55 active:scale-[0.99]"
            >
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                item.done ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'
              }`}>
                <span className="material-symbols-outlined text-[22px]">
                  {item.done ? 'check_circle' : item.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-white">{item.label}</p>
                <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-45">
                  {item.done ? 'Completo' : 'Pendiente'}
                </p>
              </div>
              <span className="material-symbols-outlined text-primary/45">chevron_right</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SetupChecklist;
