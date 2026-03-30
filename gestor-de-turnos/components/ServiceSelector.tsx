import React from 'react';
import { Service } from '../constants';

interface ServiceSelectorProps {
    services: Service[];
    /** IDs of currently selected services */
    selectedServiceIds: string[];
    /** Toggle a service on/off */
    onToggle: (service: Service) => void;
}

/**
 * Maps service name keywords to Material Symbols icon + color.
 * Uses the service name and ID prefix to find the best match.
 */
const SERVICE_ICON_MAP: { keywords: string[]; icon: string; color: string }[] = [
    // Peluquería
    { keywords: ['corte mujer', 'corte dama'], icon: 'face_3', color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
    { keywords: ['corte hombre', 'corte caballero'], icon: 'face_6', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { keywords: ['corte niñ', 'corte chic'], icon: 'child_care', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { keywords: ['brushing', 'peinado', 'recogido'], icon: 'air', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
    { keywords: ['coloración', 'color', 'tintura', 'tinte'], icon: 'palette', color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' },
    { keywords: ['mechas', 'balayage', 'reflejos'], icon: 'auto_awesome', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
    { keywords: ['keratina', 'botox', 'tratamiento capilar', 'hidratación'], icon: 'science', color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
    // Barbería
    { keywords: ['barba'], icon: 'face_6', color: 'text-stone-600 bg-stone-50 dark:bg-stone-900/20' },
    // Uñas
    { keywords: ['manicur', 'mani'], icon: 'back_hand', color: 'text-pink-400 bg-pink-50 dark:bg-pink-900/20' },
    { keywords: ['esculpida', 'acrílico', 'poligel', 'gel'], icon: 'diamond', color: 'text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20' },
    { keywords: ['semipermanente', 'esmaltado'], icon: 'brush', color: 'text-red-400 bg-red-50 dark:bg-red-900/20' },
    { keywords: ['pedicur', 'pedi'], icon: 'do_not_step', color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
    { keywords: ['retiro'], icon: 'remove_circle', color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' },
    // Cejas y pestañas
    { keywords: ['ceja', 'perfilado'], icon: 'visibility', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { keywords: ['pestaña', 'lifting', 'extensiones', 'laminado'], icon: 'remove_red_eye', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
    { keywords: ['henna'], icon: 'ink_pen', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
    // Depilación
    { keywords: ['axila'], icon: 'spa', color: 'text-lime-600 bg-lime-50 dark:bg-lime-900/20' },
    { keywords: ['pierna', 'cavado', 'bikini'], icon: 'spa', color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
    { keywords: ['bozo', 'rostro completo'], icon: 'face_retouching_natural', color: 'text-rose-400 bg-rose-50 dark:bg-rose-900/20' },
    { keywords: ['depilación', 'depila', 'cera', 'láser'], icon: 'spa', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    // Estética facial
    { keywords: ['limpieza facial', 'facial profunda'], icon: 'face_retouching_natural', color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
    { keywords: ['peeling'], icon: 'layers', color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' },
    { keywords: ['microneedling', 'dermapen'], icon: 'healing', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
    { keywords: ['radiofrecuencia'], icon: 'electric_bolt', color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' },
    // Masajes
    { keywords: ['descontracturante'], icon: 'fitness_center', color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
    { keywords: ['relajante'], icon: 'self_improvement', color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
    { keywords: ['drenaje', 'linfático'], icon: 'water_drop', color: 'text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
    { keywords: ['reflexología'], icon: 'do_not_step', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { keywords: ['masaje'], icon: 'self_improvement', color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
    // Fallback by ID prefix
    { keywords: ['pel-'], icon: 'content_cut', color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
    { keywords: ['bar-'], icon: 'face_6', color: 'text-stone-600 bg-stone-50 dark:bg-stone-900/20' },
    { keywords: ['una-'], icon: 'brush', color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
    { keywords: ['cep-'], icon: 'visibility', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
    { keywords: ['dep-'], icon: 'spa', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
    { keywords: ['est-'], icon: 'face_retouching_natural', color: 'text-sky-500 bg-sky-50 dark:bg-sky-900/20' },
    { keywords: ['mas-'], icon: 'self_improvement', color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20' },
];

function getServiceIcon(service: Service): { icon: string; color: string } {
    const haystack = (service.nombre + ' ' + service.id).toLowerCase();
    for (const entry of SERVICE_ICON_MAP) {
        if (entry.keywords.some(kw => haystack.includes(kw))) {
            return { icon: entry.icon, color: entry.color };
        }
    }
    return { icon: 'content_cut', color: 'text-primary bg-primary/10' };
}

/**
 * ServiceSelector — Componente de selección de servicios para el cliente.
 * Multi-select con checkboxes animados. Muestra solo servicios activos.
 */
const ServiceSelector: React.FC<ServiceSelectorProps> = ({ services, selectedServiceIds, onToggle }) => {
    const activeServices = services.filter(s => s.activo);

    if (activeServices.length === 0) {
        return (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                <span className="material-symbols-outlined text-5xl mb-3 block">content_cut</span>
                <p className="text-sm font-medium">No hay servicios disponibles por el momento.</p>
            </div>
        );
    }

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);

    const formatDuration = (mins: number) => {
        if (mins < 60) return `${mins} min`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}min` : `${h}h`;
    };

    // Compute totals for selected services
    const selectedServices = activeServices.filter(s => selectedServiceIds.includes(s.id));
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duracion, 0);
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.precio, 0);
    const totalDeposit = selectedServices.reduce((sum, s) => sum + s.sena, 0);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-text-primary-light dark:text-white">
                    ¿Qué servicios querés?
                </h3>
                {selectedServices.length > 0 && (
                    <span className="text-xs text-primary font-semibold bg-primary/10 px-2 py-1 rounded-full">
                        {selectedServices.length} seleccionado{selectedServices.length > 1 ? 's' : ''}
                    </span>
                )}
            </div>

            <div className="grid gap-2.5">
                {activeServices.map(service => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    const { icon, color } = getServiceIcon(service);
                    const colorParts = color.split(' ');
                    const textColor = colorParts[0]; // e.g. text-pink-500
                    const bgColor = colorParts.slice(1).join(' '); // e.g. bg-pink-50 dark:bg-pink-900/20

                    return (
                        <button
                            key={service.id}
                            onClick={() => onToggle(service)}
                            className={`
                                w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 relative overflow-hidden
                                ${isSelected
                                    ? 'border-primary bg-gradient-to-r from-primary/5 to-violet-50 dark:from-primary/10 dark:to-violet-900/10 shadow-md shadow-primary/10'
                                    : 'border-gray-100 dark:border-gray-700 hover:border-primary/40 bg-white dark:bg-surface-dark hover:shadow-sm'
                                }
                            `}
                        >
                            {/* Selected glow accent */}
                            {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl" />
                            )}

                            <div className="flex items-center gap-3">
                                {/* Service icon */}
                                <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-primary/10' : bgColor}`}>
                                    <span className={`material-symbols-outlined text-[20px] transition-colors ${isSelected ? 'text-primary' : textColor}`}>{icon}</span>
                                </div>

                                {/* Custom animated checkbox */}
                                <div className={`
                                    size-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 shrink-0
                                    ${isSelected
                                        ? 'border-primary bg-primary scale-110 shadow-sm shadow-primary/30'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark'
                                    }
                                `}>
                                    {isSelected && (
                                        <svg className="w-3 h-3 text-white" viewBox="0 0 14 14" fill="none">
                                            <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </div>

                                {/* Service info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-sm leading-snug ${isSelected ? 'text-primary' : 'text-text-primary-light dark:text-white'}`}>
                                        {service.nombre}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className={`text-[11px] flex items-center gap-1 ${isSelected ? 'text-primary/70' : 'text-gray-400'}`}>
                                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                                            {formatDuration(service.duracion)}
                                        </span>
                                        {service.sena > 0 && (
                                            <span className={`text-[11px] ${isSelected ? 'text-primary/70' : 'text-gray-400'}`}>
                                                · Seña {formatPrice(service.sena)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Price */}
                                <span className={`font-black text-base shrink-0 ${isSelected ? 'text-primary' : 'text-text-primary-light dark:text-white'}`}>
                                    {formatPrice(service.precio)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Summary card when services are selected */}
            {selectedServices.length > 0 && (
                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-primary to-violet-600 shadow-lg shadow-primary/25 animate-fade-in-up">
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mb-1">
                                {selectedServices.length} servicio{selectedServices.length > 1 ? 's' : ''}
                                · {formatDuration(totalDuration)}
                            </p>
                            <p className="text-white font-black text-xl tracking-tight">{formatPrice(totalPrice)}</p>
                            {totalDeposit > 0 && (
                                <p className="text-white/70 text-[11px] mt-0.5">Seña: {formatPrice(totalDeposit)}</p>
                            )}
                        </div>
                        <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[22px]">shopping_bag</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceSelector;
