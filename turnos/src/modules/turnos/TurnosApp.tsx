import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { TurnosList } from './TurnosList';

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div className="p-8 min-h-screen bg-gray-50 font-sans">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestor de Turnos</h1>
          <p className="text-gray-500">Administración de reservas y agenda.</p>
        </header>
        <main>
          <TurnosList />
        </main>
      </div>
    ),
  }
]);

export default function TurnosApp() {
  return <RouterProvider router={router} />;
}
