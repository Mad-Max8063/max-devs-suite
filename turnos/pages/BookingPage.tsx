import React, { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp, useProfile, useServices } from '../context/AppContext';
import { useCreateAppointment, useAvailableSlots } from '../hooks/useAppointments';
import { useScheduleInfo } from '../hooks/useSchedule';
import { Service } from '../constants';
import ViralFooter from '../components/ViralFooter';

const ARGENTINE_MOBILE_REGEX = /^549\d{10}$/;

function normalizeArgentineMobilePhone(value: string): string | null {
    const digits = value.replace(/\D/g, '').replace(/^0+/, '');
    let normalized = digits;

    if (digits.startsWith('549')) {
        normalized = digits;
    } else if (digits.startsWith('54')) {
        normalized = `549${digits.slice(digits.startsWith('549') ? 3 : 2)}`;
    } else if (digits.startsWith('9')) {
        normalized = `54${digits}`;
    } else {
        normalized = `549${digits}`;
    }

    return ARGENTINE_MOBILE_REGEX.test(normalized) ? normalized : null;
}

function formatPhoneInput(value: string): string {
    let digits = value.replace(/\D/g, '');

    if (digits.startsWith('549')) digits = digits.slice(3);
    else if (digits.startsWith('54')) digits = digits.slice(2);
    else if (digits.startsWith('9')) digits = digits.slice(1);

    digits = digits.slice(0, 10);

    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
}

const BookingPage: React.FC = () => {
    const navigate = useNavigate();
    const { slug: urlSlug } = useParams<{ slug: string }>();
    const { setSlug, slug: contextSlug, isPremiumActive, isTrialExpired } = useApp();
    const { profile, loading: profileLoading } = useProfile();
    const { create, loading: creating, error: createError } = useCreateAppointment();
    const { slots, fetchSlots } = useAvailableSlots();

    const slug = urlSlug || contextSlug || undefined;

    const {
        isDateAvailable,
        loading: scheduleLoading
    } = useScheduleInfo(slug || '');

    const { activeServices } = useServices();

    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [honeypot, setHoneypot] = useState('');
    const [submitCooldown, setSubmitCooldown] = useState(false);

    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (slug) {
            setSlug(slug);
        }
    }, [slug, setSlug]);

    useEffect(() => {
        if (slug && selectedDate) {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            fetchSlots(slug, dateStr);
        }
    }, [slug, selectedDate, fetchSlots]);

    const generateCalendarDays = useCallback(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d));
        }

        return days;
    }, [currentMonth]);

    const days = generateCalendarDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthName = currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

    const toggleService = useCallback((service: Service) => {
        setSelectedServices(prev => {
            const exists = prev.find(s => s.id === service.id);
            if (exists) {
                return prev.filter(s => s.id !== service.id);
            }
            return [...prev, service];
        });
    }, []);

    const serviceNames = selectedServices.map(s => s.nombre).join(' + ') || 'Servicio General';
    const hasServices = selectedServices.length > 0;
    const servicePrice = hasServices ? selectedServices.reduce((sum, s) => sum + s.precio, 0) : 0;
    const totalDeposit = selectedServices.reduce((sum, s) => sum + s.sena, 0) || profile?.ValorSena || 0;
    const normalizedClientPhone = normalizeArgentineMobilePhone(clientPhone);
    const hasPhoneInput = clientPhone.replace(/\D/g, '').length > 0;
    const isClientPhoneInvalid = hasPhoneInput && !normalizedClientPhone;

    const handleSubmit = async () => {
        if (honeypot) return;

        if (!selectedDate || !selectedTime || !clientName || !clientPhone || !slug) {
            setFormError('Completá todos los campos para continuar');
            return;
        }

        if (!normalizedClientPhone) {
            setFormError('Ingresá un celular argentino válido. Ej: 11 2345 6789');
            return;
        }

        if (activeServices.length > 0 && selectedServices.length === 0) {
            setFormError('Elegí al menos un servicio para seguir');
            return;
        }

        setFormError(null);

        try {
            const year = selectedDate.getFullYear();
            const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const day = String(selectedDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const result = await create({
                Slug: slug,
                Fecha: dateStr,
                Hora: selectedTime,
                NombreCliente: clientName,
                TelefonoCliente: normalizedClientPhone,
                EmailCliente: clientEmail || undefined,
                Servicio: serviceNames,
                PrecioTotal: servicePrice,
                MontoSena: totalDeposit,
            });

            navigate(`/${slug}/confirmation/${result}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No pudimos crear tu reserva. Por favor intentá de nuevo.';
            setFormError(message);
            setSubmitCooldown(true);
            setTimeout(() => setSubmitCooldown(false), 5000);
            logger.error('Booking failed:', error);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-on-surface font-sans relative overflow-hidden">
            
            {/* Mesh Background Decorative */}
            <div className="fixed inset-0 mesh-gradient-bg opacity-[0.06] -z-10" />

            {/* Top Bar */}
            <header className="fixed top-0 w-full z-40 bg-background/60 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="size-10 rounded-2xl bg-surface border border-white/10 ambient-shadow flex items-center justify-center active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-primary text-[20px]">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-sm font-black tracking-tight text-on-surface leading-none">
                            {profileLoading ? 'Cargando...' : (profile?.NombreNegocio || 'Reservar Turno')}
                        </h1>
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mt-1">
                            Reserva Online
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 pt-24 pb-40 px-6 max-w-6xl mx-auto w-full overflow-y-auto no-scrollbar">
                <div className="dashboard-grid">
                    
                    {/* Left Column: Configuration */}
                    <div className="space-y-12">
                        {/* Step 1: Services */}
                        {activeServices.length > 0 && (
                            <section className="animate-fade-in-up">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black tracking-tighter text-on-surface leading-none mb-2">
                                        Elegí tu <span className="text-primary italic">Servicio</span>
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                                        Paso 01 / Seleccioná tus opciones
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {activeServices.map(s => {
                                        const isSelected = selectedServices.some(sel => sel.id === s.id);
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => toggleService(s)}
                                                className={`
                                                    w-full text-left p-5 rounded-[2rem] border transition-all relative overflow-hidden
                                                    ${isSelected 
                                                        ? 'bg-primary/10 border-primary/40 ambient-shadow' 
                                                        : 'bg-surface/40 border-white/5 ambient-shadow hover:bg-surface/60'
                                                    }
                                                `}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-base text-on-surface">{s.nombre}</h3>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <div className="flex items-center gap-1 opacity-40">
                                                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{s.duracion} min</span>
                                                            </div>
                                                            {s.precio > 0 && (
                                                                <span className="text-xs font-black text-primary">${s.precio.toLocaleString('es-AR')}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`
                                                        size-8 rounded-full border-2 flex items-center justify-center transition-all
                                                        ${isSelected ? 'bg-primary border-primary' : 'border-white/10'}
                                                    `}>
                                                        {isSelected && <span className="material-symbols-outlined text-white text-[18px]">check</span>}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Step 2: Calendar */}
                        <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                            <div className="mb-6 flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tighter text-on-surface leading-none mb-2">
                                        Buscá una <span className="text-primary italic">Fecha</span>
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                                        Paso 02 / Disponibilidad en tiempo real
                                    </p>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary italic capitalize">
                                    {monthName}
                                </span>
                            </div>

                            <div className="glass-card ambient-shadow rounded-[2.5rem] p-6 border-white/60">
                                <div className="flex justify-between items-center mb-6 px-2">
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="size-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">west</span>
                                    </button>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Seleccioná un día</p>
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="size-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">east</span>
                                    </button>
                                </div>

                                <div className="grid grid-cols-7 gap-y-2 text-center">
                                    {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                                        <span key={d} className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-20 pb-4">{d}</span>
                                    ))}
                                    {days.map((day, idx) => {
                                        const available = day ? isDateAvailable(day) : false;
                                        const isSelected = day && selectedDate && day.toDateString() === selectedDate.toDateString();
                                        
                                        return (
                                            <button
                                                key={idx}
                                                disabled={!day || !available}
                                                onClick={() => day && available && setSelectedDate(day)}
                                                className={`
                                                    relative h-11 w-full rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center
                                                    ${!day ? 'invisible' : ''}
                                                    ${!available && day ? 'opacity-10 cursor-not-allowed' : ''}
                                                    ${isSelected 
                                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 active:scale-95' 
                                                        : available ? 'hover:bg-primary/5 text-on-surface' : 'text-on-surface'
                                                    }
                                                `}
                                            >
                                                {day?.getDate()}
                                                {available && !isSelected && (
                                                    <span className="absolute bottom-1.5 size-1 rounded-full bg-primary/30"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Timeslots & Checkout */}
                    <div className="sticky-panel space-y-12">
                        {/* Timeslots */}
                        {selectedDate ? (
                            <section className="animate-fade-in-up">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black tracking-tighter text-on-surface leading-none mb-2">
                                        Elegí el <span className="text-primary italic">Horario</span>
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                                        {selectedDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                                    </p>
                                </div>

                                {slots.length === 0 ? (
                                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6 text-center">
                                        <p className="text-xs font-bold text-primary opacity-60 italic">No hay horarios disponibles para este día.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        {slots.map((time, idx) => {
                                            const isSelected = selectedTime === time;
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedTime(time)}
                                                    className={`
                                                        py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border
                                                        ${isSelected 
                                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' 
                                                            : 'bg-surface/40 border-white/5 ambient-shadow hover:bg-surface/60'
                                                        }
                                                    `}
                                                >
                                                    {time}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {isTrialExpired && !isPremiumActive && (
                                    <div className="mt-8 overflow-hidden relative glass-card border-primary/30 p-6 rounded-[2.5rem] ambient-shadow group hover:border-primary/60 transition-all duration-500">
                                        {/* Golden Glow Effect */}
                                        <div className="absolute -top-24 -right-24 size-48 bg-primary/20 blur-[60px] group-hover:bg-primary/30 transition-all duration-500" />
                                        
                                        <div className="relative flex flex-col sm:flex-row items-center gap-6">
                                            <div className="size-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <span className="material-symbols-outlined text-[32px] animate-pulse">verified</span>
                                            </div>
                                            
                                            <div className="flex-1 text-center sm:text-left">
                                                <h4 className="text-xs font-black uppercase tracking-widest text-on-surface mb-1">Potenciá tu Negocio</h4>
                                                <p className="text-[11px] font-bold text-on-surface-variant opacity-60 leading-relaxed">
                                                    Estás usando la <span className="text-primary font-black">Versión Free</span>. Pasate a Premium para habilitar horarios ilimitados y automatizaciones.
                                                </p>
                                            </div>

                                            <a 
                                                href={`/admin/dashboard-v2029.html?business=${slug}`} 
                                                className="px-8 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-[0.15em] rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                                            >
                                                Obtener Premium
                                            </a>
                                        </div>
                                        
                                        {/* Progress Bar (Visual indicator of limitation) */}
                                        <div className="mt-6 h-2 w-full bg-black/5 rounded-full overflow-hidden p-[2px]">
                                            <div className="h-full bg-primary w-1/3 rounded-full shadow-[0_0_12px_rgba(var(--color-primary-rgb),0.6)]" />
                                        </div>
                                        <div className="mt-3 flex justify-between items-center px-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-30">
                                                Disponibilidad: 3 slots diarios
                                            </p>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-primary animate-bounce">
                                                Desbloqueá el 100%
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </section>
                        ) : (
                            <div className="hidden lg:flex flex-col items-center justify-center h-64 border-2 border-dashed border-black/5 rounded-[2.5rem] opacity-20">
                                <span className="material-symbols-outlined text-[48px] mb-4">event_available</span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-center">Seleccioná un día para ver horarios</p>
                            </div>
                        )}

                        {/* Client Details */}
                        {selectedDate && selectedTime && (
                            <section className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black tracking-tighter text-on-surface leading-none mb-2">
                                        Tus <span className="text-primary italic">Datos</span>
                                    </h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-40">
                                        Paso 03 / Completá tu reserva
                                    </p>
                                </div>

                                <div className="glass-card ambient-shadow rounded-[2.5rem] p-7 border-white/60 space-y-6">
                                    <input
                                        type="text"
                                        name="website_url"
                                        value={honeypot}
                                        onChange={(e) => setHoneypot(e.target.value)}
                                        tabIndex={-1}
                                        autoComplete="off"
                                        style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, width: 0 }}
                                    />
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-4">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            className="w-full rounded-[1.25rem] border border-white/10 bg-surface/60 px-5 py-4 text-sm font-bold focus:border-primary focus:ring-0 text-white placeholder:opacity-20 outline-none transition-all"
                                            placeholder="Ej: Max Power"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest opacity-30 ml-4">Teléfono de Contacto</label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            value={clientPhone}
                                            onChange={(e) => {
                                                setClientPhone(formatPhoneInput(e.target.value));
                                                if (formError) setFormError(null);
                                            }}
                                            className={`w-full rounded-[1.25rem] border bg-surface/60 px-5 py-4 text-sm font-bold focus:ring-0 text-white placeholder:opacity-20 outline-none transition-all ${
                                                isClientPhoneInvalid
                                                    ? 'border-red-400 focus:border-red-400'
                                                    : 'border-white/10 focus:border-primary'
                                            }`}
                                            placeholder="Ej: 11 2345 6789"
                                        />
                                        <p className={`ml-4 text-[10px] font-bold ${isClientPhoneInvalid ? 'text-red-400' : 'text-on-surface-variant opacity-40'}`}>
                                            {isClientPhoneInvalid ? 'Usá un celular argentino sin 0 ni 15.' : 'Formato WhatsApp Argentina.'}
                                        </p>
                                    </div>
                                </div>

                                {formError && (
                                    <div className="mt-6 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 text-xs text-red-600 font-bold animate-toast-in flex items-center gap-3">
                                        <span className="material-symbols-outlined text-[18px]">error</span>
                                        {formError}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>
                </div>

                <div className="pt-20">
                    <ViralFooter />
                </div>
            </main>

            {/* Sticky Action Button */}
            {(selectedDate && selectedTime && clientName && clientPhone) && (
                <div className="fixed bottom-10 left-0 right-0 z-50 px-6 flex justify-center animate-fade-in-up">
                    <button
                        onClick={handleSubmit}
                        disabled={creating || submitCooldown || !selectedDate || !selectedTime || !clientName || !clientPhone || !normalizedClientPhone}
                        className="group w-full max-w-md bg-primary text-white font-black py-5 rounded-full shadow-2xl shadow-primary/40 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    >
                        {creating ? (
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Confirmar Reserva {servicePrice > 0 ? `· $${servicePrice.toLocaleString('es-AR')}` : ''}</span>
                                <span className="material-symbols-outlined text-[18px] group-hover:translate-x-2 transition-transform">check_circle</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default BookingPage;
