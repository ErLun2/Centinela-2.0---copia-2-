import React, { Suspense, lazy, Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './context/AuthContext';
import { SoundProvider } from './context/SoundContext';

// Importación estática por seguridad (Pantallas críticas)
import PasswordChange from './pages/PasswordChange';

// Carga Perezosa (Lazy Loading) - Para dashboards pesados
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const MasterDashboard = lazy(() => import('./pages/MasterDashboard'));
const SupportDashboard = lazy(() => import('./pages/SupportDashboard'));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'));
const StaffApp = lazy(() => import('./pages/StaffApp'));

// Muro de Seguridad (Error Boundary)
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorDetail: '' };
  }
  static getDerivedStateFromError(error) { 
    return { hasError: true, errorDetail: error.message }; 
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#020617', color: 'white', padding: '20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#ef4444' }}>⚠️ ERROR CRÍTICO</h2>
          <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '10px' }}>Hubo un problema técnico al inicializar este componente.</p>
          <code style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.7rem', color: '#ef4444', marginBottom: '20px', display: 'block', maxWidth: '90%' }}>
            {this.state.errorDetail}
          </code>
          <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#00a8ff', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold' }}>REINTENTAR</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    const dest = 
      [ROLES.SUPER_ADMIN, 'SUPERADMIN'].includes(user.rol) ? '/master' : 
      ([ROLES.GUARD, 'GUARDIA', ROLES.SUPERVISOR].includes(user.rol) ? '/staff' : '/company');
    return <Navigate to={dest} replace />;
  }

  // Role validation
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    if ([ROLES.SUPER_ADMIN, 'SUPERADMIN'].includes(user.rol)) return <Navigate to="/master" replace />;
    if ([ROLES.SUPPORT, 'SOPORTE', 'ADMIN_SOPORTE'].includes(user.rol)) return <Navigate to="/support" replace />;
    if ([ROLES.GUARD, 'GUARDIA', ROLES.SUPERVISOR].includes(user.rol)) return <Navigate to="/staff" replace />;

    // Forzamos que OPERADOR y ADMIN de empresa caigan aquí
    if ([ROLES.OPERADOR, ROLES.COMPANY_ADMIN, 'ADMIN', 'COMPANY_CLIENT'].includes(user.rol)) return <Navigate to="/company" replace />;

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

    if ([ROLES.SUPER_ADMIN, 'SUPERADMIN'].includes(user.rol)) return <Navigate to="/master" replace />;
    if ([ROLES.SUPPORT, 'SOPORTE', 'ADMIN_SOPORTE'].includes(user.rol)) return <Navigate to="/support" replace />;
    if ([ROLES.GUARD, 'GUARDIA', ROLES.SUPERVISOR].includes(user.rol)) return <Navigate to="/staff" replace />;

    if ([ROLES.OPERADOR, ROLES.COMPANY_ADMIN, 'ADMIN', 'COMPANY_CLIENT'].includes(user.rol)) return <Navigate to="/company" replace />;

    // Si el rol es desconocido/inconsistente, forzar cierre de sesión o ir al inicio
    return children;
  }
  return children;
};

function App() {
  return (
    <ErrorBoundary>
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
                  <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                    <MasterDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/support/*" element={
                  <ProtectedRoute allowedRoles={[ROLES.SUPPORT, 'SOPORTE', ROLES.SUPER_ADMIN]}>
                    <SupportDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/company/*" element={
                  <ProtectedRoute allowedRoles={[ROLES.OPERADOR, ROLES.COMPANY_ADMIN, 'ADMIN', ROLES.SUPER_ADMIN]}>
                    <CompanyDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/staff/*" element={
                  <ProtectedRoute allowedRoles={[ROLES.GUARD, 'GUARDIA', ROLES.SUPERVISOR]}>
                    <StaffApp />
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </SoundProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
