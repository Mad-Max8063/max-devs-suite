import React from 'react';

interface UserStatus {
  status: 'free' | 'paid_one_time' | 'subscribed';
  expiration_date: string | null;
}

interface ConversionUIProps {
  user: UserStatus;
  onSelectPlan: () => void;
}

export const SuitoConversionManager: React.FC<ConversionUIProps> = ({ user, onSelectPlan }) => {
  const EXPIRATION_DATE = user.expiration_date ? new Date(user.expiration_date) : null;
  const TODAY = new Date();

  // Cálculo de días
  let diffDays = 0;
  let daysActive = 0;

  if (EXPIRATION_DATE) {
    diffDays = Math.ceil((EXPIRATION_DATE.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
    daysActive = 30 - diffDays;
  }

  const getConversionState = () => {
    if (user.status === 'free') return 'SHOW_PAYMENT_LINK';
    
    if (user.status === 'paid_one_time') {
      // Trigger: Día 7-10 (Fomentar suscripción temprana)
      if (daysActive >= 7 && daysActive < 10) {
        return 'PROMPT_UPGRADE_SUBSCRIPTION';
      }
      
      // Trigger: 3 días antes de expirar (Urgencia)
      if (diffDays <= 3 && diffDays > 0) {
        return 'WARNING_EXPIRATION';
      }
      
      // Trigger: Expirado
      if (diffDays <= 0) {
        return 'RESTRICT_ACCESS_UPSELL';
      }
    }
    
    return 'STANDARD_DASHBOARD';
  };

  const state = getConversionState();

  // RENDER LOGIC
  switch (state) {
    case 'SHOW_PAYMENT_LINK':
      return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 rounded-xl shadow-2xl mb-6 flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">¡Activá tu potencial! 🚀</h3>
            <p className="text-indigo-100">Estás en el plan gratuito. Subí de nivel para desbloquear funciones ilimitadas.</p>
          </div>
          <button 
            onClick={onSelectPlan}
            className="mt-4 md:mt-0 bg-white text-indigo-700 font-bold py-2 px-6 rounded-lg hover:bg-indigo-50 transition-all transform hover:scale-105"
          >
            Ver Planes Premium
          </button>
        </div>
      );

    case 'PROMPT_UPGRADE_SUBSCRIPTION':
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💡</span>
            <p className="text-blue-800 font-medium">
              Che, venís laburando re bien. ¿No te conviene pasarte a <strong>suscripción</strong> y olvidarte de renovar a mano?
            </p>
          </div>
          <button className="text-blue-700 font-bold hover:underline" onClick={onSelectPlan}>
            Mejorar ahora
          </button>
        </div>
      );

    case 'WARNING_EXPIRATION':
      return (
        <div className="bg-orange-500 text-white p-4 mb-6 text-center animate-pulse shadow-lg font-bold">
          ⚠️ ¡Ojo! En {diffDays} {diffDays === 1 ? 'día' : 'días'} se te corta el chorro. 
          Pagá ahora y evitá que tus clientes se queden sin turno.
          <button 
            onClick={onSelectPlan}
            className="ml-4 bg-white text-orange-600 px-4 py-1 rounded shadow hover:bg-gray-100"
          >
            Renovar Plan
          </button>
        </div>
      );

    case 'RESTRICT_ACCESS_UPSELL':
      return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl border-4 border-red-500">
            <span className="text-6xl block mb-4">🛑</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Se terminó la joda</h2>
            <p className="text-gray-600 mb-6">
              Tu plan expiró y el sistema está bloqueado. Ponete al día para que tus clientes puedan seguir sacando turnos.
            </p>
            <button 
              onClick={onSelectPlan}
              className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all transform hover:scale-105 shadow-lg"
            >
              ACTIVAR SUITO PREMIUM 🚀
            </button>
            <p className="mt-4 text-xs text-gray-400">Si acabas de pagar, esperá unos segundos a que se procese.</p>
          </div>
        </div>
      );

    default:
      return null;
  }
};
