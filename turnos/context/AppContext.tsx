import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { logger } from '../utils/logger';
import { Profile, Appointment, sheetsService } from '../services/sheetsService';
import { Service, BUSINESS_CATEGORIES } from '../constants';
import { useApiMode } from '../hooks/useApiMode';

// ============================================
// TYPES
// ============================================
interface AppState {
    // Current entrepreneur slug (from URL)
    slug: string | null;

    // Profile data
    profile: Profile | null;
    profileLoading: boolean;
    profileError: string | null;

    // Appointments data
    appointments: Appointment[];
    appointmentsLoading: boolean;
    appointmentsError: string | null;

    // Current view appointment (for detail page)
    currentAppointment: Appointment | null;

    // Services
    services: Service[];
    selectedCategoryId: string | null;
}

interface AppActions {
    setSlug: (slug: string) => void;
    refreshProfile: () => Promise<void>;
    updateProfile: (data: Partial<Profile>) => Promise<{ slug: string }>;
    refreshAppointments: (status?: 'Pendiente' | 'Confirmado' | 'Cancelado' | 'all') => Promise<void>;
    updateAppointmentStatus: (id: string, status: 'Pendiente' | 'Confirmado' | 'Cancelado') => Promise<void>;
    setCurrentAppointment: (appointment: Appointment | null) => void;
    loadAppointmentById: (id: string) => Promise<Appointment | null>;
    setServices: (services: Service[]) => void;
    setSelectedCategoryId: (categoryId: string) => void;
    refreshServices: () => Promise<void>;
    saveServicesToBackend: (services: Service[], categoryId: string | null) => Promise<void>;
}

type AppContextType = AppState & AppActions;

// ============================================
// CONTEXT
// ============================================
const AppContext = createContext<AppContextType | undefined>(undefined);

// ============================================
// DEMO DATA (for when Apps Script is not configured)
// ============================================
const DEMO_PROFILE: Profile = {
    Slug: 'demo',
    Email: 'demo@ejemplo.com',
    NombreNegocio: 'Barbería Styles',
    Telefono: '5491112345678',
    ValorSena: 2000,
    AliasMP: 'barber.styles.mp',
    LinkPago: 'https://mpago.la/example',
    FotoURL: 'https://picsum.photos/seed/barber/200/200',
    NotificacionesEmail: true,
    RecordatoriosActivos: true,
    ColorPrimario: '#7c3aed',
    ActiveModules: ['appointments', 'card'],
};

// Helper to get local date string
const getLocalDateString = (daysOffset: number = 0): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DEMO_APPOINTMENTS: Appointment[] = [
    // Hoy - variedad de horarios
    {
        ID: '1',
        Slug: 'demo',
        Fecha: getLocalDateString(0),
        Hora: '10:00',
        Estado: 'Pendiente',
        NombreCliente: 'Juan Pérez',
        TelefonoCliente: '5491123456789',
        Servicio: 'Corte de Cabello',
        PrecioTotal: 4000,
        MontoSena: 2000,
        CreatedAt: new Date().toISOString(),
    },
    {
        ID: '2',
        Slug: 'demo',
        Fecha: getLocalDateString(0),
        Hora: '14:30',
        Estado: 'Pendiente',
        NombreCliente: 'Ana Gómez',
        TelefonoCliente: '5491198765432',
        Servicio: 'Coloración',
        PrecioTotal: 8000,
        MontoSena: 4000,
        CreatedAt: new Date().toISOString(),
    },
    {
        ID: '3',
        Slug: 'demo',
        Fecha: getLocalDateString(0),
        Hora: '09:00',
        Estado: 'Confirmado',
        NombreCliente: 'Carlos Ruiz',
        TelefonoCliente: '5491155555555',
        Servicio: 'Barba',
        PrecioTotal: 3000,
        MontoSena: 1500,
        CreatedAt: new Date().toISOString(),
    },
    {
        ID: '4',
        Slug: 'demo',
        Fecha: getLocalDateString(0),
        Hora: '18:00',
        Estado: 'Confirmado',
        NombreCliente: 'Sofía Martín',
        TelefonoCliente: '5491177778888',
        Servicio: 'Peinado',
        PrecioTotal: 3500,
        MontoSena: 1500,
        CreatedAt: new Date().toISOString(),
    },

    // Mañana
    {
        ID: '5',
        Slug: 'demo',
        Fecha: getLocalDateString(1),
        Hora: '11:00',
        Estado: 'Pendiente',
        NombreCliente: 'María López',
        TelefonoCliente: '5491133334444',
        Servicio: 'Mechas',
        PrecioTotal: 12000,
        MontoSena: 6000,
        CreatedAt: new Date().toISOString(),
    },
    {
        ID: '6',
        Slug: 'demo',
        Fecha: getLocalDateString(1),
        Hora: '16:00',
        Estado: 'Confirmado',
        NombreCliente: 'Pedro Martínez',
        TelefonoCliente: '5491144445555',
        Servicio: 'Corte + Barba',
        PrecioTotal: 5000,
        MontoSena: 2500,
        CreatedAt: new Date().toISOString(),
    },
    {
        ID: '7',
        Slug: 'demo',
        Fecha: getLocalDateString(1),
        Hora: '19:30',
        Estado: 'Pendiente',
        NombreCliente: 'Lucía Fernández',
        TelefonoCliente: '5491166667777',
        Servicio: 'Alaciado',
        PrecioTotal: 9000,
        MontoSena: 4500,
        CreatedAt: new Date().toISOString(),
    },

    // +2 días
    {
        ID: '8',
        Slug: 'demo',
        Fecha: getLocalDateString(2),
        Hora: '09:30',
        Estado: 'Confirmado',
        NombreCliente: 'Diego Rodríguez',
        TelefonoCliente: '5491188889999',
        Servicio: 'Corte Niño',
        PrecioTotal: 2500,
        MontoSena: 1000,
        CreatedAt: new Date().toISOString(),
    },
    {
        ID: '9',
        Slug: 'demo',
        Fecha: getLocalDateString(2),
        Hora: '15:30',
        Estado: 'Pendiente',
        NombreCliente: 'Valentina Castro',
        TelefonoCliente: '5491199990000',
        Servicio: 'Nutrición Capilar',
        PrecioTotal: 7500,
        MontoSena: 3500,
        CreatedAt: new Date().toISOString(),
    },

    // +3 días
    {
        ID: '10',
        Slug: 'demo',
        Fecha: getLocalDateString(3),
        Hora: '11:00',
        Estado: 'Pendiente',
        NombreCliente: 'Laura Sánchez',
        TelefonoCliente: '5491166667777',
        Servicio: 'Tratamiento Capilar',
        PrecioTotal: 6000,
        MontoSena: 3000,
        CreatedAt: new Date().toISOString(),
    },
    {
        ID: '11',
        Slug: 'demo',
        Fecha: getLocalDateString(3),
        Hora: '17:00',
        Estado: 'Confirmado',
        NombreCliente: 'Roberto García',
        TelefonoCliente: '5491100001111',
        Servicio: 'Corte + Lavado',
        PrecioTotal: 4500,
        MontoSena: 2000,
        CreatedAt: new Date().toISOString(),
    },

    // +5 días
    {
        ID: '12',
        Slug: 'demo',
        Fecha: getLocalDateString(5),
        Hora: '10:30',
        Estado: 'Pendiente',
        NombreCliente: 'Carolina Díaz',
        TelefonoCliente: '5491122223333',
        Servicio: 'Balayage',
        PrecioTotal: 15000,
        MontoSena: 7500,
        CreatedAt: new Date().toISOString(),
    },
    {
        ID: '13',
        Slug: 'demo',
        Fecha: getLocalDateString(5),
        Hora: '14:00',
        Estado: 'Confirmado',
        NombreCliente: 'Mateo Silva',
        TelefonoCliente: '5491133334444',
        Servicio: 'Rapado',
        PrecioTotal: 3000,
        MontoSena: 1500,
        CreatedAt: new Date().toISOString(),
    },

    // +7 días
    {
        ID: '14',
        Slug: 'demo',
        Fecha: getLocalDateString(7),
        Hora: '12:00',
        Estado: 'Pendiente',
        NombreCliente: 'Gabriela Torres',
        TelefonoCliente: '5491144445555',
        Servicio: 'Alisado Permanente',
        PrecioTotal: 20000,
        MontoSena: 10000,
        CreatedAt: new Date().toISOString(),
    },
    {
        ID: '15',
        Slug: 'demo',
        Fecha: getLocalDateString(7),
        Hora: '18:30',
        Estado: 'Confirmado',
        NombreCliente: 'Nicolás Romero',
        TelefonoCliente: '5491155556666',
        Servicio: 'Corte Degradado',
        PrecioTotal: 4500,
        MontoSena: 2000,
        CreatedAt: new Date().toISOString(),
    },

    // +10 días
    {
        ID: '16',
        Slug: 'demo',
        Fecha: getLocalDateString(10),
        Hora: '13:30',
        Estado: 'Pendiente',
        NombreCliente: 'Camila Benítez',
        TelefonoCliente: '5491166667777',
        Servicio: 'Reflejos',
        PrecioTotal: 8500,
        MontoSena: 4000,
        CreatedAt: new Date().toISOString(),
    },

    // +12 días
    {
        ID: '17',
        Slug: 'demo',
        Fecha: getLocalDateString(12),
        Hora: '11:30',
        Estado: 'Confirmado',
        NombreCliente: 'Martín Vega',
        TelefonoCliente: '5491177778888',
        Servicio: 'Corte + Barba Premium',
        PrecioTotal: 6500,
        MontoSena: 3000,
        CreatedAt: new Date().toISOString(),
    },

    // +14 días
    {
        ID: '18',
        Slug: 'demo',
        Fecha: getLocalDateString(14),
        Hora: '16:30',
        Estado: 'Pendiente',
        NombreCliente: 'Florencia Morales',
        TelefonoCliente: '5491188889999',
        Servicio: 'Brushing',
        PrecioTotal: 3500,
        MontoSena: 1500,
        CreatedAt: new Date().toISOString(),
    },
];

// ============================================
// PROVIDER
// ============================================
interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    // State
    const [slug, setSlug] = useState<string | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

    const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);

    // Services state
    const demoCategory = BUSINESS_CATEGORIES.find(c => c.id === 'barberia')!;
    const [services, setServices] = useState<Service[]>(
        demoCategory.servicios.map((s, i) => ({ ...s, activo: true, orden: i }))
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('barberia');

    const { isConfigured, isDemo, shouldCallApi } = useApiMode(slug);

    useEffect(() => {
        logger.debug('[App] isConfigured:', isConfigured);
        logger.debug('[App] Apps Script URL:', isConfigured ? 'PRESENT' : 'MISSING');
    }, [isConfigured]);

    // Refresh profile data
    const refreshProfile = useCallback(async () => {
        if (!slug) return;

        setProfileLoading(true);
        setProfileError(null);

        try {
            if (shouldCallApi) {
                const data = await sheetsService.getProfile(slug);
                setProfile(data);
            } else {
                // Use demo data
                setProfile({ ...DEMO_PROFILE, Slug: slug });
            }
        } catch (error) {
            setProfileError(error instanceof Error ? error.message : 'Error cargando perfil');
            // Only fallback to demo data if in demo mode
            if (isDemo) {
                setProfile({ ...DEMO_PROFILE, Slug: slug });
            }
        } finally {
            setProfileLoading(false);
        }
    }, [slug, shouldCallApi, isDemo]);

    // Update profile
    const updateProfile = useCallback(async (data: Partial<Profile>) => {
        if (!slug) {
            logger.error('[updateProfile] No slug available');
            throw new Error('No slug available');
        }

        // If profile is null, create a minimal profile with the slug
        const baseProfile = profile || {
            Slug: slug,
            Email: '',
            NombreNegocio: '',
            Telefono: '',
            ValorSena: 0,
            AliasMP: '',
            FotoURL: '',
            ActiveModules: ['appointments', 'card'],
        };

        const updatedProfile = { ...baseProfile, ...data };
        logger.debug('[updateProfile] Saving profile:', updatedProfile);
        setProfile(updatedProfile as Profile);

        if (shouldCallApi) {
            try {
                const result = await sheetsService.saveProfile(updatedProfile as Profile);
                logger.debug('[updateProfile] Save result:', result);
                return result;
            } catch (error) {
                logger.error('[updateProfile] Error saving profile:', error);
                throw error;
            }
        }
        
        return { slug };
    }, [slug, profile, shouldCallApi, isDemo]);

    // Refresh appointments
    const refreshAppointments = useCallback(async (status?: 'Pendiente' | 'Confirmado' | 'Cancelado' | 'all') => {
        if (!slug) return;

        setAppointmentsLoading(true);
        setAppointmentsError(null);

        try {
            if (shouldCallApi) {
                const data = await sheetsService.getAppointments(slug, status);
                setAppointments(data);
            } else {
                // Use demo data, filter by status
                let filtered = DEMO_APPOINTMENTS.filter(a => a.Slug === slug || slug === 'demo');
                if (status && status !== 'all') {
                    filtered = filtered.filter(a => a.Estado === status);
                }
                setAppointments(filtered);
            }
        } catch (error) {
            setAppointmentsError(error instanceof Error ? error.message : 'Error cargando turnos');
            // Only fallback to demo data if in demo mode
            if (isDemo) {
                setAppointments(DEMO_APPOINTMENTS);
            }
        } finally {
            setAppointmentsLoading(false);
        }
    }, [slug, shouldCallApi, isDemo]);

    // Update appointment status
    const updateAppointmentStatusAction = useCallback(async (id: string, status: 'Pendiente' | 'Confirmado' | 'Cancelado') => {
        // Optimistic update
        setAppointments(prev =>
            prev.map(apt => apt.ID === id ? { ...apt, Estado: status } : apt)
        );

        if (currentAppointment?.ID === id) {
            setCurrentAppointment(prev => prev ? { ...prev, Estado: status } : null);
        }

        if (shouldCallApi) {
            try {
                await sheetsService.updateAppointmentStatus(id, status);
            } catch (error) {
                // Revert on error
                logger.error('Error updating status:', error);
                await refreshAppointments();
                throw error;
            }
        }
    }, [shouldCallApi, currentAppointment, refreshAppointments]);

    // Load appointment by ID
    const loadAppointmentById = useCallback(async (id: string): Promise<Appointment | null> => {
        if (shouldCallApi) {
            try {
                const apt = await sheetsService.getAppointmentById(id);
                setCurrentAppointment(apt);
                return apt;
            } catch (error) {
                logger.error('Error loading appointment:', error);
            }
        }

        // Fallback to local list or demo
        const apt = appointments.find(a => a.ID === id) ||
            DEMO_APPOINTMENTS.find(a => a.ID === id) || null;
        setCurrentAppointment(apt);
        return apt;
    }, [shouldCallApi, appointments]);

    // Refresh services from backend
    const refreshServices = useCallback(async () => {
        if (!slug) return;

        try {
            if (shouldCallApi) {
                const data = await sheetsService.getServices(slug);
                if (data.services && data.services.length > 0) {
                    setServices(data.services.map((s, i) => ({
                        ...s,
                        activo: s.activo !== false,
                        orden: s.orden ?? i,
                    })));
                    if (data.categoriaId) {
                        setSelectedCategoryId(data.categoriaId);
                    }
                    logger.debug('[App] Services loaded from backend:', data.services.length);
                } else {
                    logger.debug('[App] No services in backend, using defaults');
                }
            }
        } catch (error) {
            logger.error('[App] Error loading services:', error);
            // Keep default services on error
        }
    }, [slug, shouldCallApi]);

    // Save services to backend
    const saveServicesToBackend = useCallback(async (svcs: Service[], categoryId: string | null) => {
        if (!slug) return;

        if (shouldCallApi) {
            try {
                await sheetsService.saveServices(slug, svcs, categoryId);
                logger.debug('[App] Services saved to backend:', svcs.length);
            } catch (error) {
                logger.error('[App] Error saving services:', error);
                throw error;
            }
        }
    }, [slug, shouldCallApi]);

    // Auto-load profile when slug changes
    useEffect(() => {
        if (slug) {
            refreshProfile();
            refreshAppointments();
            refreshServices();
        }
    }, [slug, refreshProfile, refreshAppointments, refreshServices]);

    // Context value
    const value: AppContextType = React.useMemo(() => ({
        slug,
        profile,
        profileLoading,
        profileError,
        appointments,
        appointmentsLoading,
        appointmentsError,
        currentAppointment,
        services,
        selectedCategoryId,
        setSlug,
        refreshProfile,
        updateProfile,
        refreshAppointments,
        updateAppointmentStatus: updateAppointmentStatusAction,
        setCurrentAppointment,
        loadAppointmentById,
        setServices,
        setSelectedCategoryId,
        refreshServices,
        saveServicesToBackend,
    }), [
        slug, profile, profileLoading, profileError,
        appointments, appointmentsLoading, appointmentsError,
        currentAppointment, services, selectedCategoryId,
        setSlug, refreshProfile, updateProfile,
        refreshAppointments, updateAppointmentStatusAction,
        loadAppointmentById, refreshServices, saveServicesToBackend
    ]);

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

// ============================================
// HOOK
// ============================================
export function useApp(): AppContextType {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

// Convenience hooks
export function useProfile() {
    const { profile, profileLoading, profileError, updateProfile, refreshProfile } = useApp();
    return { profile, loading: profileLoading, error: profileError, updateProfile, refresh: refreshProfile };
}

export function useAppointments() {
    const { appointments, appointmentsLoading, appointmentsError, refreshAppointments, updateAppointmentStatus } = useApp();
    return {
        appointments,
        loading: appointmentsLoading,
        error: appointmentsError,
        refresh: refreshAppointments,
        updateStatus: updateAppointmentStatus,
    };
}

export function useCurrentAppointment() {
    const { currentAppointment, loadAppointmentById, setCurrentAppointment, updateAppointmentStatus } = useApp();
    return {
        appointment: currentAppointment,
        load: loadAppointmentById,
        set: setCurrentAppointment,
        updateStatus: updateAppointmentStatus,
    };
}

export function useServices() {
    const { services, selectedCategoryId, setServices, setSelectedCategoryId, refreshServices, saveServicesToBackend } = useApp();
    return {
        services,
        selectedCategoryId,
        setServices,
        setSelectedCategoryId,
        refreshServices,
        saveServicesToBackend,
        activeServices: services.filter(s => s.activo),
    };
}
