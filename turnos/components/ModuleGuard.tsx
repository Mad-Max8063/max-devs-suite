import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface ModuleGuardProps {
    requiredModule: string;
    children: React.ReactNode;
    fallbackRoute?: string;
}

const ModuleGuard: React.FC<ModuleGuardProps> = ({ requiredModule, children, fallbackRoute }) => {
    const { profile, profileLoading, slug: contextSlug, setSlug } = useApp();
    const { slug } = useParams<{ slug: string }>();
    const location = useLocation();
    const routeSlug = slug || (location.pathname.startsWith('/demo') ? 'demo' : null);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        if (routeSlug && routeSlug !== contextSlug) {
            setSlug(routeSlug);
            setIsChecking(true);
        }
    }, [routeSlug, contextSlug, setSlug]);

    useEffect(() => {
        if (!profileLoading && (!routeSlug || routeSlug === contextSlug)) {
            setIsChecking(false);
        }
    }, [profileLoading, routeSlug, contextSlug]);

    if (isChecking || profileLoading || (routeSlug && routeSlug !== contextSlug)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Verificando acceso a {requiredModule}...</p>
            </div>
        );
    }

    const hasModule = profile?.ActiveModules?.includes(requiredModule);

    if (!hasModule) {
        const target = fallbackRoute || (routeSlug ? `/${routeSlug}` : '/demo');
        return <Navigate to={target} replace />;
    }

    return <>{children}</>;
};

export default ModuleGuard;
