import React from 'react';
import { Link } from 'react-router-dom';

interface DemoBannerProps {
    slug: string;
}

/**
 * Banner visible only in demo mode to encourage registration
 */
const DemoBanner: React.FC<DemoBannerProps> = ({ slug }) => {
    if (slug !== 'demo') return null;

    return (
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white text-center py-2.5 px-4 text-sm flex items-center justify-center gap-2 shadow-md">
            <span className="material-symbols-outlined text-[18px]">science</span>
            <span>Estás en <strong>modo DEMO</strong></span>
            <span className="hidden sm:inline">•</span>
            <Link
                to="/register"
                className="underline font-bold hover:text-white/90 transition-colors"
            >
                Creá tu cuenta gratis →
            </Link>
        </div>
    );
};

export default DemoBanner;
