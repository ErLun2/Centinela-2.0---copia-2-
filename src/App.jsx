import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';

// Carga Perezosa (Lazy Loading) - Crucial para estabilidad en celulares
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PasswordChange = lazy(() => import('./pages/PasswordChange'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const MasterDashboard = lazy(() => import('./pages/MasterDashboard'));
const SupportDashboard = lazy(() => import('./pages/SupportDashboard'));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'));
const StaffApp = lazy(() => import('./pages/StaffApp'));

// Loader sencillo para transiciones
const PageLoader = () => (
  <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#020617', color: 'white' }}>
    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(0, 168, 255, 0.2)', borderTopColor: '#00a8ff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    <p style={{ marginTop: '15px', fontSize: '0.7rem', letterSpacing: '2px', opacity: 0.5 }}>CARGANDO CENTINELA...</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ProtectedRoute with resilient redirection
const ProtectedRoute = ({ children, allowedRoles, isSecurityPage = false }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', color: 'white' }}>Iniciando Centinela...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Enforce password change
  if (user.mustChangePassword && !isSecurityPage) {
    return <Navigate to="/password-change" replace />;
  }

  // Prevent back-loop from security page
  if (!user.mustChangePassword && isSecurityPage) {
    const dest = user.rol === 'SUPER_ADMIN' ? '/master' : (user.rol === 'GUARD' ? '/staff' : '/company');
    return <Navigate to={dest} replace />;
  }

  // Role validation
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    if (user.rol === 'SUPER_ADMIN') return <Navigate to="/master" replace />;
    if (user.rol === 'SUPPORT' || user.rol === 'SOPORTE') return <Navigate to="/support" replace />;
    if (user.rol === 'GUARD' || user.rol === 'SUPERVISOR') return <Navigate to="/staff" replace />;

    // Evitar loop infinito si ya estamos en /company o si el rol no coincide con nada
    if (user.rol === 'COMPANY_ADMIN' || user.rol === 'COMPANY_CLIENT' || user.rol === 'OPERADOR') return <Navigate to="/company" replace />;

    return <Navigate to="/login" replace />;
  }

  return children;
};

// Login Access Control
const LoginGuard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', color: 'white' }}>Iniciando Portal...</div>;
  if (user) {
    if (user.mustChangePassword) return <Navigate to="/password-change" replace />;

    if (user.rol === 'SUPER_ADMIN') return <Navigate to="/master" replace />;
    if (user.rol === 'SUPPORT' || user.rol === 'SOPORTE') return <Navigate to="/support" replace />;
    if (['GUARD', 'SUPERVISOR'].includes(user.rol)) return <Navigate to="/staff" replace />;

    if (user.rol === 'COMPANY_ADMIN' || user.rol === 'COMPANY_CLIENT' || user.rol === 'OPERADOR') return <Navigate to="/company" replace />;

    // Si el rol es desconocido/inconsistente, forzar cierre de sesión o ir al inicio
    return children;
  }
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SoundProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginGuard><LoginPage /></LoginGuard>} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/password-change" element={
                <ProtectedRoute isSecurityPage={true}>
                  <PasswordChange />
                </ProtectedRoute>
              } />

              <Route path="/master/*" element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <MasterDashboard />
                </ProtectedRoute>
              } />

              <Route path="/support/*" element={
                <ProtectedRoute allowedRoles={['SUPPORT', 'SOPORTE', 'SUPER_ADMIN']}>
                  <SupportDashboard />
                </ProtectedRoute>
              } />

              <Route path="/company/*" element={
                <ProtectedRoute allowedRoles={['COMPANY_ADMIN', 'COMPANY_CLIENT', 'SUPERVISOR', 'OPERADOR']}>
                  <CompanyDashboard />
                </ProtectedRoute>
              } />

              <Route path="/staff/*" element={
                <ProtectedRoute allowedRoles={['GUARD', 'SUPERVISOR']}>
                  <StaffApp />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </SoundProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
