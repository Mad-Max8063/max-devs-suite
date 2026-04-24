import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from '../../../context/AppContext';
import { AuthProvider } from '../../../context/AuthContext';
import ErrorBoundary from '../../../components/ErrorBoundary';
import ProtectedRoute from '../../../components/ProtectedRoute';
import WelcomePage from '../../../pages/WelcomePage';
import BusinessConfigPage from '../../../pages/BusinessConfigPage';
import ScheduleConfigPage from '../../../pages/ScheduleConfigPage';
import AgendaPage from '../../../pages/AgendaPage';
import AppointmentDetailPage from '../../../pages/AppointmentDetailPage';
import BookingPage from '../../../pages/BookingPage';
import ConfirmationPage from '../../../pages/ConfirmationPage';
import LoginPage from '../../../pages/LoginPage';
import RegisterPage from '../../../pages/RegisterPage';
import VirtualCardConfigPage from '../../../pages/VirtualCardConfigPage';
import ModuleGuard from '../../../components/ModuleGuard';
import { useTheme } from '../../../hooks/useTheme';

/**
 * Componente para forzar el slug "demo" en rutas de demostración
 */
const DemoRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { setSlug } = useApp();
  React.useEffect(() => {
    setSlug('demo');
  }, [setSlug]);
  return element;
};

/**
 * Applies the business's custom theme color globally
 */
const ThemeApplier: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useTheme();
  return <>{children}</>;
};

export default function TurnosApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <ThemeApplier>
            <HashRouter>
              <div className="min-h-screen w-full max-w-md mx-auto bg-surface dark:bg-background-dark overflow-hidden relative">
                <Routes>
                  {/* Auth Routes - Public */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Default redirect to demo */}
                  <Route path="/" element={<Navigate to="/demo" replace />} />

                  {/* Demo Mode Routes - Public (no auth required for demo) */}
                  <Route path="/demo" element={<DemoRoute element={<WelcomePage />} />} />
                  <Route path="/demo/config" element={<DemoRoute element={<BusinessConfigPage />} />} />
                  <Route path="/demo/schedule" element={<DemoRoute element={<ModuleGuard requiredModule="appointments"><ScheduleConfigPage /></ModuleGuard>} />} />
                  <Route path="/demo/identidad" element={<DemoRoute element={<VirtualCardConfigPage />} />} />
                  <Route path="/demo/agenda" element={<DemoRoute element={<ModuleGuard requiredModule="appointments"><AgendaPage /></ModuleGuard>} />} />
                  <Route path="/demo/detail/:id" element={<DemoRoute element={<ModuleGuard requiredModule="appointments"><AppointmentDetailPage /></ModuleGuard>} />} />
                  <Route path="/demo/booking" element={<DemoRoute element={<ModuleGuard requiredModule="appointments"><BookingPage /></ModuleGuard>} />} />
                  <Route path="/demo/confirmation" element={<DemoRoute element={<ModuleGuard requiredModule="appointments"><ConfirmationPage /></ModuleGuard>} />} />
                  <Route path="/demo/confirmation/:id" element={<DemoRoute element={<ModuleGuard requiredModule="appointments"><ConfirmationPage /></ModuleGuard>} />} />

                  {/* Entrepreneur (Admin) Routes - Protected */}
                  <Route path="/:slug" element={
                    <ProtectedRoute>
                      <WelcomePage />
                    </ProtectedRoute>
                  } />
                  <Route path="/:slug/config" element={
                    <ProtectedRoute>
                      <BusinessConfigPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/:slug/identidad" element={
                    <ProtectedRoute>
                      <VirtualCardConfigPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/:slug/schedule" element={
                    <ProtectedRoute>
                      <ModuleGuard requiredModule="appointments">
                        <ScheduleConfigPage />
                      </ModuleGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/:slug/agenda" element={
                    <ProtectedRoute>
                      <ModuleGuard requiredModule="appointments">
                        <AgendaPage />
                      </ModuleGuard>
                    </ProtectedRoute>
                  } />
                  <Route path="/:slug/detail/:id" element={
                    <ProtectedRoute>
                      <ModuleGuard requiredModule="appointments">
                        <AppointmentDetailPage />
                      </ModuleGuard>
                    </ProtectedRoute>
                  } />

                  {/* Client Routes - Public */}
                  <Route path="/:slug/booking" element={
                    <ModuleGuard requiredModule="appointments">
                      <BookingPage />
                    </ModuleGuard>
                  } />
                  <Route path="/:slug/confirmation" element={
                    <ModuleGuard requiredModule="appointments">
                      <ConfirmationPage />
                    </ModuleGuard>
                  } />
                  <Route path="/:slug/confirmation/:id" element={
                    <ModuleGuard requiredModule="appointments">
                      <ConfirmationPage />
                    </ModuleGuard>
                  } />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/demo" replace />} />
                </Routes>
              </div>
            </HashRouter>
          </ThemeApplier>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
