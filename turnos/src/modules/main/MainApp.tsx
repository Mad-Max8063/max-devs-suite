import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div style={{ padding: '40px', color: '#D4AF37', background: '#0A0A0A', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        <h1>MainApp SPA - Fase 1</h1>
        <p>Landing page y portal público de Suito.</p>
      </div>
    ),
  }
]);

export default function MainApp() {
  return <RouterProvider router={router} />;
}
