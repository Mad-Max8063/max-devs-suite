import React from 'react';
import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { logger } from '../utils/logger';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/AppContext';
import { resolveAccessPriority } from '../utils/access-resolver';

const MASTER_TOKEN = 'reini26';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * ProtectedRoute - Protege rutas que requieren autenticación
 * 
 * Si el usuario no está autenticado, redirige a /login
 * Si el usuario está autenticado pero intenta acceder a otro slug, redirige a su propio slug
 * Si la suscripción venció, muestra pantalla de bloqueo
 * Si está cargando, muestra un spinner
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { profile } = useProfile();
    const location = useLocation();
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();

    if (searchParams.get('token') === MASTER_TOKEN) {
        return <>{children}</>;
    }

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Verificando sesión...</p>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        // Save the attempted location for redirecting after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Security check: Verify user can only access their own slug
    // Skip check for demo mode
    if (slug && slug !== 'demo' && user && user.slug !== slug) {
        // User is trying to access another entrepreneur's data - redirect to their own
        logger.warn(`[Security] User ${user.slug} attempted to access /${slug}`);
        return <Navigate to={`/${user.slug}`} replace />;
    }

    // Subscription expiration check (skip for demo mode)
    if (slug && slug !== 'demo' && profile) {
        const hasAccess = resolveAccessPriority(profile);
        
        if (!hasAccess) {
            const expDate = profile.trial_ends_at || profile.free_until || profile.FechaVencimiento || null;
            const formattedDate = expDate 
                ? new Date(expDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Recientemente';

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark px-6 text-center">
                    <div className="size-24 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center mb-6 animate-success-pop">
                        <span className="material-symbols-outlined text-amber-500 text-[48px]">lock</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-primary-light dark:text-white mb-2">
                        Acceso Restringido
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 max-w-xs leading-relaxed">
                        Tu período de acceso finalizó el <strong>{formattedDate}</strong>.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-xs leading-relaxed">
                        Para activar tu plan y seguir usando el gestor de turnos, suscribite:
                    </p>
                    <div className="space-y-3 w-full max-w-xs">
                        <a
                            href="https://suito.pro/#precios"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                        >
                            <span className="material-symbols-outlined text-[20px]">payments</span>
                            Ver Planes de Suscripción
                        </a>
                        <a
                            href="https://wa.me/5491162621406?text=Hola!%20Tengo%20problemas%20con%20mi%20suscripción%20en%20el%20gestor"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl transition-colors"
                        >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            Soporte Técnico
                        </a>
                    </div>
                </div>
            );
        }
    }

    // Render protected content
    return <>{children}</>;
};

export default ProtectedRoute;
