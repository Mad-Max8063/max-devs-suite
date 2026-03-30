import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useProfile } from '../context/AppContext';

interface ModuleGuardProps {
    requiredModule: string;
    children: React.ReactNode;
    fallbackRoute?: string;
}

/**
 * ModuleGuard - Protege rutas asegurando que un módulo específico esté activo en el profile.
 * 
 * Si profile aún está cargando, muestra spinner.
 * Si el perfil no tiene el módulo, redirige a una ruta de escape (por defecto el dashboard).
 */
const ModuleGuard: React.FC<ModuleGuardProps> = ({ requiredModule, children, fallbackRoute }) => {
    const { profile, loading } = useProfile();
    const { slug } = useParams<{ slug: string }>();
    const [isChecking, setIsChecking] = useState(true);
    
    useEffect(() => {
        // Solo dejamos de mostrar 'Cargando...' si el profile ya terminó de cargar
        if (!loading) {
            setIsChecking(false);
        }
    }, [loading]);

    if (isChecking || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Verificando acceso a {requiredModule}...</p>
            </div>
        );
    }

    // Buscamos si el módulo existe en el profile
    // En modo demo, podemos asumir que tienen todo, pero vamos a respetar los módulos que vengan.
    const hasModule = profile?.ActiveModules?.includes(requiredModule);

    if (!hasModule) {
        // Si no tiene el módulo, redirige al fallback, al dashboard del usuario, o a demo.
        const target = fallbackRoute || (slug ? `/${slug}` : '/demo');
        return <Navigate to={target} replace />;
    }

    return <>{children}</>;
};

export default ModuleGuard;
