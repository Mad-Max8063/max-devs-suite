import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../context/AppContext';

interface BottomNavigationProps {
    slug: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ slug }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useProfile();
    const activeModules = profile?.ActiveModules || ['card'];
    const hasAppointments = activeModules.includes('appointments');
    const hasCard = activeModules.includes('card');

    const isActive = (path: string) => {
        if (path === `/${slug}`) {
            return location.pathname === `/${slug}` || location.pathname === `/${slug}/`;
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-6 left-6 right-6 z-[100] mx-auto w-full max-w-[calc(448px-3rem)] lg:hidden">
            <div className="glass-card ambient-shadow rounded-3xl p-2 px-4 flex items-center justify-between border-white/40">
                <button
                    onClick={() => navigate(`/${slug}`)}
                    className={`flex flex-col items-center gap-1 p-2 flex-1 transition-all duration-300 ${isActive(`/${slug}`) && !isActive(`/${slug}/agenda`) && !isActive(`/${slug}/config`) && !isActive(`/${slug}/identidad`) ? 'text-primary scale-110' : 'text-on-surface-variant opacity-40'}`}
                >
                    <span className={`material-symbols-outlined text-[24px] ${isActive(`/${slug}`) && !isActive(`/${slug}/agenda`) && !isActive(`/${slug}/config`) && !isActive(`/${slug}/identidad`) ? 'fill' : ''}`}>home</span>
                    <span className="text-[9px] font-black uppercase tracking-tighter">Panel</span>
                </button>
                
                {hasCard && (
                    <button
                        onClick={() => navigate(`/${slug}/identidad`)}
                        className={`flex flex-col items-center gap-1 p-2 flex-1 transition-all duration-300 ${isActive(`/${slug}/identidad`) ? 'text-primary scale-110' : 'text-on-surface-variant opacity-40'}`}
                    >
                        <span className={`material-symbols-outlined text-[24px] ${isActive(`/${slug}/identidad`) ? 'fill' : ''}`}>style</span>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Diseño</span>
                    </button>
                )}
                
                {hasAppointments && (
                    <button
                        onClick={() => navigate(`/${slug}/agenda`)}
                        className={`flex flex-col items-center gap-1 p-2 flex-1 transition-all duration-300 ${isActive(`/${slug}/agenda`) ? 'text-primary scale-110' : 'text-on-surface-variant opacity-40'}`}
                    >
                        <span className={`material-symbols-outlined text-[24px] ${isActive(`/${slug}/agenda`) ? 'fill' : ''}`}>calendar_today</span>
                        <span className="text-[9px] font-black uppercase tracking-tighter">Agenda</span>
                    </button>
                )}
                
                <button
                    onClick={() => navigate(`/${slug}/config`)}
                    className={`flex flex-col items-center gap-1 p-2 flex-1 transition-all duration-300 ${isActive(`/${slug}/config`) ? 'text-primary scale-110' : 'text-on-surface-variant opacity-40'}`}
                >
                    <span className={`material-symbols-outlined text-[24px] ${isActive(`/${slug}/config`) ? 'fill' : ''}`}>settings_suggest</span>
                    <span className="text-[9px] font-black uppercase tracking-tighter">Ajustes</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNavigation;
