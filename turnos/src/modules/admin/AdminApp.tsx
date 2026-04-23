import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div style={{ padding: '40px', color: '#D4AF37', background: '#0A0A0A', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h1>AdminApp SPA - Fase 1</h1>
        <p>Entorno de administración centralizado.</p>
      </div>
    ),
  }
]);

export default function AdminApp() {
  return <RouterProvider router={router} />;
}
