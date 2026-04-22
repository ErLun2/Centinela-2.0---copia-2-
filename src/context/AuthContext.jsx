import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithPopup, 
  signInAnonymously 
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext();

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SUPPORT: 'SUPPORT',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  OPERADOR: 'OPERADOR',
  SUPERVISOR: 'SUPERVISOR',
  GUARD: 'GUARD',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync Firebase User with Firestore Profile
  const getUserProfile = async (firebaseUser) => {
    if (!firebaseUser || !db) return null;
    try {
      const userRef = doc(db, "usuarios", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.activo === false) {
          await signOut(auth);
          return null;
        }
        return { uid: firebaseUser.uid, ...userData };
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    // Check if there is a session in LocalStorage safely
    try {
      const savedUser = localStorage.getItem('centinela_current_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn("Auth restore error:", e);
      localStorage.removeItem('centinela_current_user');
    }

    // Safe Auth State Listener
    let unsubscribe;
    if (auth?.isMock) {
       setTimeout(() => setLoading(false), 500);
       unsubscribe = () => {};
    } else {
       unsubscribe = firebaseOnAuthStateChanged(auth, async (firebaseUser) => {
         setLoading(true);
         if (firebaseUser) {
           const profile = await getUserProfile(firebaseUser);
           setUser(profile);
         } else {
           setUser(null);
         }
         setLoading(false);
       });
    }

    return () => unsubscribe();
  }, []);

  // Initialize MOCK data if not present
  useEffect(() => {
    if (auth?.isMock) {
      const companies = JSON.parse(localStorage.getItem('centinela_companies') || '[]');
      if (!companies.find(c => c.id === 'demo_001')) {
        const demoCompany = {
          id: 'demo_001',
          name: 'Empresa de Seguridad Demo',
          nombre: 'Empresa de Seguridad Demo',
          titular: 'Admin Demo',
          email: 'admin@empresa.com',
          plan: 'demo',
          status: 'activa',
          lat: -34.6037,
          lng: -58.3816,
          address: 'Av. Corrientes 1234, CABA',
          fecha_alta: new Date().toISOString().split('T')[0],
          expiryDate: '2026-12-31'
        };
        localStorage.setItem('centinela_companies', JSON.stringify([...companies, demoCompany]));
      }

      const users = JSON.parse(localStorage.getItem('centinela_users') || '[]');
      if (!users.find(u => u.email === 'admin@empresa.com')) {
        const demoAdmin = {
          id: 'db_demo_admin',
          nombre: 'Admin',
          apellido: 'Demo',
          email: 'admin@empresa.com',
          password: '123456',
          rol: ROLES.COMPANY_ADMIN,
          empresaId: 'demo_001',
          activo: true
        };
        localStorage.setItem('centinela_users', JSON.stringify([...users, demoAdmin]));
      }
    }
  }, []);

  const login = async (emailInput, password) => {
    const email = emailInput.toLowerCase().trim();

    // 1. INTENTO DE LOGIN REMOTO (EL NUEVO ESTÁNDAR)
    try {
      const { loginRemoto } = await import('../lib/dbServices');
      const result = await loginRemoto(email, password);
      
      if (result && result.success && result.user) {
        const u = result.user;
        let finalRole = (u.role || u.rol || ROLES.GUARD).toUpperCase();
        
        // REGLA DE ORO: El usuario Master ÚNICO es vidal@master.com
        if (email.toLowerCase() === 'vidal@master.com') {
          finalRole = ROLES.SUPER_ADMIN;
        } else {
          // Mapeo normal para el resto
          if (finalRole === 'ADMIN EMPRESA' || finalRole === 'ADMIN_EMPRESA' || finalRole === 'ADMIN') finalRole = ROLES.COMPANY_ADMIN;
          if (finalRole === 'SUPER ADMIN' || finalRole === 'SUPER_ADMIN') finalRole = ROLES.SUPER_ADMIN;
          if (finalRole === 'GUARDIA') finalRole = ROLES.GUARD;
          if (finalRole === 'SOPORTE') finalRole = ROLES.SUPPORT;
        }

        const normalizedUser = {
          ...u,
          rol: finalRole,
          empresaId: u.companyId || u.empresaId,
          nombre: u.name || u.nombre,
          mustChangePassword: u.password === '123456' || u.password === 'password123' || !u.password
        };

        setUser(normalizedUser);
        localStorage.setItem('centinela_current_user', JSON.stringify(normalizedUser));
        return normalizedUser;
      }
    } catch (e) {
      console.warn("Remote Login Failed, trying local/emergency fallback:", e);
    }

    // 2. Fallbacks de Emergencia Hardcodeados (Mantiene operatividad sin Red)
    if (email === 'pablo@stark.com' && password === 'password123') {
       const mockPablo = { uid: 'p_001', nombre: 'Pablo Stark', email: 'pablo@stark.com', rol: ROLES.GUARD, mustChangePassword: true };
       setUser(mockPablo);
       localStorage.setItem('centinela_current_user', JSON.stringify(mockPablo));
       return mockPablo;
    }

    // 3. Mock/Real Hardcoded Users (Emergency Access & SuperAdmin)
    if (email === 'vidal@master.com' || email === 'master') {
      try {
        const { verificarAdmin } = await import('../lib/dbServices');
        const result = await verificarAdmin(password);

        // Si el servidor confirma o si falla la red/tabla pero la clave es la de emergencia
        const isEmergency = (password === '123456' || password === 'admin');
        if (result?.success || (!result && isEmergency)) {
          const mockUser = {
            uid: 'master_001',
            nombre: 'Vidal (Super Admin)',
            email: 'vidal@master.com',
            rol: ROLES.SUPER_ADMIN,
            estado: 'Activo'
          };
          setUser(mockUser);
          localStorage.setItem('centinela_current_user', JSON.stringify(mockUser));
          return mockUser;
        }
      } catch (err) {
        console.error("Auth Emergency Fallback:", err);
        if (password === '123456' || password === 'admin') {
           // Permitir entrada si falla la red pero la clave es correcta
           const mockUser = { uid: 'master_001', nombre: 'Vidal (Super Admin)', email: 'vidal@master.com', rol: ROLES.SUPER_ADMIN, estado: 'Activo' };
           setUser(mockUser);
           localStorage.setItem('centinela_current_user', JSON.stringify(mockUser));
           return mockUser;
        }
      }
    }

    if (password === '123456' || password === 'admin') {
      let mockUser = null;
      if (email === 'soporte@centinela.com' || email === 'soporte') {
        mockUser = {
          uid: 'support_001',
          nombre: 'Centinela Staff (Soporte)',
          email: 'soporte@centinela.com',
          rol: ROLES.SUPPORT,
          estado: 'Activo'
        };
      } else if (email === 'admin@empresa.com' || email === 'admin') {
        mockUser = {
          uid: 'admin_demo',
          nombre: 'Administrador Demo',
          email: 'admin@empresa.com',
          rol: ROLES.COMPANY_ADMIN,
          empresaId: 'demo_001',
          estado: 'Activo',
          mustChangePassword: false 
        };
      }
      if (mockUser) {
        setUser(mockUser);
        localStorage.setItem('centinela_current_user', JSON.stringify(mockUser));
        return mockUser;
      }
    }

    // 3. Firebase Login (Only if not mock)
    if (auth && !auth.isMock) {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const profile = await getUserProfile(result.user);
        if (profile) localStorage.setItem('centinela_current_user', JSON.stringify(profile));
        return profile;
      } catch (error) {
        throw error;
      }
    } else {
      throw new Error("CREDENTIALS_MISMATCH: Verifique su usuario y contraseña.");
    }
  };

  const updatePasswordDemo = async (newPassword) => {
    try {
      if (!user) {
        console.error("[AUTH] No user in state for password update");
        throw new Error("Sesión no válida. Cierre sesión e intente nuevamente.");
      }

      const { apiRequest } = await import('../lib/dbServices');
      
      const payload = {
        userId: user.uid || user.id,
        email: user.email || user.appEmail,
        newPassword: newPassword
      };

      console.log("[AUTH] Syncing password change:", { ...payload, newPassword: '***' });

      // Sincronizar con MySQL via API segura de Render
      const result = await apiRequest('/usuarios/update-password', 'POST', payload);

      if (!result || result.success !== true) {
        throw new Error(result?.error || "El servidor no confirmó el cambio.");
      }

      console.log("[AUTH] Password synchronized with server.");

      // Actualizar estado local solo tras éxito en servidor
      const updatedUser = { ...user, mustChangePassword: false, password: newPassword };
      setUser(updatedUser);
      localStorage.setItem('centinela_current_user', JSON.stringify(updatedUser));

      return true;
    } catch (error) {
      console.error("[AUTH] Update password error:", error.message);
      throw error;
    }
  };

  const logout = async () => {
     setLoading(true);
     try {
       if (!auth.isMock) await signOut(auth);
       setUser(null);
       localStorage.removeItem('centinela_current_user');
     } catch (err) {
       setUser(null);
       localStorage.removeItem('centinela_current_user');
     } finally {
       setLoading(false);
     }
  };

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, 
      updatePasswordDemo,
      loading, ROLES 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
