import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, useProfile, useCurrentAppointment } from '../context/AppContext';
import ViralFooter from '../components/ViralFooter';

const ConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug, id } = useParams<{ slug: string; id?: string }>();
  const { setSlug } = useApp();
  const { profile } = useProfile();
  const { appointment, load } = useCurrentAppointment();
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (slug) {
      setSlug(slug);
    }
  }, [slug, setSlug]);

  useEffect(() => {
    if (id) {
      load(id);
    }
  }, [id, load]);

  const businessPhone = profile?.Telefono || '5491112345678';
  const clientName = appointment?.NombreCliente || 'Cliente';
  const depositAmount = appointment?.MontoSena || profile?.ValorSena || 2000;
  const dateString = appointment?.Fecha || '2024-01-01';
  const [y, m, d] = dateString.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const date = appointment?.Fecha
    ? dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    : 'la fecha seleccionada';
  const aliasMP = profile?.AliasMP || 'mi.negocio.mp';
  const linkPago = profile?.LinkPago;
  const qrImageUrl = profile?.QrImageUrl;

  const whatsappMessage = `¡Hola! Soy ${clientName}, ya transferí la seña de $${depositAmount.toLocaleString('es-AR')} para el turno del ${date} 🙌`;
  const whatsappLink = `https://wa.me/${businessPhone}?text=${encodeURIComponent(whatsappMessage)}`;

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

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[100]">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-0"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: '-8px',
              backgroundColor: ['var(--color-primary)', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][i % 5],
              animation: `confettiFall 2.5s ease-out ${0.1 * i}s both`,
            }}
          />
        ))}
      </div>

      {toastVisible && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-toast-in">
          <div className="flex items-center gap-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-[1.125rem] py-3 rounded-[1.25rem] shadow-[0_10px_30px_rgba(0,0,0,0.15)] text-sm font-bold tracking-tight">
            <span className="material-symbols-outlined text-green-400">check_circle</span>
            ¡Copiado!
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center px-6 pb-2 justify-center relative">
        <h2 className="font-extrabold text-[1.125rem] tracking-tight">Tu Turno</h2>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-5 pt-8 pb-32 gap-8 max-w-md mx-auto w-full">

        {/* Success Hero */}
        <div className="flex flex-col items-center gap-4 text-center animate-fade-in-up">
          <div className="w-[84px] h-[84px] rounded-[1.75rem] bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-[0_16px_40px_-5px_var(--color-primary)]">
            <span className="material-symbols-outlined text-white text-[42px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 700" }}>check</span>
          </div>
          <div>
            <h1 className="text-[2.25rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-2">¡Casi listo! 🎉</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Solo te falta la seña para asegurar tu lugar.</p>
          </div>
        </div>

        {/* Appointment Data Card */}
        {appointment && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-[1.5rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-transparent animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[52px] rounded-[1.125rem] bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[24px]">event_available</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[1.125rem] font-extrabold tracking-tight truncate">{date} a las {appointment.Hora}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold truncate mt-0.5">{appointment.Servicio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Zone */}
        <div className="w-full bg-white dark:bg-zinc-900 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden animate-fade-in-up border border-transparent" style={{ animationDelay: '0.2s' }}>
          
          {/* Header */}
          <div className="flex flex-col items-center justify-center py-6 bg-zinc-50 dark:bg-zinc-950/50">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.1em] mb-1">Seña</p>
            <p className="text-[2.75rem] font-extrabold tracking-tight text-primary leading-none">
                ${depositAmount.toLocaleString('es-AR')}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Action 1 */}
            <button
              onClick={openMercadoPago}
              className={`w-full py-[1.125rem] flex items-center justify-center gap-3 rounded-[1.125rem] font-bold text-base transition-all active:scale-95 text-white
                ${linkPago ? 'bg-primary' : 'bg-[#009ee3]'}`}
            >
              <span className="material-symbols-outlined">{linkPago ? 'link' : 'account_balance_wallet'}</span>
              {linkPago ? 'Pagar online' : 'Ir a Mercado Pago'}
            </button>

            <div className="flex items-center gap-4">
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">O por Alias</span>
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
            </div>

            <button
              onClick={copyAlias}
              className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-950 border-2 border-transparent hover:border-primary/20 p-4 rounded-[1.125rem] transition-colors group w-full text-left"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-bold mb-0.5">Tocá para copiar</p>
                <p className="text-[1.125rem] font-bold tracking-tight text-zinc-900 dark:text-white truncate">{aliasMP}</p>
              </div>
              <div className="w-10 h-10 bg-white dark:bg-zinc-900 shadow-sm rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-zinc-400">
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
              </div>
            </button>

            {qrImageUrl && (
              <div className="flex flex-col items-center gap-3 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <img src={qrImageUrl} alt="QR de pago" className="w-[120px] h-[120px] rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700" />
                <p className="text-[11px] font-bold text-zinc-400">Escaneá con MP</p>
              </div>
            )}
          </div>
        </div>

        <ViralFooter />
      </div>

      {/* Floating Action WhatsApp */}
      <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center items-center px-4 max-w-md mx-auto pointer-events-none animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl w-[95%] rounded-[1.75rem] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.12)] pointer-events-auto flex flex-col gap-2">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25d366] text-white rounded-full py-[1.125rem] font-extrabold uppercase tracking-widest text-[11px] hover:scale-[1.02] shadow-[0_8px_20px_-8px_#25d366] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              Avisale por WhatsApp
            </a>
            
            {(typeof navigator !== 'undefined' && 'share' in navigator) && (
              <button
                onClick={() => navigator.share?.({ title: `Turno ${date}`, text: `¡Reservé mi turno para el ${date}!`, url: window.location.href }).catch(() => { })}
                className="w-full py-2.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Compartir comprobante
              </button>
            )}
        </div>
      </nav>

    </div>
  );
};

export default ConfirmationPage;