import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSchedule, useBlockedDates, ALL_TIME_SLOTS, DAYS_OF_WEEK } from '../hooks/useSchedule';
import BottomNavigation from '../components/BottomNavigation';
import DemoBanner from '../components/DemoBanner';
import DemoSaveModal from '../components/DemoSaveModal';

const ScheduleConfigPage: React.FC = () => {
    const navigate = useNavigate();
    const { slug: urlSlug } = useParams<{ slug: string }>();
    const { slug: contextSlug, setSlug } = useApp();

    // Use URL slug or context slug (for demo routes)
    const slug = urlSlug || contextSlug || 'demo';

    // Use hooks
    const {
        schedule,
        loading,
        saving,
        saveSchedule,
        toggleSlot,
        setDuration,
        copyDaySchedule,
    } = useSchedule(slug);

    const {
        blockedDates,
        saving: savingBlocked,
        saveBlockedDates,
        addBlockedDate,
        removeBlockedDate,
    } = useBlockedDates(slug);

    // Local state
    const [selectedDay, setSelectedDay] = useState<number>(1); // Start with Monday
    const [newBlockedDate, setNewBlockedDate] = useState('');
    const [newBlockedReason, setNewBlockedReason] = useState('');
    const [saved, setSaved] = useState(false);
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [includeSaturday, setIncludeSaturday] = useState(true);

    // Sync slug
    React.useEffect(() => {
        if (urlSlug && urlSlug !== contextSlug) setSlug(urlSlug);
    }, [urlSlug, contextSlug, setSlug]);

    // Handle save
    const handleSave = async () => {
        // Show demo modal if in demo mode
        if (slug === 'demo') {
            setShowDemoModal(true);
            return;
        }

        try {
            await saveSchedule(schedule);
            await saveBlockedDates(blockedDates);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            alert('Error guardando configuración');
        }
    };

    // Add blocked date
    const handleAddBlocked = () => {
        if (newBlockedDate) {
            addBlockedDate(newBlockedDate, newBlockedReason);
            setNewBlockedDate('');
            setNewBlockedReason('');
        }
    };

    // Get slots for selected day
    const daySlots = schedule.horariosPorDia[selectedDay] || [];

    // Copy current day to other days
    const handleCopyToAll = () => {
        const otherDays = DAYS_OF_WEEK
            .filter((d) => d.id !== selectedDay && d.id !== 0) // Exclude current day and Sunday
            .filter((d) => includeSaturday || d.id !== 6) // Optionally exclude Saturday
            .map((d) => d.id);
        copyDaySchedule(selectedDay, otherDays);
        setShowCopyModal(false);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
            {/* Demo Modal */}
            <DemoSaveModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />

            {/* Demo Banner */}
            {slug && <DemoBanner slug={slug} />}

            {/* Top App Bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 shadow-sm">
                <button
                    onClick={() => navigate(`/${slug}/config`)}
                    className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight text-center flex-1">
                    Horarios de Atención
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving || savingBlocked}
                    className="flex items-center px-2 py-1"
                >
                    <span className={`font-bold text-base ${saved ? 'text-green-500' : 'text-primary'}`}>
                        {saving || savingBlocked ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
                    </span>
                </button>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-24">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {/* Duration Selector */}
                        <div className="px-4 py-4 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800">
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                                Duración de cada turno
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {[30, 45, 60, 90, 120].map((mins) => (
                                    <button
                                        key={mins}
                                        onClick={() => setDuration(mins)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${schedule.duracionTurno === mins
                                            ? 'bg-primary text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {mins} min
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Day Tabs */}
                        <div className="px-4 py-3 bg-surface-light dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
                            <div className="flex gap-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <button
                                        key={day.id}
                                        onClick={() => setSelectedDay(day.id)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDay === day.id
                                            ? 'bg-primary text-white shadow-md'
                                            : schedule.horariosPorDia[day.id]?.length
                                                ? 'bg-primary/10 text-primary border border-primary/30'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                            }`}
                                    >
                                        {day.short}
                                        {schedule.horariosPorDia[day.id]?.length > 0 && (
                                            <span className="ml-1 text-xs opacity-70">
                                                ({schedule.horariosPorDia[day.id].length})
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Day Header with Actions */}
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                            <h2 className="text-base font-bold">
                                {DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.name}
                            </h2>
                            <button
                                onClick={() => setShowCopyModal(true)}
                                className="text-primary text-sm font-medium flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                                Copiar a otros días
                            </button>
                        </div>

                        {/* Time Slots Grid */}
                        <div className="px-4 py-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Toca los horarios en los que atendés este día:
                            </p>
                            <div className="grid grid-cols-4 gap-2">
                                {ALL_TIME_SLOTS.map((slot) => {
                                    const isSelected = daySlots.includes(slot);
                                    return (
                                        <button
                                            key={slot}
                                            onClick={() => toggleSlot(selectedDay, slot)}
                                            className={`py-2.5 rounded-lg text-sm font-medium transition-all border ${isSelected
                                                ? 'bg-primary text-white border-primary shadow-md'
                                                : 'bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary/50'
                                                }`}
                                        >
                                            {slot}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="px-4 py-4 mt-4">
                            <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/20">
                                <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">
                                        calendar_month
                                    </span>
                                    Resumen Semanal
                                </h3>
                                <div className="grid grid-cols-7 gap-1">
                                    {DAYS_OF_WEEK.map((day) => {
                                        const count = schedule.horariosPorDia[day.id]?.length || 0;
                                        return (
                                            <div
                                                key={day.id}
                                                className={`text-center py-2 rounded ${count > 0
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                                    }`}
                                            >
                                                <div className="text-[10px] font-bold">{day.short}</div>
                                                <div className="text-xs">{count > 0 ? count : '-'}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Blocked Dates Section */}
                        <div className="px-4 py-4 mt-2">
                            <h2 className="text-base font-bold mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-red-500 text-[20px]">
                                    event_busy
                                </span>
                                Fechas Bloqueadas
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Días especiales donde no atendés (vacaciones, feriados, etc.)
                            </p>

                            {/* Add Blocked Date */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="date"
                                    value={newBlockedDate}
                                    onChange={(e) => setNewBlockedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm"
                                />
                                <input
                                    type="text"
                                    value={newBlockedReason}
                                    onChange={(e) => setNewBlockedReason(e.target.value)}
                                    placeholder="Motivo (opcional)"
                                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark text-sm"
                                />
                                <button
                                    onClick={handleAddBlocked}
                                    disabled={!newBlockedDate}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </div>

                            {/* Blocked Dates List */}
                            {blockedDates.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm py-4">
                                    No hay fechas bloqueadas
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {blockedDates.map((date) => (
                                        <div
                                            key={date.Fecha}
                                            className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {new Date(date.Fecha + 'T12:00:00').toLocaleDateString('es-AR', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long',
                                                    })}
                                                </p>
                                                {date.Motivo && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {date.Motivo}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeBlockedDate(date.Fecha)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <div className="px-4 py-6">
                            <button
                                onClick={handleSave}
                                disabled={saving || savingBlocked}
                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined">
                                    {saved ? 'check_circle' : 'save'}
                                </span>
                                {saving || savingBlocked
                                    ? 'Guardando...'
                                    : saved
                                        ? '¡Cambios Guardados!'
                                        : 'Guardar Configuración'}
                            </button>
                        </div>
                    </>
                )}
            </main>

            {/* Copy Modal */}
            {showCopyModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                    <div className="bg-surface-light dark:bg-surface-dark w-full max-w-md rounded-t-2xl p-6 animate-slide-up">
                        <h3 className="text-lg font-bold mb-4">Copiar a otros días</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Se copiarán los horarios de{' '}
                            <strong>{DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.name}</strong> a los
                            días seleccionados.
                        </p>

                        {/* Saturday toggle */}
                        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={includeSaturday}
                                onChange={(e) => setIncludeSaturday(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <div>
                                <span className="font-medium">Incluir Sábado</span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {includeSaturday ? 'Se copiará a Lun-Sáb' : 'Se copiará a Lun-Vie'}
                                </p>
                            </div>
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCopyModal(false)}
                                className="flex-1 py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCopyToAll}
                                className="flex-1 py-3 bg-primary text-white rounded-xl font-bold"
                            >
                                Copiar a Todos
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Bottom Navigation */}
            {slug && <BottomNavigation slug={slug} />}
        </div>
    );
};

export default ScheduleConfigPage;
