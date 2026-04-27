/**
 * Sheets Service — Legacy wrapper
 * 
 * Re-exports everything from supabaseService to maintain
 * backward compatibility with existing imports across the codebase.
 */
export type {
    Profile,
    Appointment,
    CreateAppointmentData,
    ScheduleConfig,
    ServicesData,
    BlockedDate,
    CancellationAppointment,
    CancellationResult,
    AuthResult,
} from './supabaseService';

export {
    getProfile,
    saveProfile,
    getAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointmentStatus,
    getAppointmentForCancellation,
    cancelAppointmentByToken,
    deleteAppointment,
    getAvailableSlots,
    getSchedule,
    saveSchedule,
    getBlockedDates,
    saveBlockedDates,
    getServices,
    saveServices,
    registerUser,
    loginUser,
    uploadBusinessImage,
    sheetsService,
} from './supabaseService';

export { default } from './supabaseService';
