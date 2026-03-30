import React from 'react';
import { Link } from 'react-router-dom';

interface DemoSaveModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal shown when user tries to save in demo mode
 */
const DemoSaveModal: React.FC<DemoSaveModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-scale-in">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-[32px]">science</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-center mb-2 text-text-primary-light dark:text-white">
                    ¡Estás en Modo Demo!
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
                    Los cambios no se guardarán porque estás probando la app.
                    <strong className="text-primary"> Creá tu cuenta gratis</strong> para guardar tu configuración real.
                </p>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    <Link
                        to="/register"
                        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl text-center shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[20px]">person_add</span>
                        Crear mi cuenta
                    </Link>
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-6 rounded-xl font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        Seguir probando
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DemoSaveModal;
