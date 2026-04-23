import React from 'react';
import { useTurnos } from '../../../hooks/useTurnos';
import { useTenant } from '../../../context/TenantContext';

export const TurnosList: React.FC = () => {
  const { isInvalid } = useTenant();
  const { data: turnos, isLoading, isError, error } = useTurnos();

  if (isInvalid) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-gray-500 bg-gray-50 rounded-xl">
        <p>Espacio de trabajo no identificado.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        <h3 className="font-bold">Error de sincronización</h3>
        <p className="text-sm">{error instanceof Error ? error.message : 'Error desconocido'}</p>
      </div>
    );
  }

  if (!turnos || turnos.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-400">
        No hay turnos registrados para este tenant.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {turnos.map((turno: any) => (
        <div 
          key={turno.id} 
          className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl hover:border-blue-300 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-gray-900">{turno.client_name}</p>
              <p className="text-sm text-gray-500">
                {new Date(turno.scheduled_at).toLocaleString()}
              </p>
            </div>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
              Confirmado
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
