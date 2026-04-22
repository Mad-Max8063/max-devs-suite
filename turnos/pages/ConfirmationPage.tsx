import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, useProfile, useCurrentAppointment } from '../context/AppContext';
import ViralFooter from '../components/ViralFooter';
import { generateCalendarLinks } from '../utils/calendarUtils';

const ConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug, id } = useParams<{ slug: string; id?: string }>();
  const { setSlug } = useApp();
  const { profile } = useProfile();
  const { appointment, load, set: setCurrentAppointment } = useCurrentAppointment();
  const [toastVisible, setToastVisible] = useState(false);
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  const isFirstRender = React.useRef(true);

  useEffect(() => {
    if (slug) {
      setSlug(slug);
    }
  }, [slug, setSlug]);

  useEffect(() => {
    if (id) {
      load(id);
    } else if (slug === 'demo' && !appointment && isFirstRender.current) {
      isFirstRender.current = false;
      const demoApt = {
        ID: 'demo-123',
        NombreCliente: 'Usuario Demo',
        Servicio: 'Corte de Cabello',
        Fecha: new Date().toISOString().split('T')[0],
        Hora: '14:30',
        Estado: 'Pendiente',
        MontoSena: profile?.ValorSena || 2000,
        TelefonoCliente: '5491112345678',
        Slug: 'demo'
      };
      // @ts-ignore - solo para demo
      setCurrentAppointment(demoApt);
    }
  }, [id, slug, appointment, load, setCurrentAppointment, profile]);

  const businessPhone = profile?.Telefono || '5491112345678';
  const clientName = appointment?.NombreCliente || 'Cliente';
  const depositAmount = appointment?.MontoSena || profile?.ValorSena || 2000;
  const dateString = appointment?.Fecha || new Date().toISOString().split('T')[0];
  
  // Parseo de fecha y hora
  const [y, m, d] = dateString.split('-').map(Number);
  const [hours, minutes] = (appointment?.Hora || '09:00').split(':').map(Number);
  const dateObj = new Date(y, m - 1, d, hours, minutes);
  
  const dateDisplay = appointment?.Fecha
    ? dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    : 'la fecha seleccionada';
    
  const aliasMP = profile?.AliasMP || 'mi.negocio.mp';
  const linkPago = profile?.LinkPago;
  const qrImageUrl = profile?.QrImageUrl;

  const whatsappMessage = `¡Hola! Soy ${clientName}, ya transferí la seña de $${depositAmount.toLocaleString('es-AR')} para el turno del ${dateDisplay} 🙌`;
  const whatsappLink = `https://wa.me/${businessPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const calendarLinks = appointment ? generateCalendarLinks({
    id: appointment.ID,
    title: `Turno: ${appointment.Servicio}`,
    description: `Reserva confirmada en ${profile?.NombreNegocio || 'el establecimiento'}.`,
    startTime: dateObj.toISOString(),
    location: profile?.Direccion
  }, {
    name: profile?.NombreNegocio || 'Suito Business',
    phone: profile?.Telefono,
    address: profile?.Direccion
  }) : null;

  const copyAlias = async () => {
    try {
      await navigator.clipboard.writeText(aliasMP);
    } catch {
      // Fallback
    }
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  const openMercadoPago = () => {
    if (linkPago && linkPago.startsWith('http')) {
      window.open(linkPago, '_blank');
      return;
    }
    if (aliasMP.startsWith('http')) {
      window.open(aliasMP, '_blank');
    } else {
      alert(`Transferí a: ${aliasMP}\nMonto: $${depositAmount.toLocaleString('es-AR')}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafc] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-primary/20 relative w-full overflow-x-hidden pt-6">

      {/* Confetti particles - Animación Premium de entrada */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[100]">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-0"
            style={{
              left: `${5 + Math.random() * 90}%`,
              top: '-10px',
              backgroundColor: ['#fbbf24', '#10b981', '#6366f1', '#f43f5e', '#3b82f6'][i % 5],
              animation: `confettiFall 3s cubic-bezier(0.2, 0.8, 0.4, 1) ${0.05 * i}s both`,
            }}
          />
        ))}
      </div>

      {toastVisible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-toast-in">
          <div className="flex items-center gap-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-[1.125rem] py-3 rounded-[1.25rem] shadow-[0_10px_30px_rgba(0,0,0,0.2)] text-sm font-bold tracking-tight">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            ¡Copiado al portapapeles!
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center px-6 pb-2 justify-center relative">
        <h2 className="font-extrabold text-[1rem] tracking-widest uppercase opacity-40">Confirmación</h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-5 pt-8 pb-32 gap-8 max-w-md mx-auto w-full">

        {/* Success Hero - Vibrant Animation */}
        <div className="flex flex-col items-center gap-5 text-center animate-fade-in-up">
          <div className="relative">
             <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
             <div className="w-[96px] h-[96px] rounded-[2rem] bg-gradient-to-br from-primary via-primary to-indigo-600 flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(99,102,241,0.5)] relative z-10">
               <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 700" }}>check</span>
             </div>
          </div>
          <div>
            <h1 className="text-[2.5rem] font-black tracking-[-0.05em] leading-[1] mb-2 bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">¡Turno Reservado!</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">Un paso más para confirmar tu lugar.</p>
          </div>
        </div>

        {/* Appointment Data Card */}
        <div className="w-full bg-white dark:bg-zinc-900 rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-zinc-100 dark:border-zinc-800/50 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-[56px] h-[56px] rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[28px]">calendar_today</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[1.25rem] font-black tracking-tight truncate">
                  {appointment?.Fecha ? `${dateDisplay} a las ${appointment.Hora}` : 'Procesando fecha...'}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                  {appointment?.Servicio || 'Servicio Reservado'}
                </p>
              </div>
            </div>

            {/* Calendar Integration Buttons */}
            <div className="grid grid-cols-1 gap-3 pt-4 border-t border-zinc-50 dark:border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Agendar en mi calendario</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button 
                  onClick={() => calendarLinks?.googleUrl && window.open(calendarLinks.googleUrl, '_blank')}
                  className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-800 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  disabled={!calendarLinks?.googleUrl}
                >
                  <img src="https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png" className="w-4 h-4" alt="Google" />
                  <span className="text-xs font-bold">Google</span>
                </button>
                <button 
                  onClick={() => calendarLinks?.downloadICal?.()}
                  className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-zinc-50 dark:bg-zinc-800 py-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  disabled={!calendarLinks}
                >
                  <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-300 text-sm">download</span>
                  <span className="text-xs font-bold">iCal / Apple</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Zone - Re-Styled for Premium Feel */}
        <div className="w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden animate-fade-in-up border border-zinc-100 dark:border-zinc-800/50" style={{ animationDelay: '0.2s' }}>
          
          <div className="flex flex-col items-center justify-center py-8 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-[11px] text-primary font-black uppercase tracking-[0.2em] mb-2">Monto de la Seña</p>
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-bold text-zinc-400">$</span>
               <span className="text-[3.5rem] font-black tracking-tighter text-zinc-900 dark:text-white leading-none">
                 {depositAmount.toLocaleString('es-AR')}
               </span>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <button
              onClick={openMercadoPago}
              className="w-full py-5 flex items-center justify-center gap-3 rounded-[1.25rem] font-black text-lg transition-all active:scale-95 text-white bg-primary shadow-[0_10px_25px_-5px_rgba(99,102,241,0.4)]"
            >
              <span className="material-symbols-outlined">payments</span>
              {linkPago ? 'Pagar Ahora' : 'Ir a Mercado Pago'}
            </button>

            <div className="flex items-center gap-4">
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 flex-1"></div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-300 font-black">O por transferencia</span>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800 flex-1"></div>
            </div>

            <button
              onClick={copyAlias}
              className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border-2 border-transparent hover:border-primary/20 p-5 rounded-[1.5rem] transition-all group w-full text-left"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black mb-1">Alias MP</p>
                <p className="text-[1.25rem] font-black tracking-tight text-zinc-900 dark:text-white truncate">{aliasMP}</p>
              </div>
              <div className="w-12 h-12 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-zinc-400 group-hover:scale-110">
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
              </div>
            </button>

            {qrImageUrl && (
              <div className="flex flex-col items-center gap-4 mt-2 pt-6 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="p-3 bg-white rounded-3xl shadow-sm border border-zinc-100">
                  <img src={qrImageUrl} alt="QR de pago" className="w-[140px] h-[140px]" />
                </div>
                <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Escaneá para pagar</p>
              </div>
            )}
          </div>
        </div>

        <ViralFooter />
      </div>

      {/* Floating Action WhatsApp - High Visibility */}
      <nav className="fixed bottom-8 left-0 right-0 z-50 flex justify-center items-center px-6 max-w-md mx-auto pointer-events-none animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl w-full rounded-[2rem] p-3 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-white/20 dark:border-zinc-800/50 pointer-events-auto flex flex-col gap-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-3 bg-[#25d366] text-white rounded-[1.25rem] py-4 font-black uppercase tracking-widest text-xs hover:scale-[1.02] shadow-[0_12px_24px_-8px_rgba(37,211,102,0.5)] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              Enviar Comprobante
            </a>
            
            {(typeof navigator !== 'undefined' && 'share' in navigator) && (
              <button
                onClick={() => navigator.share?.({ title: `Turno ${dateDisplay}`, text: `¡Reservé mi turno para el ${dateDisplay}!`, url: window.location.href }).catch(() => { })}
                className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-primary transition-colors"
              >
                Compartir link de reserva
              </button>
            )}
        </div>
      </nav>

    </div>
  );
};

export default ConfirmationPage;