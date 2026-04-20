import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import PasswordChange from './pages/PasswordChange';
import ResetPassword from './pages/ResetPassword';
import MasterDashboard from './pages/MasterDashboard';
import SupportDashboard from './pages/SupportDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import StaffApp from './pages/StaffApp';

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
        </SoundProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
