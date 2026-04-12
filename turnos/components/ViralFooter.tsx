import React from 'react';
import { useProfile } from '../context/AppContext';

const ViralFooter: React.FC = () => {
  const { profile } = useProfile();

  // Si es premium, no renderizamos el componente
  if (profile?.IsPremium) {
    return null;
  }

  return (
    <div className="mt-8 pb-32 text-center px-4 w-full">
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 p-4 rounded-xl flex flex-col items-center gap-2">
        <span className="text-secondary text-sm font-semibold">⚡ Powered by Suito</span>
        <p className="text-xs text-gray-500 dark:text-gray-400">¿Querés un gestor así para tu negocio?</p>
        <a 
          href="https://suito.pro" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-bold text-primary hover:text-primary-hover underline mt-1"
        >
          Creá el tuyo gratis acá
        </a>
      </div>
    </div>
  );
};

export default ViralFooter;
