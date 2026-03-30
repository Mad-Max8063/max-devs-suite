import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCurrentAppointment } from '../context/AppContext';
import { useAppointmentActions } from '../hooks/useAppointments';

const AppointmentDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const { appointment, load } = useCurrentAppointment();
  const { updateStatus, deleteAppointment, loading: actionLoading } = useAppointmentActions(id, slug);
  const [status, setStatus] = useState<'Pendiente' | 'Confirmado' | 'Cancelado'>('Pendiente');
  const [deleting, setDeleting] = useState(false);

  // Load appointment on mount
  useEffect(() => {
    if (id) {
      load(id);
    }
  }, [id, load]);

  // Sync status with appointment data
  useEffect(() => {
    if (appointment) {
      setStatus(appointment.Estado);
    }
  }, [appointment]);

  // Handle status change
  const handleStatusChange = async (newStatus: 'Pendiente' | 'Confirmado' | 'Cancelado') => {
    setStatus(newStatus);
    try {
      await updateStatus(newStatus);
    } catch (error) {
      // Revert on error
      setStatus(appointment?.Estado || 'Pendiente');
      alert('Error al actualizar el estado');
    }
  };

  // Generate WhatsApp link
  const whatsappLink = appointment
    ? `https://wa.me/${appointment.TelefonoCliente}?text=${encodeURIComponent(`Hola ${appointment.NombreCliente}, te escribo por tu turno del ${appointment.Fecha} a las ${appointment.Hora}.`)}`
    : '#';

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Sin fecha';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // Handle deletion
  const handleDelete = async () => {
    if (window.confirm('¿Seguro que querés cancelar este turno? Esto no se puede deshacer.')) {
      setDeleting(true);
      try {
        await deleteAppointment();
        navigate(`/${slug}/agenda`);
      } catch (err) {
        alert('Error al cancelar el turno');
      } finally {
        setDeleting(false);
      }
    }
  };

  if (!appointment) {
    return (
      <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Cargando turno...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">

      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center px-4 h-14 justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Detalle del Turno</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 p-4 pb-24 overflow-y-auto no-scrollbar">

        {/* Cancelled Banner */}
        {status === 'Cancelado' && (
          <section className="p-4 rounded-xl border-2 bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500 text-[24px]">block</span>
            <div>
              <p className="font-bold text-red-700 dark:text-red-400">Turno cancelado</p>
              <p className="text-xs text-red-500 dark:text-red-400/70">Este turno se canceló y ya no está activo.</p>
            </div>
          </section>
        )}

        {/* Status Validation Card */}
        {status !== 'Cancelado' && (
          <section className={`p-4 rounded-xl border-2 ${status === 'Confirmado' ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800'}`}>
            <h3 className="text-sm font-bold mb-2 uppercase tracking-wide text-gray-500">Estado del Pago (Seña)</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange('Pendiente')}
                disabled={actionLoading}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${status === 'Pendiente' ? 'bg-orange-500 text-white shadow-md' : 'bg-white dark:bg-surface-dark text-gray-500'}`}
              >
                <span className="material-symbols-outlined text-[18px]">pending</span>
                Pendiente
              </button>
              <button
                onClick={() => handleStatusChange('Confirmado')}
                disabled={actionLoading}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${status === 'Confirmado' ? 'bg-green-600 text-white shadow-md' : 'bg-white dark:bg-surface-dark text-gray-500'}`}
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Confirmado
              </button>
            </div>
            <p className="text-xs mt-3 text-center text-gray-500 dark:text-gray-400">
              {status === 'Pendiente' ? 'Revisá tu Mercado Pago antes de confirmar.' : '¡Listo! Turno asegurado.'}
            </p>
          </section>
        )}

        {/* Client Profile Card */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="size-24 rounded-full bg-cover bg-center border-2 border-primary/20"
              style={{ backgroundImage: `url("https://picsum.photos/seed/${appointment.NombreCliente.toLowerCase().replace(/\s/g, '')}/200")` }}
            ></div>
            <div className={`absolute bottom-0 right-0 size-5 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center ${status === 'Confirmado' ? 'bg-green-500' : 'bg-orange-500'}`}>
              <span className="material-symbols-outlined text-[12px] text-white font-bold">{status === 'Confirmado' ? 'check' : 'priority_high'}</span>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">{appointment.NombreCliente}</h2>
            <a href={`tel:${appointment.TelefonoCliente}`} className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full text-primary text-sm font-medium transition-colors">
              <span className="material-symbols-outlined text-[16px]">call</span>
              {appointment.TelefonoCliente}
            </a>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-bold text-sm hover:bg-green-200 transition-colors no-underline"
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
              WhatsApp
            </a>
          </div>
        </section>

        {/* Appointment Details */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
            <h3 className="font-bold">Detalles del Servicio</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">{appointment.Servicio}</span>
          </div>
          <div className="p-5 flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">calendar_month</span>
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">Fecha</p>
                <p className="text-base font-semibold mt-0.5 capitalize">{formatDate(appointment.Fecha)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">schedule</span>
              </div>
              <div>
                <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">Hora</p>
                <p className="text-base font-semibold mt-0.5">{appointment.Hora}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400">payments</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">Monto Acordado (Seña)</p>
                <p className="text-2xl font-bold text-primary mt-0.5">${appointment.MontoSena?.toLocaleString('es-AR')}</p>
                {appointment.PrecioTotal > appointment.MontoSena && (
                  <p className="text-xs text-gray-400 mt-1">Resto a cobrar en el local: ${(appointment.PrecioTotal - appointment.MontoSena).toLocaleString('es-AR')}</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-col gap-3">
          <button className="w-full h-12 rounded-xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Editar Turno
          </button>
          {status !== 'Cancelado' && (
            <button
              onClick={() => {
                if (window.confirm('¿Seguro que querés cancelar este turno?')) {
                  handleStatusChange('Cancelado');
                }
              }}
              disabled={actionLoading}
              className="w-full h-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[20px]">cancel</span>
              Cancelar Turno
            </button>
          )}
        </section>

      </main>
    </div>
  );
};

export default AppointmentDetailPage;