import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CancellationAppointment, sheetsService } from '../services/sheetsService';
import ViralFooter from '../components/ViralFooter';

type PageState = 'loading' | 'ready' | 'not_found' | 'error';

const reasonText: Record<CancellationAppointment['Reason'], string> = {
  ok: 'Podés cancelar este turno hasta 2 horas antes del horario reservado.',
  already_cancelled: 'Este turno ya fue cancelado anteriormente.',
  too_late: 'Ya no es posible cancelar online porque faltan menos de 2 horas para el turno.',
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

const CancelPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const { setSlug } = useApp();
  const [state, setState] = useState<PageState>('loading');
  const [appointment, setAppointment] = useState<CancellationAppointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (slug) setSlug(slug);
  }, [slug, setSlug]);

  useEffect(() => {
    let cancelled = false;

    const loadAppointment = async () => {
      if (!slug || !token) {
        setState('not_found');
        return;
      }

      setState('loading');
      setErrorMessage(null);

      try {
        if (slug === 'demo') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const date = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
          if (!cancelled) {
            setAppointment({
              ID: 'demo-cancel',
              Slug: 'demo',
              NombreNegocio: 'Barbería Styles',
              Fecha: date,
              Hora: '14:30',
              Servicio: 'Corte de Cabello',
              Estado: 'Pendiente',
              CanCancel: true,
              Reason: 'ok',
            });
            setState('ready');
          }
          return;
        }

        const data = await sheetsService.getAppointmentForCancellation(slug, token);
        if (cancelled) return;

        if (!data) {
          setAppointment(null);
          setState('not_found');
          return;
        }

        setAppointment(data);
        setState('ready');
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error instanceof Error ? error.message : 'No pudimos cargar el turno.');
        setState('error');
      }
    };

    loadAppointment();

    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  const handleCancel = async () => {
    if (!slug || !token || !appointment?.CanCancel) return;

    const confirmed = window.confirm('¿Querés cancelar este turno? El horario volverá a quedar disponible.');
    if (!confirmed) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      if (slug !== 'demo') {
        const result = await sheetsService.cancelAppointmentByToken(slug, token);
        if (result.result !== 'cancelled' && result.result !== 'already_cancelled') {
          setAppointment(prev => prev ? {
            ...prev,
            CanCancel: false,
            Reason: result.result === 'too_late' ? 'too_late' : prev.Reason,
          } : prev);
          return;
        }
      }

      setAppointment(prev => prev ? {
        ...prev,
        Estado: 'Cancelado',
        CanCancel: false,
        Reason: 'already_cancelled',
      } : prev);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No pudimos cancelar el turno.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToBooking = () => {
    navigate(slug ? `/${slug}/booking` : '/demo/booking');
  };

  const isCancelled = appointment?.Estado === 'Cancelado';
  const canCancel = appointment?.CanCancel && !isCancelled;

  return (
    <div className="flex min-h-screen flex-col bg-background text-on-surface font-sans">
      <header className="border-b border-white/5 bg-background/70 px-6 py-5 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-10 items-center justify-center rounded-2xl bg-surface/70 text-primary transition-all active:scale-95"
            aria-label="Volver"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">Cancelar turno</p>
          <div className="size-10" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-10">
        {state === 'loading' && (
          <section className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-5 size-12 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <h1 className="text-2xl font-black tracking-tight">Buscando tu turno</h1>
            <p className="mt-2 text-sm font-semibold text-on-surface-variant">Validando el enlace de cancelación.</p>
          </section>
        )}

        {state === 'not_found' && (
          <section className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-[2rem] bg-red-500/10 text-red-500">
              <span className="material-symbols-outlined text-[40px]">link_off</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Enlace inválido</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-on-surface-variant">
              No encontramos un turno activo para este enlace. Revisá que hayas abierto el link completo.
            </p>
            <button
              type="button"
              onClick={goToBooking}
              className="mt-8 w-full rounded-full bg-primary px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-primary/25 transition-all active:scale-95"
            >
              Reservar otro turno
            </button>
          </section>
        )}

        {state === 'error' && (
          <section className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-[2rem] bg-amber-500/10 text-amber-500">
              <span className="material-symbols-outlined text-[40px]">warning</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Algo no salió bien</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-on-surface-variant">
              {errorMessage || 'No pudimos cargar la información del turno.'}
            </p>
          </section>
        )}

        {state === 'ready' && appointment && (
          <section className="flex flex-1 flex-col gap-7">
            <div className="text-center">
              <div className={`mx-auto mb-6 flex size-24 items-center justify-center rounded-[2rem] ${
                isCancelled ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
              }`}>
                <span className="material-symbols-outlined text-[48px]">
                  {isCancelled ? 'event_busy' : 'event_available'}
                </span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary/60">{appointment.NombreNegocio}</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight">
                {isCancelled ? 'Turno cancelado' : '¿Cancelamos este turno?'}
              </h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-on-surface-variant">
                {reasonText[appointment.Reason]}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-surface/70 p-6 shadow-2xl shadow-black/10">
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined">calendar_today</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/60">Fecha y hora</p>
                  <p className="mt-1 text-lg font-black capitalize text-on-surface">
                    {formatDate(appointment.Fecha)}
                  </p>
                  <p className="text-sm font-bold text-primary">{appointment.Hora}</p>
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/60">Servicio</p>
                <p className="mt-1 text-base font-bold text-on-surface">{appointment.Servicio || 'Servicio reservado'}</p>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-500/15 bg-red-500/10 px-5 py-4 text-sm font-bold text-red-500">
                {errorMessage}
              </div>
            )}

            <div className="mt-auto flex flex-col gap-3 pb-8">
              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-3 rounded-full bg-red-500 px-6 py-5 text-xs font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-red-500/25 transition-all active:scale-95 disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                  )}
                  Cancelar turno
                </button>
              )}

              <button
                type="button"
                onClick={goToBooking}
                className="w-full rounded-full border border-white/10 bg-surface/70 px-6 py-4 text-xs font-black uppercase tracking-[0.18em] text-on-surface transition-all active:scale-95"
              >
                Reservar otro horario
              </button>
            </div>

            <ViralFooter />
          </section>
        )}
      </main>
    </div>
  );
};

export default CancelPage;
