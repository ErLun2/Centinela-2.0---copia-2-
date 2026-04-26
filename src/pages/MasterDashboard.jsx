import React, { useState, useEffect } from 'react';
import {
  History, Users, Building2, ShieldAlert, BarChart, Settings, LogOut,
  Menu, X, Bell, Search, Plus, Loader2, CheckCircle2, CreditCard,
  AlertTriangle, Power, PowerOff, Settings2, Globe, MapPin,
  TrendingUp, DollarSign, Activity, HelpCircle, User, Shield, Zap, Package, Trash2,
  BadgeCheck, Eye, EyeOff, Download, Headphones, KeyRound, Wifi
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PLANES } from '../lib/planes';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as db from '../lib/dbServices';
import { Fingerprint } from 'lucide-react';

// Fix for default Leaflet icons - Using more reliable CDN
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});



const MasterDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('Estadísticas');
  const [selectedPlanId, setSelectedPlanId] = useState(null); // Para la vista de Licencias
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalData, setProposalData] = useState({
    companyName: '', email: '', planId: 'profesional', guards: '', panicUsers: '', message: ''
  });
  const [companies, setCompanies] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [facturacionSubTab, setFacturacionSubTab] = useState('config');
  const [configSubTab, setConfigSubTab] = useState('global');
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [sysConfig, setSysConfig] = useState({
    version: '1.0.0', mantenimiento: false, mensaje_global: ''
  });
  const [events, setEvents] = useState([]);
  const [statsFilter, setStatsFilter] = useState('all');
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [trashItems, setTrashItems] = useState([]);

  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', companyId: '', role: 'Admin Empresa'
  });
  const [editingUser, setEditingUser] = useState(null);

  const [newCompany, setNewCompany] = useState({
    name: '', titular: '', dni: '', email: '', appEmail: '', telefono: '', address: '', plan: 'basico', guards: 0, status: 'activa', expiryDate: '', fecha_alta: new Date().toISOString().split('T')[0]
  });
  const [editingCompany, setEditingCompany] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);



  const [newPayment, setNewPayment] = useState({
    companyId: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'Completado'
  });

  const [showSupportUserModal, setShowSupportUserModal] = useState(false);
  const [newSupportUser, setNewSupportUser] = useState({
    nombre: '', apellido: '', dni: '', legajo: '', telefono: '', email: '',
    emailPersonal: '', telefonoPersonal: ''
  });
  const [showSupportPassword, setShowSupportPassword] = useState(false);
  const [isCreatingSupportUser, setIsCreatingSupportUser] = useState(false);
  const [editingSupportUser, setEditingSupportUser] = useState(null);

  // Estados para Gestión de Planes
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanData, setEditingPlanData] = useState(null);
  const [localPlanes, setLocalPlanes] = useState(PLANES);
  
  // Estados de Diagnóstico Técnico
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);
  const [diagnosticSummary, setDiagnosticSummary] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { logout, user } = useAuth();

  const loadData = () => {
    // REGLA DE ORO: Sincronización Real en lugar de LocalStorage
    const unsubCompanies = db.subscribeToCompanies((data) => {
      setCompanies(data);
    });

    const unsubUsers = db.subscribeToAllUsers((data) => {
      setUsers(data);
    });

    const unsubEvents = db.subscribeToAllEventsGroup((data) => {
      setEvents(data);
    });

    const unsubTickets = db.subscribeToTickets((data) => {
      setTickets(data);
    });

    const unsubPayments = db.subscribeToAllPayments((data) => {
      setPayments(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    });

    // Carga inicial de configuración (un solo hit)
    db.obtenerConfiguracionPagos().then(cfg => {
       if (cfg) setSysConfig(prev => ({...prev, ...cfg}));
    });

    return () => {
      unsubCompanies();
      unsubUsers();
      unsubEvents();
      unsubTickets();
      unsubPayments();
    };
  };


  useEffect(() => {
    const unsub = loadData();

    // Carga inicial de planes desde la API con Sincronización Automática
    db.obtenerPlanes().then(async (data) => {
      try {
        // REGLA DE ORO: Si el servidor no tiene los planes básicos, los sincronizamos ahora mismo
        const defaultPlanesList = Object.values(PLANES);
        
        if (!data || data.length === 0) {
           console.log("🚀 Sincronizando planes base con el servidor...");
           for (const plan of defaultPlanesList) {
              await db.guardarPlan({
                ...plan,
                beneficios: JSON.stringify(plan.beneficios || [])
              });
           }
           // Re-cargar después de sincronizar
           const updatedData = await db.obtenerPlanes();
           data = updatedData;
        }

        if (data && Array.isArray(data) && data.length > 0) {
          const planesMap = {};
          data.forEach(p => { 
            if (p && p.id) {
              planesMap[String(p.id).toUpperCase()] = p; 
            }
          });
          if (Object.keys(planesMap).length > 0) {
            setLocalPlanes(planesMap);
            // Actualizar la referencia global si es necesario
          }
        }
      } catch (err) {
        console.error("Error sincronizando planes API:", err);
      }
    }).catch(err => console.error("Error obteniendo planes:", err));

    // Migración de datos: asegurar que todas las empresas tengan una lat/lng estable
    const comps = JSON.parse(localStorage.getItem('centinela_companies') || '[]');
    let changed = false;
    const migrated = comps.map(c => {
      if (isNaN(parseFloat(c.lat)) || isNaN(parseFloat(c.lng))) {
        c.lat = -34.6037 + (Math.random() - 0.5) * 0.1;
        c.lng = -58.3816 + (Math.random() - 0.5) * 0.1;
        changed = true;
      }
      return c;
    });
    if (changed) {
      localStorage.setItem('centinela_companies', JSON.stringify(migrated));
      setCompanies(migrated);
    }

    return () => unsub && unsub();
  }, []);



    // REAL-TIME SUBSCRIPTIONS (Blindadas)

  const geocodeAddress = async (address) => {
    if (!address) return null;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { lat, lng: lon };
        }
      }
    } catch (e) {
      console.error("Geocoding error:", e);
    }
    return null;
  };

  const handleCreateSupportUser = async (e) => {
    e.preventDefault();
    if (!newSupportUser.nombre || !newSupportUser.apellido || !newSupportUser.email) {
      alert("Nombre, Apellido y Email son obligatorios");
      return;
    }

    setIsCreatingSupportUser(true);
    try {
      const userData = {
        ...newSupportUser,
        name: `${newSupportUser.nombre} ${newSupportUser.apellido}`,
        surname: newSupportUser.apellido,
        role: 'SUPPORT',
        rol: 'SUPPORT',
        password: 'soporte123',
        mustChangePassword: true,
        fechaAlta: new Date().toISOString(),
        status: 'ACTIVO',
        estado: 'ACTIVO'
      };
      
      await db.crearUsuarioSaaS(userData, "SOPORTE_CENTRAL");
      setShowSupportUserModal(false);
      setNewSupportUser({ nombre: '', apellido: '', dni: '', legajo: '', telefono: '', email: '', emailPersonal: '', telefonoPersonal: '' });
      alert("Usuario de Soporte creado con éxito");
    } catch (error) {
      console.error("Error al crear usuario de soporte:", error);
      alert("Error al crear el usuario: " + error.message);
    } finally {
      setIsCreatingSupportUser(false);
    }
  };

  const handleDeleteSupportUser = (userId) => {
    const userToMove = users.find(u => u.id === userId || u.uid === userId);
    if (!userToMove) return;
    if (!window.confirm(`¿Mover a ${userToMove.name || userToMove.nombre} a la papelera?`)) return;

    const allTrash = JSON.parse(localStorage.getItem('centinela_trash') || '[]');
    const trashItem = { ...userToMove, deletedAt: new Date().toISOString(), originalType: 'user' };
    localStorage.setItem('centinela_trash', JSON.stringify([...allTrash, trashItem]));

    const filtered = users.filter(u => u.id !== userId && u.uid !== userId);
    setUsers(filtered);
    localStorage.setItem('centinela_users', JSON.stringify(filtered));
    setEditingSupportUser(null);
    setShowSupportUserModal(false);
    alert("✅ Usuario de soporte movido a la papelera.");
  };

  const handleUpdateSupportUser = async (e) => {
    e.preventDefault();
    if (!editingSupportUser) return;
    
    setIsCreatingSupportUser(true);
    try {
      const updatedData = {
        ...editingSupportUser,
        name: `${editingSupportUser.nombre || editingSupportUser.name} ${editingSupportUser.apellido || editingSupportUser.surname}`,
        role: editingSupportUser.role || editingSupportUser.rol,
        status: editingSupportUser.status || editingSupportUser.estado
      };
      
      const allUsers = JSON.parse(localStorage.getItem('centinela_users') || '[]');
      const updatedUsers = allUsers.map(u => (u.id === editingSupportUser.id || u.uid === editingSupportUser.uid) ? updatedData : u);
      
      localStorage.setItem('centinela_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      setShowSupportUserModal(false);
      setEditingSupportUser(null);
      alert("✅ Usuario de soporte actualizado correctamente.");
    } catch (error) {
       alert("Error al actualizar: " + error.message);
    } finally {
       setIsCreatingSupportUser(false);
    }
  };

  const handleResetSupportPassword = (userId) => {
    if (!window.confirm("¿Blanquear contraseña? Se restablecerá a 'soporte123' y se obligará al cambio en el próximo ingreso.")) return;

    const allUsers = JSON.parse(localStorage.getItem('centinela_users') || '[]');
    const updatedUsers = allUsers.map(u => {
      if (u.id === userId || u.uid === userId) {
        return { ...u, password: 'soporte123', mustChangePassword: true };
      }
      return u;
    });

    localStorage.setItem('centinela_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    
    // Si estamos editando uno, actualizar el estado local de edición también
    if (editingSupportUser && (editingSupportUser.id === userId || editingSupportUser.uid === userId)) {
        setEditingSupportUser({ ...editingSupportUser, password: 'soporte123', mustChangePassword: true });
    }
    
    alert("✅ Contraseña blanqueada con éxito.");
  };

  const handleRunDiagnostic = async (ticket) => {
    if (!ticket) return;
    setIsRunningDiagnostic(true);
    try {
      const userId = ticket.usuarioId || 'admin_demo';
      const [uDiag, dDiag, gDiag, logs, summary] = await Promise.all([
        db.obtenerDiagnosticoUsuario(userId),
        db.obtenerDiagnosticoDispositivo(userId),
        db.obtenerDiagnosticoGPS(userId),
        db.obtenerLogsSistema(ticket.id),
        db.ejecutarDiagnosticoAutomatico(userId, ticket)
      ]);
      
      setDiagnosticData({ user: uDiag, device: dDiag, gps: gDiag });
      setDiagnosticLogs(logs);
      setDiagnosticSummary(summary);
    } catch (error) {
       console.error("Dialgnostic failed:", error);
    } finally {
       setIsRunningDiagnostic(false);
    }
  };

  const handleExecuteAction = async (actionId, label) => {
    if (!selectedTicket) return;
    if (!window.confirm(`¿Estás seguro de ejecutar: '${label}'?`)) return;

    setIsActionLoading(true);
    try {
        const userId = selectedTicket.usuarioId || 'admin_demo';
        const result = await db.ejecutarAccionSoporte(actionId, userId, selectedTicket.id);
        
        if (result.success) {
            alert(`✅ Éxito: ${result.message}`);
            // Recargar el ticket para ver el log en la conversación
            const allTickets = JSON.parse(localStorage.getItem('centinela_tickets') || '[]');
            const updated = allTickets.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
        } else {
            alert(`❌ Error: ${result.message}`);
        }
    } catch (error) {
        alert("Falla crítica al ejecutar la acción.");
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleSupportNameChange = (field, value) => {
    const updated = { ...newSupportUser, [field]: value };
    // Auto-generate email draft if name/surname changes and email hasn't been manually edited much
    if (field === 'nombre' || field === 'apellido') {
      const cleanName = updated.nombre.toLowerCase().trim().replace(/\s+/g, '');
      const cleanApe = updated.apellido.toLowerCase().trim().replace(/\s+/g, '');
      if (cleanName || cleanApe) {
        updated.email = `${cleanName}${cleanApe ? '.' + cleanApe : ''}@soporte.com`;
      }
    }
    setNewSupportUser(updated);
  };

  const handleCreateOrUpdateCompany = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
        let coords = { lat: -34.6037, lng: -58.3816 };
        if (newCompany.address) {
            coords = await geocodeAddress(newCompany.address) || coords;
        }

        const finalId = editingCompany ? editingCompany.id : Date.now().toString();
        
        // REGLA DE ORO: Si no hay fecha de vencimiento, asignamos 30 días por defecto
        let finalExpiry = newCompany.expiryDate;
        if (!finalExpiry) {
           const d = new Date();
           d.setMonth(d.getMonth() + 1);
           finalExpiry = d.toISOString().split('T')[0];
        }

        const finalCompanyData = {
            ...newCompany,
            id: finalId,
            expiryDate: finalExpiry,
            lat: coords.lat,
            lng: coords.lng
        };

        // REGLA DE ORO: Guardar en el servidor (esto sincroniza PC y Celular)
        await db.crearEmpresa(finalId, finalCompanyData);

        if (!editingCompany) {
            // Crear usuario admin por defecto en el servidor también
            await db.crearUsuarioSaaS({
                name: `Admin ${finalCompanyData.name}`,
                email: newCompany.appEmail || newCompany.email,
                role: 'Admin Empresa',
                status: 'activo',
                password: 'password123'
            }, finalId);
            alert("✅ Empresa y Usuario Admin creados en el servidor. Acceso con 'password123'.");
        } else {
            alert("✅ Datos actualizados en el servidor.");
        }

        setShowModal(false);
        setEditingCompany(null);
        setNewCompany({ name: '', titular: '', dni: '', email: '', telefono: '', address: '', plan: 'basico', guards: 0, status: 'activa', expiryDate: '', fecha_alta: new Date().toISOString().split('T')[0] });
    } catch (err) {
        alert("Error al sincronizar con el servidor: " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const planToSave = { ...editingPlanData };
      if (!planToSave.id) {
        planToSave.id = planToSave.nombre.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);
      }

      // Guardar en MySQL a través de la API
      await db.guardarPlan(planToSave);

      // Actualizar estado local
      const key = planToSave.id.toUpperCase();
      const newPlanes = { ...localPlanes, [key]: planToSave };
      
      Object.assign(PLANES, newPlanes);
      setLocalPlanes({ ...newPlanes });
      
      setShowPlanModal(false);
      setEditingPlanData(null);
      alert("✅ Plan guardado correctamente en la base de datos.");
    } catch (error) {
      alert("Error al guardar el plan: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm(`¿Estás seguro de eliminar el plan "${planId}"? Esta acción no se puede deshacer.`)) return;
    
    try {
      await db.eliminarPlan(planId);
      const key = planId.toUpperCase();
      const { [key]: _, ...newPlanes } = localPlanes;
      
      Object.keys(PLANES).forEach(k => delete PLANES[k]);
      Object.assign(PLANES, newPlanes);
      setLocalPlanes({ ...newPlanes });
      alert("Plan eliminado correctamente.");
    } catch (error) {
       alert("Error al eliminar el plan.");
    }
  };

  const updateCompanyStatus = (id, newStatus) => {
    const updated = companies.map(c => c.id === id ? { ...c, status: newStatus } : c);
    setCompanies(updated);
    localStorage.setItem('centinela_companies', JSON.stringify(updated));
  };

  const handleRegisterPayment = (e) => {
    e.preventDefault();

    setIsSaving(true);
    setTimeout(() => {
      const company = companies.find(c => c.id === newPayment.companyId);
      const paymentToAdd = {
        ...newPayment,
        id: Date.now().toString(),
        companyName: company?.name || 'Desconocida',
        plan: company?.plan || 'N/A'
      };
      const updated = [paymentToAdd, ...payments];
      localStorage.setItem('centinela_pagos', JSON.stringify(updated));
      setPayments(updated);
      setShowPaymentModal(false);
      setIsSaving(false);
      setNewPayment({ companyId: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'Completado' });
    }, 800);
  };

  const cycleCompanyStatus = (id) => {
    const statuses = ['activa', 'suspendida', 'cancelada', 'prueba'];
    const updated = companies.map(c => {
      if (c.id === id) {
        const currentIndex = statuses.indexOf(c.status);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
        return { ...c, status: nextStatus };
      }
      return c;
    });
    setCompanies(updated);
    localStorage.setItem('centinela_companies', JSON.stringify(updated));
  };

  const handleDeleteUser = async (id) => {
    const userToMove = users.find(u => u.id === id);
    if (!userToMove) return;
    if (!window.confirm(`¿Seguro que desea eliminar a ${userToMove.name || userToMove.nombre} DEFINITIVAMENTE del servidor?`)) return;

    try {
        await db.eliminarUsuario(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        alert("✅ Usuario eliminado permanentemente del servidor.");
    } catch (err) {
        alert("Error al eliminar del servidor: " + err.message);
    }
  };

  const handleSoftDeleteCompany = async (compId) => {
    const compToMove = companies.find(c => c.id === compId);
    if (!compToMove) return;
    if (!window.confirm(`¿Está seguro de eliminar definitivamente la empresa "${compToMove.name}" y TODOS sus usuarios vinculados del servidor?`)) return;

    try {
        await db.eliminarEmpresa(compId);
        
        // REGLA DE ORO: Eliminación en cascada de usuarios (por dominio @nombre o por ID)
        const companyNameClean = compToMove.name.toLowerCase().replace(/\s+/g, '');
        const domainToMatch = `@${companyNameClean}`;
        
        const usersToDelete = users.filter(u => {
            const email = (u.email || '').toLowerCase();
            const matchesDomain = email.includes(domainToMatch);
            const matchesId = String(u.companyId) === String(compId) || String(u.empresaId) === String(compId);
            return matchesDomain || matchesId;
        });

        if (usersToDelete.length > 0) {
            for (const u of usersToDelete) {
                await db.eliminarUsuario(u.id || u.uid);
            }
            alert(`✅ Empresa "${compToMove.name}" y ${usersToDelete.length} usuarios vinculados eliminados correctamente.`);
        } else {
            alert(`✅ Empresa "${compToMove.name}" eliminada correctamente.`);
        }
        
        loadData();
    } catch (err) {
        alert("Error al eliminar la empresa: " + err.message);
    }
  };

  const handleRestoreFromTrash = (item) => {
    if (item.originalType === 'company') {
      const allCompanies = JSON.parse(localStorage.getItem('centinela_companies') || '[]');
      localStorage.setItem('centinela_companies', JSON.stringify([...allCompanies, item]));
    } else {
      const allUsers = JSON.parse(localStorage.getItem('centinela_users') || '[]');
      localStorage.setItem('centinela_users', JSON.stringify([...allUsers, item]));
    }

    const allTrash = JSON.parse(localStorage.getItem('centinela_trash') || '[]');
    const filteredTrash = allTrash.filter(curr => curr.deletedAt !== item.deletedAt);
    localStorage.setItem('centinela_trash', JSON.stringify(filteredTrash));

    loadData();
    alert("✅ Registro restaurado correctamente.");
  };

  const handlePermanentDeleteFromTrash = (item) => {
    if (!window.confirm("¿Eliminar definitivamente? Esta acción no se puede deshacer.")) return;
    const allTrash = JSON.parse(localStorage.getItem('centinela_trash') || '[]');
    const filteredTrash = allTrash.filter(curr => curr.deletedAt !== item.deletedAt);
    localStorage.setItem('centinela_trash', JSON.stringify(filteredTrash));
    loadData();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        const selectedCompany = companies.find(c => c.id === newUser.companyId);
        const userData = {
            ...newUser,
            nombre: newUser.name, // Sincronización de campos
            apellido: '',
            rol: newUser.role,    // Sincronización rol/role
            role: newUser.role,
            company: selectedCompany?.name || '',
            companyId: newUser.companyId,
            empresaId: newUser.companyId,
            status: 'activo',
            estado: 'ACTIVO',
            password: 'password123'
        };

        await db.crearUsuarioSaaS(userData, newUser.companyId);

        alert("✅ Usuario administrador creado en el servidor correctamente.");
        setShowUserModal(false);
        setEditingUser(null);
        setNewUser({ name: '', email: '', companyId: '', role: 'Admin Empresa' });
    } catch (err) {
        alert("Error al crear usuario: " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const cycleUserStatus = async (userId, currentStatus) => {
    const statuses = ['activo', 'bloqueado', 'eliminado'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    try {
        const userToUpdate = users.find(u => u.id === userId);
        if (userToUpdate) {
            await db.crearUsuarioSaaS({ ...userToUpdate, status: nextStatus }, userToUpdate.companyId);
        }
    } catch (err) {
        alert("Error al actualizar estado: " + err.message);
    }
  };

  const handleResetCompanyPassword = (companyId, companyEmail) => {
    if (!companyId) return;
    
    if (confirm(`¿Estás seguro de que deseas blanquear los accesos para esta empresa? El administrador deberá usar 'password123' y cambiarla al ingresar.`)) {
      const allUsers = JSON.parse(localStorage.getItem('centinela_users') || '[]');
      let count = 0;
      
      const updated = allUsers.map(u => {
        // Buscamos usuarios que pertenezcan a la empresa y sean Admins
        const matchesCompany = u.companyId === companyId || u.empresaId === companyId;
        const isAdmin = u.role?.toLowerCase().includes('admin') || u.rol?.toLowerCase().includes('admin');
        const matchesEmail = u.email?.toLowerCase() === companyEmail?.toLowerCase();

        if (matchesCompany && (isAdmin || matchesEmail)) {
          count++;
          return { ...u, password: 'password123', mustChangePassword: true };
        }
        return u;
      });

      if (count > 0) {
        localStorage.setItem('centinela_users', JSON.stringify(updated));
        setUsers(updated);
        alert(`✅ Se restablecieron ${count} cuenta(s) a 'password123' correctamente.`);
      } else {
        alert("⚠️ No se encontraron usuarios administradores vinculados a este email o empresa.");
      }
    }
  };

  const resetUserAccess = (userId) => {
    if (confirm("¿Estás seguro de que deseas blanquear la contraseña a 'password123'? El usuario deberá cambiarla al ingresar.")) {
      const allUsers = JSON.parse(localStorage.getItem('centinela_users') || '[]');
      const updated = allUsers.map(u => (u.id === userId || u.uid === userId) ? { ...u, password: 'password123', mustChangePassword: true } : u);
      localStorage.setItem('centinela_users', JSON.stringify(updated));
      setUsers(updated);
      alert("✅ Contraseña restablecida a 'password123' correctamente.");
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem('centinela_sysconfig', JSON.stringify(sysConfig));
      setIsSaving(false);
      alert('Configuración guardada en el sistema.');
    }, 800);
  };

  const updateTicketStatus = (ticketId, currentStatus) => {
    const statuses = ['abierto', 'en_proceso', 'cerrado'];
    const updatedTickets = tickets.map(t => {
      const idToMatch = t.id || t.fecha; // Use t.id or t.fecha for comparison
      if (idToMatch === ticketId) {
        const currentIndex = statuses.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return { ...t, estado: statuses[nextIndex] };
      }
      return t;
    });
    setTickets(updatedTickets);
    localStorage.setItem('centinela_tickets', JSON.stringify(updatedTickets));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleApprove = async (payment) => {
    if (!payment) return;
    setIsProcessing(true);
    try {
      const updatedPayments = payments.map(p => 
        (p.id === payment.id) ? { ...p, estado: 'approved', status: 'Completado' } : p
      );
      setPayments(updatedPayments);
      localStorage.setItem('centinela_pagos', JSON.stringify(updatedPayments));
      
      // Activar empresa
      const companyId = payment.companyId || payment.empresaId;
      const updatedCompanies = companies.map(c => 
        (c.id === companyId) ? { ...c, status: 'activa' } : c
      );
      setCompanies(updatedCompanies);
      localStorage.setItem('centinela_companies', JSON.stringify(updatedCompanies));
      
      setSelectedPayment(null);
      alert("✅ Pago aprobado y empresa activada con éxito.");
    } catch (e) {
      alert("Error al procesar el pago.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (id) => {
    if (!window.confirm("¿Rechazar este pago?")) return;
    const updatedPayments = payments.map(p => 
      (p.id === id) ? { ...p, estado: 'rejected', status: 'Rechazado' } : p
    );
    setPayments(updatedPayments);
    localStorage.setItem('centinela_pagos', JSON.stringify(updatedPayments));
    alert("Pago rechazado.");
  };

  const dashboardStats = {
    activeOnes: companies.filter(c => c.status === 'activa').length,
    suspendedOnes: companies.filter(c => c.status === 'suspendida').length,
    totalRevenue: payments
      .filter(p => p.estado === 'approved' || p.status === 'Completado')
      .reduce((acc, curr) => acc + (Number(curr.monto || curr.amount) || 0), 0)
  };

  const getStatusColor = (status) => {
    const s = (status || 'abierto').toString().toLowerCase().trim().replace(/\s+/g, '_');
    const map = {
      'activa': { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
      'activo': { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
      'abierto': { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
      'resuelto': { bg: 'rgba(16,185,129,0.1)', text: '#10b981' },
      'suspendida': { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
      'suspendido': { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
      'bloqueado': { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
      'esperando_cliente': { bg: 'rgba(245,158,11,0.1)', text: '#f59e0b' },
      'eliminado': { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
      'cancelada': { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
      'cerrado': { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
      'nuevo': { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
      'urgente': { bg: 'rgba(239,68,68,0.2)', text: '#ff4d4d' },
      'prueba': { bg: 'rgba(56,189,248,0.1)', text: '#38bdf8' },
      'en_proceso': { bg: 'rgba(56,189,248,0.1)', text: '#38bdf8' }
    };
    return map[s] || { bg: 'rgba(156,163,175,0.1)', text: '#9ca3af' };
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Estadísticas':
        return (
          <div className="fade-in">
            {/* Top Grid: KPI Cards Original */}
            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
              <StatCard title="Empresas" value={companies.length} icon={<Building2 size={24} />} color="#00d2ff" trend="Registradas" />
              <StatCard title="Usuarios" value={users.length} icon={<Users size={24} />} color="#f59e0b" trend="Activos" />
              <StatCard title="Soporte" value={tickets.length} icon={<HelpCircle size={24} />} color="#10b981" trend="Tickets" />
              <StatCard title="Botón Pánico" value={events.filter(e => e.tipo === 'emergencia').length} icon={<ShieldAlert size={24} />} color="#ef4444" trend="Alertas" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '20px', marginBottom: '25px' }}>
              {/* Central REAL Map Container */}
              <div className="glass" style={{ height: '400px', width: '100%', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <MapContainer
                  center={[-34.6037, -58.3816]}
                  zoom={10}
                  style={{ height: '100%', width: '100%', background: '#0a0f1e' }}
                >
                  <ChangeView companies={companies} />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {companies.map(comp => {
                    const lat = parseFloat(comp.lat);
                    const lng = parseFloat(comp.lng);
                    if (isNaN(lat) || isNaN(lng)) return null;
                    return (
                      <Marker key={`${comp.id}-${lat}-${lng}`} position={[lat, lng]}>
                        <Popup>
                          <div style={{ color: '#070c1a', minWidth: '180px', padding: '5px' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '5px', marginBottom: '8px', color: '#00d2ff' }}>{comp.name || comp.nombre}</div>
                            <div style={{ fontSize: '0.75rem', marginBottom: '4px' }}><b>Plan:</b> {comp.plan?.toUpperCase()}</div>
                            <div style={{ fontSize: '0.75rem', marginBottom: '4px' }}><b>Estado:</b> {comp.status?.toUpperCase()}</div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Right Widgets Vertical */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#94a3b8', letterSpacing: '1px' }}>ANÁLISIS FINANCIERO</span>
                    <TrendingUp size={16} color="#00d2ff" />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#00d2ff', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      ${dashboardStats.totalRevenue.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>+12.5%</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Ingresos Brutos Mensuales (USD)</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    {[
                      { label: 'Enterprise', count: companies.filter(c => c.plan === 'enterprise').length, color: '#3b82f6' },
                      { label: 'Profesional', count: companies.filter(c => c.plan === 'profesional').length, color: '#10b981' },
                      { label: 'Básico', count: companies.filter(c => c.plan === 'basico').length, color: '#f59e0b' }
                    ].map((p, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: p.color }} />
                          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{p.label}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{p.count} <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>cli</span></span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>SOPORTE EN LÍNEA</span>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#9c9c9c' }}>Agentes disponibles: 4</p>
                  <button className="secondary" style={{ width: '100%', padding: '8px', marginTop: '10px', fontSize: '0.75rem' }}>Ver Chat</button>
                </div>
              </div>
            </div>

            {/* Bottom Row Row: Resumen Operativo */}
            <div className="glass" style={{ padding: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <History size={20} color="#00d2ff" /> Resumen Operativo de Empresas
                </h2>
                <button onClick={() => setActiveTab('Empresas')} className="secondary" style={{ padding: '6px 15px', fontSize: '0.75rem' }}>Ver todas</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '0.8rem' }}>
                      <th style={{ padding: '15px' }}>EMPRESA</th>
                      <th style={{ padding: '15px' }}>PLAN</th>
                      <th style={{ padding: '15px' }}>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.slice(0, 5).map(c => {
                      const pk = (c.plan || 'basico').toUpperCase();
                      const pi = PLANES[pk] || PLANES.BASICO;
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '15px' }}>
                            <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ color: pi.color }}>{pk}</span>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <span style={{ color: getStatusColor(c.status).text }}>{(c.status || 'activa').toUpperCase()}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'Licencias':
        return (
          <div className="fade-in">
            {/* BLOQUE GLOBAL (Arriba de los planes) */}
            <div className="glass" style={{ padding: '30px', marginBottom: '30px', background: 'linear-gradient(90deg, rgba(0,210,255,0.1) 0%, rgba(15,23,42,0) 100%)', borderLeft: '4px solid #00d2ff' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'white', marginBottom: '15px' }}>Gestioná toda tu operación de seguridad desde un solo sistema</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {[
                  'Control en tiempo real',
                  'Reducción de errores operativos',
                  'Mayor eficiencia del personal',
                  'Mejora en la calidad del servicio'
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '0.9rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00d2ff' }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Planes y Licencias</h2>
                <p style={{ color: '#94a3b8' }}>Estructura comercial para operaciones reales.</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={() => {
                    console.log("DEBUG: Click Nuevo Plan triggered");
                    setEditingPlanData({
                      nombre: '', precio: 0, subtitulo: '', limite_guardias: 50, botones_panico: 20, 
                      limite_puestos: Infinity, historial_dias: 30, beneficios: [], color: '#38bdf8',
                      gps: false, rondas: false, alertas_ia: false
                    });
                    setShowPlanModal(true);
                  }}
                  className="secondary"
                  style={{ padding: '12px 25px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={18} /> Crear Nuevo Plan
                </button>
                <button
                  onClick={() => setShowProposalModal(true)}
                  className="primary"
                  style={{ padding: '12px 25px', display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(to right, #00d2ff, #3b82f6)', border: 'none' }}
                >
                  <Bell size={18} /> Enviar Propuesta por Email
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
               {Object.values(localPlanes).map(plan => {
                 const isSelected = selectedPlanId === plan.id;
                 return (
                  <div 
                    key={plan.id} 
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="glass" 
                    style={{
                      padding: '35px',
                      background: isSelected ? `${plan.color}11` : 'rgba(15,23,42,0.4)',
                      border: isSelected ? `2px solid ${plan.color}88` : '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '32px',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      boxShadow: isSelected ? `0 15px 40px ${plan.color}11` : 'none',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>{plan.nombre}</h3>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px', maxWidth: '200px', lineHeight: '1.4' }}>{plan.subtitulo}</div>
                        <div style={{ fontSize: '2.2rem', fontWeight: '900', color: isSelected ? plan.color : 'white', marginTop: '15px', transition: '0.3s' }}>
                          ${plan.precio}<span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 'normal' }}>/mes</span>
                        </div>
                      </div>
                      <div style={{ 
                        padding: '14px', borderRadius: '18px', background: `${plan.color}15`, color: plan.color,
                        boxShadow: `0 8px 20px ${plan.color}11`
                      }}>
                        {plan.id === 'basico' ? <Zap size={28} /> : plan.id === 'profesional' ? <Shield size={28} /> : plan.id === 'demo' ? <Activity size={28} /> : <Package size={28} />}
                      </div>
                    </div>

                    <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0', fontSize: '0.85rem', color: '#cbd5e1', flex: 1 }}>
                      <li style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CheckCircle2 size={18} color={plan.color} /> <span>Hasta <b>{plan.limite_guardias}</b> Guardias</span>
                      </li>
                      {plan.botones_panico && (
                        <li style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <CheckCircle2 size={18} color={plan.color} /> <span><b>{plan.botones_panico}</b> Botones de Pánico</span>
                        </li>
                      )}
                      <li style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CheckCircle2 size={18} color={plan.color} /> <span>Puestos de Monitoreo: <b>ilimitados</b></span>
                      </li>
                      <li style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CheckCircle2 size={18} color={plan.color} /> <span>Historial: <b>{plan.historial_dias}</b> días</span>
                      </li>
                      {(plan.rondas || plan.gps) && (
                        <li style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <CheckCircle2 size={18} color={plan.color} /> <span>GPS y Rondas Activas</span>
                        </li>
                      )}
                    </ul>

                    {plan.beneficios && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', marginTop: '10px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '900', color: plan.color, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Valor Agregado</div>
                        {plan.beneficios.map((b, i) => (
                          <div key={i} style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div style={{ marginTop: '6px', width: '5px', height: '5px', borderRadius: '50%', background: plan.color, opacity: 0.5 }} />
                            {b}
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      style={{ 
                        width: '100%', marginTop: '25px', padding: '15px', borderRadius: '15px',
                        background: isSelected ? plan.color : 'rgba(255,255,255,0.03)',
                        color: isSelected ? 'white' : '#94a3b8',
                        textAlign: 'center', fontWeight: '900', fontSize: '0.85rem',
                        transition: '0.3s', border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      {isSelected ? (
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <BadgeCheck size={18} /> SELECCIONADO
                        </span>
                      ) : 'SELECCIONAR PLAN'}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("DEBUG: Click Editar Plan", plan);
                        setEditingPlanData({ ...plan });
                        setShowPlanModal(true);
                      }}
                      className="secondary"
                      style={{ width: '100%', marginTop: '10px', fontSize: '0.75rem', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Settings2 size={14} /> Editar Plan
                    </button>
                  </div>
                 );
               })}
             </div>

             {/* MODAL DE GESTIÓN DE PLAN (Integrado correctamente en Licencias) */}
             {showPlanModal && editingPlanData && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 5000, backdropFilter: 'blur(20px)' }}>
                  <div className="glass fade-in" style={{ width: '600px', padding: '40px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}>
                    <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Package size={24} color={editingPlanData.color || '#00d2ff'} />
                        {editingPlanData.id ? 'Editar Plan de Servicio' : 'Crear Nuevo Plan'}
                      </div>
                      <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                    </h2>

                    <form onSubmit={handleSavePlan}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label>Nombre del Plan</label>
                          <input required className="input-full" value={editingPlanData.nombre} onChange={e => setEditingPlanData({ ...editingPlanData, nombre: e.target.value })} />
                        </div>
                        <div>
                          <label>Precio (USD)</label>
                          <input type="number" required className="input-full" value={editingPlanData.precio} onChange={e => setEditingPlanData({ ...editingPlanData, precio: Number(e.target.value) })} />
                        </div>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label>Slogan / Subtítulo</label>
                        <input required className="input-full" value={editingPlanData.subtitulo} onChange={e => setEditingPlanData({ ...editingPlanData, subtitulo: e.target.value })} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label>Límite Guardias</label>
                          <input type="number" required className="input-full" value={editingPlanData.limite_guardias} onChange={e => setEditingPlanData({ ...editingPlanData, limite_guardias: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label>Botones de Pánico</label>
                          <input type="number" required className="input-full" value={editingPlanData.botones_panico} onChange={e => setEditingPlanData({ ...editingPlanData, botones_panico: Number(e.target.value) })} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <label>Historial (Días)</label>
                          <input type="number" required className="input-full" value={editingPlanData.historial_dias} onChange={e => setEditingPlanData({ ...editingPlanData, historial_dias: Number(e.target.value) })} />
                        </div>
                        <div>
                          <label>Color Identificador</label>
                          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <input type="color" value={editingPlanData.color || '#38bdf8'} onChange={e => setEditingPlanData({ ...editingPlanData, color: e.target.value })} style={{ border: 'none', background: 'none', width: '40px', height: '40px', cursor: 'pointer' }} />
                            <input className="input-full" style={{ marginTop: 0 }} value={editingPlanData.color} onChange={e => setEditingPlanData({ ...editingPlanData, color: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.7rem' }}>
                          <input type="checkbox" checked={editingPlanData.gps} onChange={e => setEditingPlanData({ ...editingPlanData, gps: e.target.checked })} /> GPS TRACKING
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.7rem' }}>
                          <input type="checkbox" checked={editingPlanData.rondas} onChange={e => setEditingPlanData({ ...editingPlanData, rondas: e.target.checked })} /> RONDAS QR
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.7rem' }}>
                          <input type="checkbox" checked={editingPlanData.alertas_ia} onChange={e => setEditingPlanData({ ...editingPlanData, alertas_ia: e.target.checked })} /> IA ALERTS
                        </label>
                      </div>

                      <div style={{ marginBottom: '25px' }}>
                        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                          Beneficios del Plan
                          <button type="button" onClick={() => setEditingPlanData({ ...editingPlanData, beneficios: [...(editingPlanData.beneficios || []), ''] })} style={{ background: 'none', border: 'none', color: '#00d2ff', cursor: 'pointer', fontSize: '0.7rem' }}>+ Agregar</button>
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                          {editingPlanData.beneficios?.map((b, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px' }}>
                              <input className="input-full" style={{ marginTop: 0 }} value={b} onChange={e => {
                                const newB = [...editingPlanData.beneficios];
                                newB[idx] = e.target.value;
                                setEditingPlanData({ ...editingPlanData, beneficios: newB });
                              }} />
                              <button type="button" onClick={() => {
                                const newB = editingPlanData.beneficios.filter((_, i) => i !== idx);
                                setEditingPlanData({ ...editingPlanData, beneficios: newB });
                              }} style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', padding: '0 10px', borderRadius: '8px' }}><Trash2 size={14} /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '15px' }}>
                        <button type="submit" className="primary" style={{ flex: 1, padding: '15px' }}>{isSaving ? 'Guardando...' : 'Guardar Plan'}</button>
                        {editingPlanData.id && !['basico', 'profesional', 'enterprise', 'demo'].includes(editingPlanData.id) && (
                          <button type="button" onClick={() => { handleDeletePlan(editingPlanData.id); setShowPlanModal(false); }} className="secondary" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>Eliminar</button>
                        )}
                        <button type="button" onClick={() => setShowPlanModal(false)} className="secondary" style={{ flex: 1 }}>Cancelar</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
           </div>
        );
      case 'Empresas':
        return (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Gestión Maestra de Empresas</h2>
                <p style={{ color: '#94a3b8' }}>Administración centralizada de clientes y recursos.</p>
              </div>
              <button onClick={() => {
                setEditingCompany(null);
                setNewCompany({ name: '', titular: '', dni: '', email: '', telefono: '', address: '', plan: 'basico', guards: 0, status: 'activa', expiryDate: '', fecha_alta: new Date().toISOString().split('T')[0] });
                setShowModal(true);
              }} className="primary" style={{ padding: '12px 25px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} /> Nueva Empresa
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
              {companies.map(c => {
                const planInfo = PLANES[c.plan.toUpperCase()];
                const guardPercent = Math.min((c.guards / (planInfo.limite_guardias === Infinity ? 1000 : planInfo.limite_guardias)) * 100, 100);

                return (
                  <div key={c.id} className="glass" style={{
                    padding: '25px',
                    background: `linear-gradient(135deg, ${planInfo.color}33 0%, rgba(15,23,42,0.9) 100%)`,
                    borderTop: `4px solid ${planInfo.color}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>{c.name}</h3>
                        <div style={{ fontSize: '0.7rem', color: planInfo.color, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
                          Plan {planInfo.nombre}
                        </div>
                      </div>
                      <div
                        onClick={() => cycleCompanyStatus(c.id)}
                        style={{
                          padding: '6px 12px', borderRadius: '20px', cursor: 'pointer',
                          backgroundColor: getStatusColor(c.status).bg, color: getStatusColor(c.status).text,
                          fontSize: '0.65rem', fontWeight: '900', textTransform: 'uppercase',
                          boxShadow: `0 0 10px ${getStatusColor(c.status).text}44`
                        }}
                      >
                        {c.status}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      {/* Guard Capacity Progress */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                          <span style={{ color: '#94a3b8' }}>Capacidad de Guardias</span>
                          <span style={{ fontWeight: 'bold' }}>{c.guards} / {planInfo.limite_guardias === Infinity ? 'âˆž' : planInfo.limite_guardias}</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ width: `${guardPercent}%`, height: '100%', background: planInfo.color, boxShadow: `0 0 10px ${planInfo.color}` }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Titular</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{c.titular || 'S/D'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Vencimiento</div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: new Date(c.expiryDate) < new Date() ? '#ef4444' : 'white' }}>{c.expiryDate}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '10px' }}>Ver Auditoría</button>
                        <button
                          className="primary"
                          style={{ flex: 1, fontSize: '0.75rem', padding: '10px', background: planInfo.color, borderColor: 'transparent' }}
                          onClick={() => { 
                            setEditingCompany(c); 
                            // Asegurar que la fecha esté en formato YYYY-MM-DD para el input type="date"
                            const formattedExpiry = c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '';
                            setNewCompany({ ...c, expiryDate: formattedExpiry }); 
                            setShowModal(true); 
                          }}
                        >Editar</button>
                        <button
                          onClick={() => handleSoftDeleteCompany(c.id)}
                          style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'Validacion':
        return (
          <div className="fade-in">
            <div style={{ marginBottom: '30px' }}>
               <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0 }}>Validación de Pagos</h2>
               <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Gestión centralizada de transferencias bancarias y activaciones manuales.</p>
            </div>
            <PaymentsValidationPanel companies={companies} />
          </div>
        );
      case 'Pagos':
        return (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
               <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Módulo de Facturación SaaS</h2>
                  <p style={{ color: '#94a3b8' }}>Configuración global de recaudación y suscripciones.</p>
               </div>
               <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {['config', 'suscripciones', 'historial', 'seguridad'].map(st => (
                     <button 
                        key={st}
                        onClick={() => setFacturacionSubTab(st)}
                        style={{
                           padding: '8px 15px',
                           borderRadius: '8px',
                           border: 'none',
                           background: facturacionSubTab === st ? 'rgba(0,210,255,0.1)' : 'transparent',
                           color: facturacionSubTab === st ? '#00d2ff' : '#94a3b8',
                           cursor: 'pointer',
                           fontSize: '0.8rem',
                           fontWeight: 'bold',
                           transition: '0.3s'
                        }}
                     >
                        {st.toUpperCase()}
                     </button>
                  ))}
               </div>
            </div>

            {facturacionSubTab === 'config' && <PaymentConfigPanel isSaving={isSaving} setIsSaving={setIsSaving} />}
            {facturacionSubTab === 'suscripciones' && <SubscriptionsPanel companies={companies} getStatusColor={getStatusColor} />}
            {facturacionSubTab === 'historial' && <PaymentHistoryPanel companies={companies} />}
            {facturacionSubTab === 'seguridad' && <SecurityConfigPanel />}
          </div>
        );
      case 'Usuarios':
        return (
           <div className="fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
               <div>
                  <h2 style={{ margin: 0 }}>Gestión de Usuarios Centralizada</h2>
                  <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>Administra los accesos administrativos de cada empresa.</p>
               </div>
               <button onClick={() => { setEditingUser(null); setNewUser({ name: '', email: '', companyId: '', role: 'Admin' }); setShowUserModal(true); }} className="primary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Plus size={18} /> Crear Nuevo Admin
               </button>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '25px', alignItems: 'start' }}>
               {/* Sidebar de Empresas */}
               <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Filtrar por Empresa</h4>
                 <button
                   onClick={() => setSelectedCompanyId('all')}
                   style={{
                     padding: '12px 15px',
                     borderRadius: '10px',
                     border: 'none',
                     textAlign: 'left',
                     background: selectedCompanyId === 'all' ? 'rgba(0,210,255,0.1)' : 'transparent',
                     color: selectedCompanyId === 'all' ? '#00d2ff' : 'white',
                     cursor: 'pointer',
                     transition: '0.3s',
                     fontWeight: selectedCompanyId === 'all' ? 'bold' : 'normal',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '10px'
                   }}
                 >
                   <Building2 size={16} /> TODAS LAS EMPRESAS
                 </button>
                 <div style={{ overflowY: 'auto', maxHeight: '500px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                   {companies.map(c => (
                     <button
                       key={c.id}
                       onClick={() => setSelectedCompanyId(c.id)}
                       style={{
                         padding: '10px 15px',
                         borderRadius: '10px',
                         border: '1px solid rgba(255,255,255,0.02)',
                         textAlign: 'left',
                         background: selectedCompanyId === c.id ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.02)',
                         color: selectedCompanyId === c.id ? '#00d2ff' : '#cbd5e1',
                         cursor: 'pointer',
                         transition: '0.2s',
                         fontSize: '0.85rem',
                         fontWeight: selectedCompanyId === c.id ? 'bold' : 'normal',
                         whiteSpace: 'nowrap',
                         overflow: 'hidden',
                         textOverflow: 'ellipsis'
                       }}
                       title={c.name}
                     >
                       {c.name}
                     </button>
                   ))}
                 </div>
               </div>

               {/* Tabla de Usuarios */}
               <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                 <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ margin: 0 }}>
                       {selectedCompanyId === 'all' ? 'Todos los Usuarios' : `Usuarios de ${companies.find(c => c.id === selectedCompanyId)?.name}`}
                    </h4>
                 </div>
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                   <thead>
                     <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                       <th style={{ padding: '15px', textAlign: 'left' }}>Nombre</th>
                       <th style={{ padding: '15px', textAlign: 'left' }}>Email / Usuario</th>
                       {selectedCompanyId === 'all' && <th style={{ padding: '15px', textAlign: 'left' }}>Empresa</th>}
                       <th style={{ padding: '15px', textAlign: 'left' }}>Rol</th>
                       <th style={{ padding: '15px', textAlign: 'left' }}>Estado</th>
                       <th style={{ padding: '15px', textAlign: 'center' }}>Acciones</th>
                     </tr>
                   </thead>
                   <tbody>
                     {users
                       .filter(u => {
                         // REGLA DE ORO: Filtrado de registros vacíos y exclusión del Super Admin
                         if (!u.email || u.email.trim() === "" || u.email.toLowerCase() === 'vidal@master.com') return false;
                         
                         if (selectedCompanyId === 'all') return true;
                         const selectedCompany = companies.find(c => c.id === selectedCompanyId);
                         if (!selectedCompany) return false;

                         const uCompany = (u.company || '').toLowerCase().trim();
                         const sName = (selectedCompany.name || '').toLowerCase().trim();

                         // 1. Coincidencia por nombre de empresa (estricto)
                         if (u.companyId === selectedCompanyId || u.empresaId === selectedCompanyId || uCompany === sName) return true;

                         // 2. Intento de emparejamiento por dominio de email
                         if (u.email && u.email.includes('@')) {
                            const userDomainFull = u.email.split('@')[1].toLowerCase();
                            const userDomainRoot = userDomainFull.split('.')[0]; // ej: 'pepelui'

                            // A. Comparar con el dominio del email oficial de la empresa si existe
                            if (selectedCompany.email && selectedCompany.email.includes('@')) {
                               const companyDomainFull = selectedCompany.email.split('@')[1].toLowerCase();
                               if (userDomainFull === companyDomainFull) return true;
                            }

                            // B. Si el dominio del usuario (ej: 'pepelui') estÃ¡ contenido en el nombre de la empresa (ej: 'pepelui s.a')
                            // Limpiamos el nombre de la empresa de puntos y espacios para mayor precisiÃ³n
                            const cleanCompName = sName.replace(/[.\s]/g, '');
                            if (cleanCompName.includes(userDomainRoot) && userDomainRoot.length > 3) return true;
                         }

                         return false;
                       })
                       .map(u => (
                       <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: '0.2s' }} className="hover-row">
                         <td style={{ padding: '15px', fontWeight: 'bold' }}>{u.name || (u.nombre ? `${u.nombre} ${u.apellido || ''}` : 'S/N')}</td>
                         <td style={{ padding: '15px', color: '#cbd5e1', fontSize: '0.9rem' }}>{u.email}</td>
                         {selectedCompanyId === 'all' && (
                            <td style={{ padding: '15px' }}>
                              {u.company || companies.find(c => c.id === u.companyId || c.id === u.empresaId)?.name || 'S/E'}
                            </td>
                         )}
                         <td style={{ padding: '15px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.role}</span>
                         </td>
                         <td style={{ padding: '15px' }}>
                           <span style={{
                             padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold',
                             backgroundColor: getStatusColor(u.status).bg, color: getStatusColor(u.status).text
                           }}>
                             {u.status}
                           </span>
                         </td>
                         <td style={{ padding: '15px', textAlign: 'center' }}>
                           <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                             <button
                               onClick={() => { setEditingUser(u); setNewUser({ name: u.name, email: u.email, companyId: companies.find(c => c.name === u.company)?.id || '', role: u.role }); setShowUserModal(true); }}
                               style={{ padding: '8px', borderRadius: '8px', color: '#00d2ff', background: 'rgba(0,210,255,0.1)', border: 'none', cursor: 'pointer' }}
                               title="Editar Usuario"
                             >
                               <Settings2 size={16} />
                             </button>
                             <button
                               onClick={() => resetUserAccess(u.id)}
                               title="Blanquear Contraseña"
                               style={{ padding: '8px', borderRadius: '8px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: 'none', cursor: 'pointer' }}
                             >
                               <Zap size={16} />
                             </button>
                             <button
                               onClick={() => cycleUserStatus(u.id)}
                               style={{ padding: '8px', borderRadius: '8px', color: '#cbd5e1', background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer' }}
                               title="Alternar Estado"
                             >
                               <Power size={16} />
                             </button>
                             <button
                               onClick={() => handleDeleteUser(u.id)}
                               style={{ padding: '8px', borderRadius: '8px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer' }}
                               title="Eliminar Usuario"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {users.filter(u => selectedCompanyId === 'all' || u.company === companies.find(c => c.id === selectedCompanyId)?.name).length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                       No hay usuarios registrados para esta selección.
                    </div>
                 )}
               </div>
             </div>
           </div>
         );
      case 'Configuración':
        return (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>Configuración Global del Sistema</h2>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '5px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {['global', 'seguridad'].map(st => (
                   <button 
                      key={st}
                      onClick={() => setConfigSubTab(st)}
                      style={{
                         padding: '8px 15px',
                         borderRadius: '8px',
                         border: 'none',
                         background: configSubTab === st ? 'rgba(0,210,255,0.1)' : 'transparent',
                         color: configSubTab === st ? '#00d2ff' : '#94a3b8',
                         cursor: 'pointer',
                         fontSize: '0.8rem',
                         fontWeight: 'bold',
                         transition: '0.3s'
                      }}
                   >
                      {st === 'global' ? 'SISTEMA' : 'SEGURIDAD'}
                   </button>
                ))}
              </div>
            </div>

            {configSubTab === 'global' && (
              <div className="glass" style={{ padding: '30px', maxWidth: '600px' }}>
                <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label>Versión del Sistema</label>
                    <input type="text" value={sysConfig.version} onChange={e => setConfig({ ...sysConfig, version: e.target.value })} className="input-full" />
                  </div>
                  <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <strong style={{ display: 'block' }}>Modo Mantenimiento</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bloquea el acceso a todas las empresas temporalmente</span>
                    </div>
                    <button type="button" onClick={() => setSysConfig({ ...sysConfig, mantenimiento: !sysConfig.mantenimiento })} style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', border: 'none', color: 'white', backgroundColor: sysConfig.mantenimiento ? '#ef4444' : 'rgba(255,255,255,0.1)' }}>
                      {sysConfig.mantenimiento ? 'Mantenimiento Activo' : 'Sistema Normal'}
                    </button>
                  </div>
                  <div>
                    <label>Aviso / Mensaje Global</label>
                    <textarea
                      value={sysConfig.mensaje_global}
                      onChange={e => setSysConfig({ ...sysConfig, mensaje_global: e.target.value })}
                      placeholder="Escribe un aviso para que lo vean todos los administradores (Ej: Ventana de mantenimiento esta noche a las 02:00 AM)"
                      className="input-full"
                      style={{ minHeight: '100px', resize: 'vertical' }}
                    ></textarea>
                  </div>
                  <button type="submit" className="primary" style={{ padding: '14px', marginTop: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    {isSaving ? <Loader2 className="animate-spin" /> : <Settings2 size={18} />} Guardar Configuración Restringida
                  </button>
                </form>
              </div>
            )}

            {configSubTab === 'seguridad' && <SecurityConfigPanel />}
          </div>
        );
      case 'Soporte':
        const getTicketStatus = (t) => (t.status || t.estado || 'abierto').toLowerCase();
        
        const openTicketsCount = tickets.filter(t => ['abierto', 'nuevo', 'en proceso', 'en_proceso', 'esperando respuesta', 'esperando_cliente'].includes(getTicketStatus(t))).length;
        const resolvedTicketsCount = tickets.filter(t => ['resuelto', 'cerrado'].includes(getTicketStatus(t))).length;
        const resolvedTickets = tickets.filter(t => ['resuelto', 'cerrado'].includes(getTicketStatus(t)));
        const avgResolutionTime = resolvedTickets.length > 0 
          ? (resolvedTickets.reduce((acc, t) => {
              try {
                const start = new Date(t.fecha);
                let end;
                if (t.fechaResolucion) {
                  end = new Date(t.fechaResolucion);
                } else if (t.respuestas && t.respuestas.length > 0) {
                  const lastRes = t.respuestas[t.respuestas.length - 1];
                  end = lastRes && lastRes.fecha ? new Date(lastRes.fecha) : new Date();
                } else {
                  end = new Date();
                }
                const duration = !isNaN(start.getTime()) && !isNaN(end.getTime()) ? (end - start) : 0;
                return acc + Math.max(0, duration);
              } catch (e) { return acc; }
            }, 0) / (resolvedTickets.length * 1000 * 60 * 60)).toFixed(1) + "hs"
          : "S/D";

        return (
          <div className="fade-in">
            <div style={{ marginBottom: '30px' }}>
               <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: 0 }}>Supervisión de Soporte Técnico</h2>
               <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Control de calidad y monitoreo de tiempos de respuesta del equipo de atención.</p>
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
               <div className="glass" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>TICKETS ACTIVOS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{openTicketsCount}</div>
               </div>
               <div className="glass" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>TICKETS RESUELTOS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{resolvedTicketsCount}</div>
               </div>
               <div className="glass" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>TIEMPO PROM. RES.</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00d2ff' }}>{avgResolutionTime}</div>
               </div>
               <div className="glass" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>TOTAL EMPRESAS</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>{companies.length}</div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', marginTop: '50px' }}>
               <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>Equipo de Soporte</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Gestión de personal interno y analistas técnicos.</p>
               </div>
               <button 
                  onClick={() => { setEditingSupportUser(null); setShowSupportUserModal(true); }}
                  className="primary" 
                  style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
               >
                  <Plus size={18} /> AGREGAR ANALISTA
               </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
               {users.filter(u => (u.role || u.rol) === 'SUPPORT' || (u.role || u.rol) === 'SOPORTE').map((u, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => {
                        setEditingSupportUser(u);
                        setShowSupportUserModal(true);
                    }}
                    className="glass" 
                    style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid rgba(0,210,255,0.1)', cursor: 'pointer', transition: '0.3s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                     <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(0,210,255,0.1)', color: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        {(u.nombre || u.name)?.charAt(0)}{(u.apellido || u.surname)?.charAt(0)}
                     </div>
                     <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{u.nombre || u.name} {u.apellido || u.surname}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                        <div style={{ fontSize: '0.7rem', color: '#00d2ff', marginTop: '4px', fontWeight: 'bold' }}>ID: {u.legajo || 'S/L'}</div>
                     </div>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: (u.estado || u.status) === 'ACTIVO' ? '#10b981' : '#ef4444' }} title={u.estado || u.status} />
                  </div>
               ))}
               {users.filter(u => (u.role || u.rol) === 'SUPPORT' || (u.role || u.rol) === 'SOPORTE').length === 0 && (
                  <div style={{ padding: '30px', textAlign: 'center', gridColumn: '1 / -1', opacity: 0.5, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '15px' }}>
                     No hay personal de soporte registrado aún.
                  </div>
               )}
            </div>

            <div style={{ marginBottom: '30px' }}>
               <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>Monitoreo de Tickets</h2>
               <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Lista activa de solicitudes y requerimientos técnicos.</p>
            </div>

            <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', fontSize: '0.75rem' }}>
                    <th style={{ padding: '20px' }}>FECHA / HORA</th>
                    <th>EMPRESA</th>
                    <th>USUARIO</th>
                    <th>RESPONSABLE</th>
                    <th>TIEMPO EN ESPERA</th>
                    <th>ESTADO</th>
                    <th style={{ textAlign: 'right', paddingRight: '20px' }}>CENTRO DE CONTROL</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t, idx) => {
                    const status = (t?.status || t?.estado || 'abierto').toLowerCase();
                    const isResolved = ['resuelto', 'cerrado'].includes(status);
                    
                    const endTime = isResolved 
                      ? (t.fechaResolucion ? new Date(t.fechaResolucion) : (t.respuestas && t.respuestas.length > 0 ? new Date(t.respuestas[t.respuestas.length-1]?.fecha || Date.now()) : new Date()))
                      : new Date();
                    
                    const ticketDate = t.fecha ? new Date(t.fecha) : new Date();
                    const diffHours = !isNaN(ticketDate.getTime()) && !isNaN(endTime.getTime()) ? Math.floor((endTime - ticketDate) / (1000 * 60 * 60)) : 0;
                    const empresa = t.nombreEmpresa || t.empresaNombre || companies.find(c => c.id === t.empresaId)?.name || 'S/N';
                    const usuarioIniciador = t.usuarioNombre || 'Administrador';
                    const estadoLabel = t.status || t.estado || 'abierto';

                    return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', transition: '0.3s' }} className="hover-row">
                      <td style={{ padding: '20px', fontSize: '0.8rem' }}>{!isNaN(ticketDate.getTime()) ? ticketDate.toLocaleString() : 'S/F'}</td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{empresa}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{usuarioIniciador}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,210,255,0.1)', color: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>
                             <User size={12} />
                          </div>
                          <span style={{ fontSize: '0.8rem' }}>{t.responsable || 'Sin asignar'}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: (diffHours > 24 && !isResolved) ? '#ef4444' : '#94a3b8' }}>
                         {diffHours < 1 ? '< 1 hora' : `${diffHours} horas`}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase',
                          backgroundColor: (getStatusColor(estadoLabel) || {bg: '#333', text: '#fff'}).bg,
                          color: (getStatusColor(estadoLabel) || {bg: '#333', text: '#fff'}).text
                        }}>{estadoLabel}</span>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setSelectedTicket(t)} className="secondary" style={{ padding: '6px 12px', fontSize: '0.7rem' }}>Supervisar</button>
                          {t.estado === 'cerrado' && (
                            <button onClick={() => updateTicketStatus(t.id || t.fecha, 'cerrado')} className="secondary" style={{ padding: '6px 12px', fontSize: '0.7rem', color: '#f59e0b' }}>Reabrir</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )})}
                  {tickets.length === 0 && <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No hay tickets en el sistema.</td></tr>}
                </tbody>
              </table>
            </div>

            {/* MODAL DE SUPERVISIÓN (READ-ONLY) */}
            {selectedTicket && (
               <div 
                onClick={() => setSelectedTicket(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, cursor: 'pointer' }}
               >
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="glass fade-up" 
                    style={{ width: '1000px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', borderRadius: '24px', cursor: 'default' }}
                  >
                     <div style={{ display: 'flex', justifyContent: 'space-between', padding: '30px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                        <div>
                           <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Centro de Diagnóstico y Supervisión</h3>
                           <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Ticket ID: {selectedTicket.id || 'N/A'} - {selectedTicket.empresaNombre || 'Cargando...'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                           <button 
                             onClick={() => handleRunDiagnostic(selectedTicket)}
                             className="primary"
                             style={{ padding: '8px 15px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                           >
                             {isRunningDiagnostic ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />} 
                             EJECUTAR DIAGNÓSTICO
                           </button>
                           <button 
                             onClick={() => setSelectedTicket(null)} 
                             style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                           >
                             <X size={18} />
                           </button>
                        </div>
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', flex: 1, overflow: 'hidden' }}>
                        {/* COLUMNA IZQUIERDA: CONVERSACIÓN */}
                        <div style={{ padding: '30px 40px', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                           <h4 style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '20px', letterSpacing: '1px' }}>HISTORIAL DE MENSAJES</h4>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{selectedTicket.usuarioNombre || 'Usuario'}</span>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(selectedTicket.fecha).toLocaleString()}</span>
                                 </div>
                                 <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>{selectedTicket.descripcion || selectedTicket.asunto}</div>
                              </div>

                              {selectedTicket.respuestas?.map((resp, ridx) => (
                                 <div key={ridx} style={{ alignSelf: resp.emisor === 'soporte' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                                    <div style={{ 
                                       background: resp.emisor === 'soporte' ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.05)', 
                                       padding: '15px', borderRadius: '15px',
                                       border: resp.emisor === 'soporte' ? '1px solid rgba(0,210,255,0.2)' : '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                       <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '5px' }}>{new Date(resp.fecha).toLocaleString()}</div>
                                       <div style={{ fontSize: '0.85rem' }}>{resp.texto}</div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* COLUMNA DERECHA: DIAGNÓSTICO */}
                        <div style={{ padding: '30px', background: 'rgba(0,0,0,0.2)', overflowY: 'auto' }}>
                           {!diagnosticData ? (
                              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: 0.5 }}>
                                 <Activity size={40} style={{ marginBottom: '15px' }} />
                                 <p style={{ fontSize: '0.8rem' }}>Haga clic en el botón superior para<br/>iniciar el diagnóstico técnico.</p>
                              </div>
                           ) : (
                              <div className="fade-in">
                                 {/* 1. AUTO-DIAGNOSTIC SUMMARY */}
                                 {diagnosticSummary && (
                                    <div style={{ 
                                       marginBottom: '20px', padding: '15px', borderRadius: '12px', 
                                       background: diagnosticSummary.score === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                                       border: `1px solid ${diagnosticSummary.score === 'ok' ? '#10b98133' : '#f59e0b33'}`
                                    }}>
                                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                          <HelpCircle size={16} color={diagnosticSummary.score === 'ok' ? '#10b981' : '#f59e0b'} />
                                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>ANÁLISIS INTELIGENTE</span>
                                       </div>
                                       {diagnosticSummary.summary.map((s, idx) => (
                                          <div key={idx} style={{ fontSize: '0.75rem', color: diagnosticSummary.score === 'ok' ? '#10b981' : '#f59e0b', marginBottom: '4px' }}>• {s}</div>
                                       ))}
                                    </div>
                                 )}

                                 {/* 2. USUARIO */}
                                 <div style={{ marginBottom: '25px' }}>
                                    <h5 style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '12px' }}>DIAGNÓSTICO DE USUARIO</h5>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                       <DiagnosticItem label="ID" value={diagnosticData.user.id} />
                                       <DiagnosticItem label="Estado" value={diagnosticData.user.status} color={diagnosticData.user.status === 'activo' ? '#10b981' : '#ef4444'} />
                                       <DiagnosticItem label="Login" value={new Date(diagnosticData.user.lastLogin).toLocaleTimeString()} />
                                       <DiagnosticItem label="Rol" value={diagnosticData.user.rol} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                       <button className="secondary" style={{ flex: 1, padding: '6px', fontSize: '0.65rem' }}>Ver Perfil</button>
                                       <button className="secondary" style={{ flex: 1, padding: '6px', fontSize: '0.65rem' }}>Validar Permisos</button>
                                    </div>
                                 </div>

                                 {/* 3. DISPOSITIVO */}
                                 <div style={{ marginBottom: '25px' }}>
                                    <h5 style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '12px' }}>DISPOSITIVO / APP</h5>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                       <DiagnosticItem label="Estado" value={diagnosticData.device.status} color="#10b981" />
                                       <DiagnosticItem label="Versión" value={diagnosticData.device.appVersion} />
                                       <DiagnosticItem label="Plataforma" value={diagnosticData.device.platform} />
                                       <DiagnosticItem label="Últ. Error" value={diagnosticData.device.lastError} color="#ef4444" />
                                    </div>
                                 </div>

                                 {/* 4. GPS */}
                                 <div style={{ marginBottom: '25px' }}>
                                    <h5 style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '12px' }}>TELEMETRÍA GPS</h5>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                       <DiagnosticItem label="Ping" value={new Date(diagnosticData.gps.lastPing).toLocaleTimeString()} />
                                       <DiagnosticItem label="Señal" value={diagnosticData.gps.signalLevel} />
                                       <DiagnosticItem label="Batería" value={diagnosticData.gps.battery} />
                                       <DiagnosticItem label="Estado" value={diagnosticData.gps.deviceStatus} />
                                    </div>
                                 </div>

                                 {/* 5. LOGS */}
                                 <div style={{ marginBottom: '25px' }}>
                                    <h5 style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '1px', marginBottom: '12px' }}>CONSOLE LOGS (CRÍTICO)</h5>
                                    <div style={{ 
                                       background: '#0a0a0a', padding: '10px', borderRadius: '8px', 
                                       fontFamily: 'monospace', fontSize: '0.6rem', maxHeight: '120px', overflowY: 'auto',
                                       border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px'
                                    }}>
                                       {diagnosticLogs.map((log, lidx) => (
                                          <div key={lidx} style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                             <span style={{ color: log.type === 'error' ? '#ef4444' : (log.type === 'warning' ? '#f59e0b' : '#38bdf8') }}>[{log.type.toUpperCase()}]</span>
                                             <span style={{ marginLeft: '5px', opacity: 0.5 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                             <div style={{ color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{log.message}</div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>

                                 {/* 6. ACCIONES DE RESOLUCIÓN */}
                                 <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                                    <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#00d2ff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                       <Settings2 size={16} /> ACCIONES DE RESOLUCIÓN
                                    </h4>

                                    {/* USUARIO */}
                                    <div style={{ marginBottom: '15px' }}>
                                       <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginBottom: '8px' }}>GESTIÓN DE USUARIO</div>
                                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                          <ActionButton label="Reset Clave" onClick={() => handleExecuteAction('reset_password', 'Resetear Contraseña')} icon={<KeyRound size={12}/>} primary />
                                          <ActionButton label="Cerrar Sesión" onClick={() => handleExecuteAction('force_logout', 'Forzar Cierre de Sesión')} icon={<LogOut size={12}/>} color="#f59e0b" />
                                          <ActionButton label="Activar/Desact." onClick={() => handleExecuteAction('toggle_status', 'Cambiar Estado de Usuario')} icon={<Power size={12}/>} />
                                          <ActionButton label="Permisos" onClick={() => handleExecuteAction('update_perms', 'Actualizar Permisos')} icon={<Shield size={12}/>} />
                                       </div>
                                    </div>

                                    {/* APP & SESIÓN */}
                                    <div style={{ marginBottom: '15px' }}>
                                       <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginBottom: '8px' }}>APPS & SESIÓN</div>
                                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                          <ActionButton label="Forzar Sync" onClick={() => handleExecuteAction('force_sync', 'Forzar Sincronización')} icon={<Activity size={12}/>} />
                                          <ActionButton label="Limpiar Caché" onClick={() => handleExecuteAction('clear_session', 'Limpiar Sesión')} icon={<Trash2 size={12}/>} color="#ef4444" />
                                       </div>
                                    </div>

                                    {/* FUNCIONALIDADES */}
                                    <div style={{ marginBottom: '15px' }}>
                                       <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginBottom: '8px' }}>FUNCIONALIDAD (QR / GPS)</div>
                                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                          <ActionButton label="Reprocesar QR" onClick={() => handleExecuteAction('reprocess_qr', 'Reprocesar QR')} icon={<Zap size={12}/>} />
                                          <ActionButton label="Ping GPS" onClick={() => handleExecuteAction('device_ping', 'Enviar Ping al Dispositivo')} icon={<Wifi size={12}/>} />
                                       </div>
                                    </div>

                                    {/* QUICK FIXES */}
                                    <div style={{ marginBottom: '5px' }}>
                                       <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginBottom: '8px' }}>QUICK FIXES</div>
                                       <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                                          <ActionButton label="Reproc. Evento" onClick={() => handleExecuteAction('reprocess_event', 'Reprocesar Evento')} icon={<Activity size={12}/>} />
                                          <ActionButton label="Reintentar" onClick={() => handleExecuteAction('retry_op', 'Reintentar Operación')} icon={<Power size={12}/>} />
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            )}
          </div>
        );
      case 'Reports':
        // 1. Filtrado de empresas y pagos aprobados
        const filteredCompanies = statsFilter === 'all' 
          ? companies.filter(c => c.status === 'activa' || c.status === 'activo') 
          : companies.filter(c => c.id === statsFilter);
          
        const approvedPayments = payments.filter(p => 
          (p.estado === 'approved' || p.status === 'Completado') && 
          (statsFilter === 'all' || p.empresaId === statsFilter || p.companyId === statsFilter)
        );

        // 2. Cálculo de Ganancias (Net)
        const totalRevenue = approvedPayments.reduce((acc, curr) => acc + (Number(curr.monto || curr.amount) || 0), 0);

        // 3. Cálculo de Consumo de Red (Simulado realista según carga operativa actual)
        const getCompanyNetwork = (c) => ({
          in: (Number(c.guards || 0) * 0.04).toFixed(1),
          out: (Number(c.guards || 0) * 0.01).toFixed(1)
        });

        const globalNetwork = filteredCompanies.reduce((acc, c) => {
          const usage = getCompanyNetwork(c);
          return {
            in: acc.in + parseFloat(usage.in),
            out: acc.out + parseFloat(usage.out)
          };
        }, { in: 0, out: 0 });

        // 4. Datos Mensuales para Gráfico
        const monthsLabels = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
        const monthlyRevenue = Array(12).fill(0);
        approvedPayments.forEach(p => {
          const d = new Date(p.fecha || p.date);
          if (!isNaN(d.getTime())) {
            monthlyRevenue[d.getMonth()] += Number(p.monto || p.amount);
          }
        });
        const maxMonthly = Math.max(...monthlyRevenue, 1);

        return (
          <div className="fade-in">
            {/* Header con Filtro */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Estadísticas y Análisis de Datos</h2>
                <p style={{ color: '#94a3b8' }}>Análisis profundo de tráfico, ganancias y rendimiento por empresa.</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <select
                  value={statsFilter}
                  onChange={(e) => setStatsFilter(e.target.value)}
                  style={{ padding: '10px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minWidth: '220px', outline: 'none' }}
                >
                  <option value="all">Todas las Empresas</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Top Grid: High Detail API Cards */}
            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
              <StatCard title="Empresas Activas" value={filteredCompanies.length} icon={<Building2 size={24} />} color="#00d2ff" trend="Licencia OK" />
              <StatCard title="Ganancias (Net)" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign size={24} />} color="#10b981" trend="USD Cobrados" />
              <StatCard title="Datos Bajada" value={`${globalNetwork.in.toFixed(1)} GB`} icon={<Activity size={24} />} color="#38bdf8" trend="Incoming Sync" />
              <StatCard title="Datos Subida" value={`${globalNetwork.out.toFixed(1)} GB`} icon={<TrendingUp size={24} />} color="#f59e0b" trend="Outgoing Traffic" />
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <div className="glass" style={{ padding: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={18} color="#00d2ff" /> Consumo de Ancho de Banda
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tiempo Real</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem' }}>Incoming Data (Sync)</span>
                      <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>{globalNetwork.in.toFixed(1)} GB</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min((globalNetwork.in / 10000) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #38bdf8, #2dd4bf)', boxShadow: '0 0 10px #38bdf8' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem' }}>Outgoing Data (Alerts)</span>
                      <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{globalNetwork.out.toFixed(1)} GB</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min((globalNetwork.out / 5000) * 100, 100)}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)', boxShadow: '0 0 10px #f59e0b' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass" style={{ padding: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <TrendingUp size={18} color="#10b981" /> Rendimiento de Facturación
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Análisis Anual</div>
                </div>

                <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  {monthlyRevenue.map((val, i) => (
                    <div 
                      key={i} 
                      title={`${monthsLabels[i]}: $${val} USD`}
                      style={{ 
                        flex: 1, 
                        height: `${(val / maxMonthly) * 100}%`, 
                        background: 'rgba(16, 185, 129, 0.2)', 
                        borderRadius: '4px 4px 0 0', 
                        borderTop: '2px solid #10b981', 
                        transition: '0.3s' 
                      }} 
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.65rem', color: '#94a3b8' }}>
                  {monthsLabels.filter((_, i) => i % 2 === 0).map(m => <span key={m}>{m}</span>)}
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: '25px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} color="#00d2ff" /> Reporte Detallado de Operación
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', textAlign: 'left' }}>
                    <th style={{ padding: '15px' }}>EMPRESA</th>
                    <th>PLAN ACTIVO</th>
                    <th>INGRESOS</th>
                    <th>CONSUMO RED</th>
                    <th>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                      {filteredCompanies.map(c => {
                        const usage = getCompanyNetwork(c);
                        const revenue = approvedPayments
                          .filter(p => p.empresaId === c.id || p.companyId === c.id)
                          .reduce((acc, curr) => acc + (Number(curr.monto || curr.amount) || 0), 0);
                        
                        // Defensive plan access
                        const planKey = (c.plan || 'basico').toUpperCase();
                        const planInfo = PLANES[planKey] || PLANES.BASICO;

                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '15px', fontWeight: 'bold' }}>{c.name}</td>
                            <td style={{ fontSize: '0.85rem' }}>
                              <span style={{ color: planInfo.color }}>{planKey}</span>
                            </td>
                            <td style={{ fontWeight: 'bold', color: '#10b981' }}>${revenue.toLocaleString()}</td>
                            <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{usage.in} / {usage.out} GB</td>
                            <td>
                              <span style={{
                                padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold',
                                backgroundColor: getStatusColor(c.status).bg, color: getStatusColor(c.status).text
                              }}>
                                {(c.status || 'activa').toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Módulo {activeTab} en construcción.</div>;

    }
  };


  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#070c1a', color: 'white', overflow: 'hidden', position: 'relative', fontFamily: "'Outfit', sans-serif" }}>

      {/* 1. LEFT SIDEBAR */}
      <aside className="mobile-hide" style={{
        width: isSidebarOpen ? '280px' : '90px',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(180deg, #0f172a 0%, #070c1a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        zIndex: 100
      }}>
        <div style={{ padding: '30px 20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/logo-centinela.png"
              alt="Centinela Logo"
              style={{
                width: isSidebarOpen ? '50px' : '40px',
                height: isSidebarOpen ? '50px' : '40px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px rgba(0,210,255,0.3))',
                transition: 'all 0.4s ease'
              }}
            />
          </div>
          {isSidebarOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{
                fontWeight: '950',
                letterSpacing: '2px',
                fontSize: '1.25rem',
                lineHeight: '1',
                background: 'linear-gradient(to right, #00d2ff, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: "'Outfit', sans-serif"
              }}>CENTINELA</span>
              <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>Admin Control Center</span>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, marginTop: '20px', overflowY: 'auto', paddingRight: '5px' }} className="custom-scrollbar">
          <SidebarItem icon={<BarChart size={20} />} label="Panel" active={activeTab === 'Estadísticas'} onClick={() => setActiveTab('Estadísticas')} isOpen={isSidebarOpen} />
          <SidebarItem icon={<Building2 size={20} />} label="Empresas" active={activeTab === 'Empresas'} onClick={() => setActiveTab('Empresas')} isOpen={isSidebarOpen} />
          <SidebarItem icon={<Users size={20} />} label="Usuarios" active={activeTab === 'Usuarios'} onClick={() => setActiveTab('Usuarios')} isOpen={isSidebarOpen} />
          <SidebarItem icon={<Globe size={20} />} label="Licencias" active={activeTab === 'Licencias'} isOpen={isSidebarOpen} onClick={() => setActiveTab('Licencias')} />
          <SidebarItem icon={<BadgeCheck size={20} />} label="Validación" active={activeTab === 'Validacion'} onClick={() => setActiveTab('Validacion')} isOpen={isSidebarOpen} />
          <SidebarItem icon={<CreditCard size={20} />} label="Facturación" active={activeTab === 'Pagos'} onClick={() => setActiveTab('Pagos')} isOpen={isSidebarOpen} />
          <SidebarItem icon={<TrendingUp size={20} />} label="Estadísticas" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} isOpen={isSidebarOpen} />
          <SidebarItem icon={<HelpCircle size={20} />} label="Soporte" active={activeTab === 'Soporte'} onClick={() => setActiveTab('Soporte')} isOpen={isSidebarOpen} />
          <SidebarItem icon={<Settings size={20} />} label="Configuración" active={activeTab === 'Configuración'} onClick={() => setActiveTab('Configuración')} isOpen={isSidebarOpen} />
        </nav>

        <div style={{ padding: '30px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{
            padding: '15px', borderRadius: '15px', background: 'rgba(255,255,255,0.02)',
            display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
          }} onClick={handleLogout}>
            <LogOut size={20} color="#ef4444" />
            {isSidebarOpen && <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ef4444' }}>Cerrar Sesión</span>}
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* HEADER */}
        <header style={{
          height: '80px', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(7, 12, 26, 0.4)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)',
          zIndex: 90
        }}>
          {/* Search Bar */}
          <div style={{ position: 'relative', width: '400px' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Busca empresas, facturas o usuarios..."
              style={{
                width: '100%', padding: '12px 12px 12px 45px', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: 'white', fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Right Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            <div style={{ textAlign: 'right', paddingLeft: '25px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{user?.nombre || 'Administrador'}</div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div style={{ flex: 1, padding: '30px 40px', overflowY: 'auto', background: 'radial-gradient(circle at top right, rgba(0,210,255,0.05), transparent 400px)' }}>
          {renderContent()}
        </div>

        {/* Mobile Navigation Bar */}
        <div className="glass" style={{
          position: 'fixed', bottom: '15px', left: '15px', right: '15px',
          height: '70px', justifyContent: 'space-around',
          alignItems: 'center', zIndex: 50, borderTop: '1px solid rgba(255,255,255,0.1)',
          display: window.innerWidth <= 768 ? 'flex' : 'none'
        }}>
          <NavIcon icon={<BarChart size={22} />} active={activeTab === 'Estadísticas'} onClick={() => setActiveTab('Estadísticas')} />
          <NavIcon icon={<Building2 size={22} />} active={activeTab === 'Empresas'} onClick={() => setActiveTab('Empresas')} />
          <NavIcon icon={<CreditCard size={22} />} active={activeTab === 'Pagos'} onClick={() => setActiveTab('Pagos')} />
          <NavIcon icon={<LogOut size={22} color="#ef4444" />} onClick={handleLogout} />
        </div>
        {/* MODAL PROPUESTA POR EMAIL */}
        {showProposalModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(15px)' }}>
            <div className="glass fade-in" style={{ width: '500px', padding: '40px' }}>
              <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={24} color="#00d2ff" /> Enviar Propuesta por Email
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label>Empresa Destino</label>
                  <input className="input-full" value={proposalData.companyName} onChange={e => setProposalData({ ...proposalData, companyName: e.target.value })} placeholder="Nombre de la empresa" />
                </div>
                <div>
                  <label>Email de Contacto</label>
                  <input className="input-full" type="email" value={proposalData.email} onChange={e => setProposalData({ ...proposalData, email: e.target.value })} placeholder="ejemplo@empresa.com" />
                </div>
                <div>
                  <label>Plan Sugerido</label>
                  <select className="input-full" value={proposalData.planId} onChange={e => setProposalData({ ...proposalData, planId: e.target.value })} style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px' }}>
                    {Object.values(PLANES).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label>Cant. Guardias</label>
                    <input className="input-full" type="number" value={proposalData.guards} onChange={e => setProposalData({ ...proposalData, guards: e.target.value })} placeholder="Opcional" />
                  </div>
                  <div>
                    <label>Usuarios Pánico</label>
                    <input className="input-full" type="number" value={proposalData.panicUsers} onChange={e => setProposalData({ ...proposalData, panicUsers: e.target.value })} placeholder="Opcional" />
                  </div>
                </div>
                <div>
                  <label>Mensaje Personalizado</label>
                  <textarea className="input-full" value={proposalData.message} onChange={e => setProposalData({ ...proposalData, message: e.target.value })} style={{ minHeight: '80px' }} placeholder="Escribe un mensaje..." />
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button
                    className="primary"
                    style={{ flex: 1 }}
                    onClick={async () => {
                      const res = await enviarPropuesta(proposalData);
                      if (res) {
                        alert(`¡Propuesta enviada con éxito a ${proposalData.email}!`);
                        setShowProposalModal(false);
                      } else {
                        alert("Error al enviar la propuesta. Verifica la conexión.");
                      }
                    }}
                  >Enviar Propuesta</button>
                  <button className="secondary" style={{ flex: 1 }} onClick={() => setShowProposalModal(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals Tactical Style */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(15px)' }}>
          <div className="glass fade-in" style={{ width: '550px', padding: '40px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={24} color="#00d2ff" />
              {editingCompany ? 'Editar Empresa' : 'Registrar Nueva Empresa'}
            </h2>
            <form onSubmit={handleCreateOrUpdateCompany}>
              <div style={{ marginBottom: '20px' }}>
                <label>Nombre de la Empresa</label>
                <input required className="input-full" value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>Dirección Legal (Geolocalización)</label>
                <input required placeholder="Ej: Av. 9 de Julio 1234, CABA, Argentina" className="input-full" value={newCompany.address} onChange={e => setNewCompany({ ...newCompany, address: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div><label>Titular Responsable</label><input required className="input-full" value={newCompany.titular} onChange={e => setNewCompany({ ...newCompany, titular: e.target.value })} /></div>
                <div><label>DNI / CUIT</label><input required className="input-full" value={newCompany.dni} onChange={e => setNewCompany({ ...newCompany, dni: e.target.value })} /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div><label>Email Corporativo</label><input type="email" required className="input-full" value={newCompany.email} onChange={e => setNewCompany({ ...newCompany, email: e.target.value })} /></div>
                <div><label>Email Acceso App</label><input type="email" className="input-full" value={newCompany.appEmail} placeholder="Para login en App" onChange={e => setNewCompany({ ...newCompany, appEmail: e.target.value })} /></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div><label>Teléfono Contacto</label><input type="tel" required className="input-full" value={newCompany.telefono} onChange={e => setNewCompany({ ...newCompany, telefono: e.target.value })} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => handleResetCompanyPassword(editingCompany?.id, editingCompany?.appEmail || editingCompany?.email)}
                    className="secondary"
                    style={{ padding: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    disabled={!editingCompany}
                  >
                    <Zap size={14} color="#00d2ff" /> Blanquear Contraseña
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <label>Plan de Servicio</label>
                  <select value={newCompany.plan} onChange={e => setNewCompany({ ...newCompany, plan: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}>
                    {Object.values(PLANES).map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
                <div><label>Vencimiento</label><input type="date" required className="input-full" value={newCompany.expiryDate} onChange={e => setNewCompany({ ...newCompany, expiryDate: e.target.value })} /></div>
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                <button type="submit" className="primary" style={{ flex: 1, padding: '15px' }}>{isSaving ? <Loader2 className="animate-spin" /> : (editingCompany ? 'Guardar Cambios' : 'Crear Empresa')}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingCompany(null); }} className="secondary" style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(15px)' }}>
          <div className="glass fade-in" style={{ width: '450px', padding: '40px' }}>
            <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard size={24} color="#10b981" /> Registrar Pago
            </h2>
            <form onSubmit={handleRegisterPayment}>
              <div style={{ marginBottom: '20px' }}>
                <label>Empresa</label>
                <select required value={newPayment.companyId} onChange={e => setNewPayment({ ...newPayment, companyId: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}>
                  <option value="">Seleccione...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Monto (USD)</label>
                <input type="number" required className="input-full" value={newPayment.amount} onChange={e => setNewPayment({ ...newPayment, amount: e.target.value })} />
              </div>
              <div style={{ marginBottom: '30px' }}>
                <label>Fecha</label>
                <input type="date" required className="input-full" value={newPayment.date} onChange={e => setNewPayment({ ...newPayment, date: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="submit" className="primary" style={{ flex: 1 }}>{isSaving ? <Loader2 className="animate-spin" /> : 'Confirmar Pago'}</button>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="secondary" style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, backdropFilter: 'blur(15px)' }}>
          <div className="glass fade-in" style={{ width: '450px', padding: '40px' }}>
            <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={24} color="#8b5cf6" /> {editingUser ? 'Editar Usuario' : 'Crear Acceso Admin'}
            </h2>
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '20px' }}>
                <label>Nombre Completo</label>
                <input type="text" required className="input-full" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label>Email</label>
                <input type="email" required className="input-full" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div style={{ marginBottom: '30px' }}>
                <label>Empresa</label>
                <select required value={newUser.companyId} onChange={e => setNewUser({ ...newUser, companyId: e.target.value })} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}>
                  <option value="">Seleccione...</option>
                  {companies.filter(c => c.status?.toLowerCase() === 'activo' || c.status?.toLowerCase() === 'activa').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button type="submit" className="primary" style={{ flex: 1 }}>{isSaving ? <Loader2 className="animate-spin" /> : (editingUser ? 'Guardar Cambios' : 'Crear Admin')}</button>
                <button type="button" onClick={() => { setShowUserModal(false); setEditingUser(null); setNewUser({ name: '', email: '', companyId: '', role: 'Admin Empresa' }); }} className="secondary" style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSupportUserModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass fade-in" style={{ width: '450px', padding: '40px' }}>
            <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Headphones size={24} color="#00d2ff" /> {editingSupportUser ? 'Gestionar Analista' : 'Nuevo Analista de Soporte'}
            </h2>
            <form onSubmit={editingSupportUser ? handleUpdateSupportUser : handleCreateSupportUser}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label>Nombre</label>
                  <input 
                    required 
                    className="input-full" 
                    value={editingSupportUser ? (editingSupportUser.name || editingSupportUser.nombre || '') : newSupportUser.nombre} 
                    onChange={e => editingSupportUser ? setEditingSupportUser({...editingSupportUser, name: e.target.value, nombre: e.target.value}) : handleSupportNameChange('nombre', e.target.value)} 
                  />
                </div>
                <div>
                  <label>Apellido</label>
                  <input 
                    required 
                    className="input-full" 
                    value={editingSupportUser ? (editingSupportUser.surname || editingSupportUser.apellido || '') : newSupportUser.apellido} 
                    onChange={e => editingSupportUser ? setEditingSupportUser({...editingSupportUser, surname: e.target.value, apellido: e.target.value}) : handleSupportNameChange('apellido', e.target.value)} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                    <label>Email Corporativo</label>
                    <input 
                        type="email" 
                        required 
                        className="input-full" 
                        value={editingSupportUser ? (editingSupportUser.email || '') : newSupportUser.email} 
                        onChange={e => editingSupportUser ? setEditingSupportUser({...editingSupportUser, email: e.target.value}) : setNewSupportUser({...newSupportUser, email: e.target.value})} 
                    />
                </div>
                <div>
                    <label>Email Personal</label>
                    <input 
                        type="email" 
                        className="input-full" 
                        placeholder="Opcional"
                        value={editingSupportUser ? (editingSupportUser.emailPersonal || '') : newSupportUser.emailPersonal} 
                        onChange={e => editingSupportUser ? setEditingSupportUser({...editingSupportUser, emailPersonal: e.target.value}) : setNewSupportUser({...newSupportUser, emailPersonal: e.target.value})} 
                    />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                    <label>Teléfono Corp.</label>
                    <input 
                        type="tel" 
                        className="input-full" 
                        value={editingSupportUser ? (editingSupportUser.telefono || '') : newSupportUser.telefono} 
                        onChange={e => editingSupportUser ? setEditingSupportUser({...editingSupportUser, telefono: e.target.value}) : setNewSupportUser({...newSupportUser, telefono: e.target.value})} 
                    />
                </div>
                <div>
                    <label>Teléfono Personal</label>
                    <input 
                        type="tel" 
                        className="input-full" 
                        value={editingSupportUser ? (editingSupportUser.telefonoPersonal || '') : newSupportUser.telefonoPersonal} 
                        onChange={e => editingSupportUser ? setEditingSupportUser({...editingSupportUser, telefonoPersonal: e.target.value}) : setNewSupportUser({...newSupportUser, telefonoPersonal: e.target.value})} 
                    />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <div>
                  <label>DNI</label>
                  <input 
                    className="input-full" 
                    value={editingSupportUser ? (editingSupportUser.dni || '') : newSupportUser.dni} 
                    onChange={e => editingSupportUser ? setEditingSupportUser({...editingSupportUser, dni: e.target.value}) : setNewSupportUser({...newSupportUser, dni: e.target.value})} 
                  />
                </div>
                <div>
                  <label>Legajo</label>
                  <input 
                    className="input-full" 
                    value={editingSupportUser ? (editingSupportUser.legajo || '') : newSupportUser.legajo} 
                    onChange={e => editingSupportUser ? setEditingSupportUser({...editingSupportUser, legajo: e.target.value}) : setNewSupportUser({...newSupportUser, legajo: e.target.value})} 
                  />
                </div>
              </div>

              {editingSupportUser && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                         <label style={{ fontSize: '0.65rem' }}>SEGURIDAD Y ACCESO</label>
                         {editingSupportUser.mustChangePassword && <span style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 'bold' }}>CAMBIO PENDIENTE</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                         <div style={{ flex: 1, position: 'relative' }}>
                            <input 
                                type={showSupportPassword ? "text" : "password"} 
                                readOnly 
                                value={editingSupportUser.password || '********'} 
                                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', marginTop: 0, paddingRight: '40px', fontSize: '0.8rem', outline: 'none' }}
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowSupportPassword(!showSupportPassword)}
                                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                {showSupportPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                         </div>
                         <button 
                            type="button"
                            onClick={() => handleResetSupportPassword(editingSupportUser.id || editingSupportUser.uid)}
                            className="secondary"
                            style={{ padding: '0 15px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                         >
                            <KeyRound size={14} /> BLANQUEAR
                         </button>
                    </div>
                  </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button type="submit" className="primary" style={{ flex: 1, padding: '15px' }}>
                    {isCreatingSupportUser ? <Loader2 className="animate-spin" /> : (editingSupportUser ? 'Guardar Cambios' : 'Crear Analista')}
                </button>
                
                {editingSupportUser && (
                    <button 
                        type="button" 
                        onClick={() => handleDeleteSupportUser(editingSupportUser.id || editingSupportUser.uid)} 
                        className="secondary" 
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                    >
                        <Trash2 size={16} /> ELIMINAR ANALISTA
                    </button>
                )}
                
                <button 
                    type="button" 
                    onClick={() => {
                        setShowSupportUserModal(false);
                        setEditingSupportUser(null);
                        setShowSupportPassword(false);
                    }} 
                    className="secondary" 
                    style={{ flex: 1 }}
                >
                    Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .input-full { width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); borderRadius: 10px; color: white; margin-top: 8px; outline: none; }
        .input-full:focus { border-color: #00d2ff; background: rgba(0,210,255,0.02); }
        label { color: #94a3b8; font-size: 0.8rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
        select option { background: #070c1a; color: white; }
      `}</style>

      <>
        {/* BOTÃ“N PAPELERA DISCRETO EN SIDEBAR O ESQUINA */}
        <button
          onClick={() => setShowTrashModal(true)}
          style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(239,68,68,0.4)', border: 'none', cursor: 'pointer', zIndex: 1000 }}
        >
          <Trash2 size={24} />
          {trashItems.length > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: 'white', color: '#ef4444', fontSize: '0.7rem', fontWeight: 'bold', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ef4444' }}>{trashItems.length}</span>}
        </button>

        {/* MODAL PAPELERA MASTER */}
        {showTrashModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div className="glass fade-up" style={{ width: '800px', padding: '40px', borderRadius: '24px', border: '1px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Trash2 color="#ef4444" /> Papelera de Reciclaje Maestra</h3>
                <button onClick={() => setShowTrashModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}><X /></button>
              </div>

              <div style={{ maxHeight: '450px', overflowY: 'auto', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                      <th style={{ padding: '12px' }}>TIPO</th>
                      <th style={{ padding: '12px' }}>NOMBRE / DESCRIPCIÃ“N</th>
                      <th style={{ padding: '12px' }}>ELIMINADO EL</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px', background: item.originalType === 'company' ? 'rgba(0,210,255,0.1)' : 'rgba(245,158,11,0.1)', color: item.originalType === 'company' ? '#00d2ff' : '#f59e0b', fontWeight: 'bold' }}>
                            {item.originalType?.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold' }}>{item.name || item.nombre}</div>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{item.email}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '0.75rem' }}>{new Date(item.deletedAt).toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleRestoreFromTrash(item)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.7rem', cursor: 'pointer' }}>RESTAURAR</button>
                            <button onClick={() => handlePermanentDeleteFromTrash(item)} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {trashItems.length === 0 && (
                      <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>La papelera maestra está vacía.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setShowTrashModal(false)} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer' }}>CERRAR PAPELERA</button>
            </div>
          </div>
        )}
      </>
    </div>
  );
};

const ChangeView = ({ companies }) => {
  const leafletMap = useMap();

  useEffect(() => {
    if (!companies || companies.length === 0) return;

    // Buscamos si hay alguna empresa editada o creada con coordenadas nuevas
    // Ordenamos por ID descendente para priorizar la más reciente
    const lastWithCoords = [...companies].sort((a, b) => {
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idB - idA;
    }).find(c => !isNaN(parseFloat(c.lat)));

    if (lastWithCoords && leafletMap) {
      leafletMap.flyTo([parseFloat(lastWithCoords.lat), parseFloat(lastWithCoords.lng)], 13, {
        duration: 1.5
      });
    }
  }, [companies.length, leafletMap]);

  return null;
};

const SidebarItem = ({ icon, label, active, onClick, isOpen }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 25px',
      cursor: 'pointer', transition: 'all 0.3s',
      background: active ? 'linear-gradient(90deg, rgba(0,210,255,0.1) 0%, transparent 100%)' : 'transparent',
      color: active ? '#00d2ff' : '#94a3b8',
      borderLeft: active ? '4px solid #00d2ff' : '4px solid transparent',
      margin: '4px 10px',
      borderRadius: '0 10px 10px 0',
      boxShadow: active ? '0 0 15px rgba(0,210,255,0.05)' : 'none'
    }}
  >
    <div style={{ filter: active ? 'drop-shadow(0 0 5px #00d2ff)' : 'none' }}>{icon}</div>
    {isOpen && <span style={{ fontWeight: active ? 'bold' : '500', fontSize: '0.9rem' }}>{label}</span>}
  </div>
);

// --- BILLING SUBCOMPONENTS (REFACTORED OUTSIDE TO PREVENT FLICKERING) ---

const PaymentConfigPanel = ({ isSaving, setIsSaving }) => {
   const [config, setConfig] = useState({
      mp_access_token: '', mp_public_key: '', modo: 'sandbox', webhook_url: '',
      bank_name: 'Santander', bank_account_usd: '', bank_holder: '', bank_cbu_alias: ''
   });

   useEffect(() => {
      const loadConfig = async () => {
         const data = await db.obtenerConfiguracionPagos();
         setConfig(prev => ({ ...prev, ...data }));
      };
      loadConfig();
   }, []);

   const handleSaveConfig = async (e) => {
      if (e) e.preventDefault();
      setIsSaving(true);
      try {
         const result = await db.guardarConfiguracionPagos(config);
         if (result && (result.success || !result.error)) {
            alert("✅ Configuración de pagos guardada correctamente.");
            // Recargar datos para confirmar persistencia
            const freshData = await db.obtenerConfiguracionPagos();
            if (freshData && Object.keys(freshData).length > 0) {
               setConfig(prev => ({ ...prev, ...freshData }));
            }
         } else {
            throw new Error(result?.error || "Error desconocido del servidor");
         }
      } catch (error) {
         console.error("Error saving payment config:", error);
         alert("❌ Error al guardar: " + (error.message || "Verifique la conexión"));
      } finally {
         setIsSaving(false);
      }
   };

   return (
      <div className="glass fade-in" style={{ padding: '40px', maxWidth: '700px' }}>
         <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings2 size={24} color="#00d2ff" /> Configuración Global de Facturación
         </h3>
         <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ padding: '20px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '15px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
               <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#00d2ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} /> PASARELA MERCADO PAGO
               </h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div>
                     <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Access Token</label>
                     <input 
                        type="password" 
                        className="input-full" 
                        value={config.mp_access_token} 
                        onChange={e => setConfig({...config, mp_access_token: e.target.value})}
                        placeholder="APP_USR-..."
                     />
                  </div>
                  <div>
                     <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Public Key</label>
                     <input 
                        className="input-full" 
                        value={config.mp_public_key} 
                        onChange={e => setConfig({...config, mp_public_key: e.target.value})}
                        placeholder="APP_USR-..."
                     />
                  </div>
               </div>
               <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div 
                     onClick={() => setConfig({...config, modo: config.modo === 'prod' ? 'sandbox' : 'prod'})}
                     style={{ 
                        width: '50px', height: '26px', background: config.modo === 'prod' ? '#10b981' : '#334155', 
                        borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '0.3s' 
                     }}
                  >
                     <div style={{ 
                        width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                        position: 'absolute', top: '3px', left: config.modo === 'prod' ? '27px' : '3px', transition: '0.3s'
                     }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: config.modo === 'prod' ? '#10b981' : '#94a3b8' }}>
                     {config.modo === 'prod' ? 'PRODUCCIÓN (PAGOS REALES)' : 'SANDBOX (PRUEBAS)'}
                  </span>
               </div>
            </div>

            <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '15px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
               <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} /> TRANSFERENCIA BANCARIA (USD)
               </h4>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                     <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Banco</label>
                     <input 
                        className="input-full" 
                        value={config.bank_name} 
                        onChange={e => setConfig({...config, bank_name: e.target.value})}
                        placeholder="Ej: Santander"
                     />
                  </div>
                  <div>
                     <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Titular</label>
                     <input 
                        className="input-full" 
                        value={config.bank_holder} 
                        onChange={e => setConfig({...config, bank_holder: e.target.value})}
                        placeholder="Nombre Cuenta"
                     />
                  </div>
               </div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                  <div>
                     <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Número de Cuenta</label>
                     <input 
                        className="input-full" 
                        value={config.bank_account_usd} 
                        onChange={e => setConfig({...config, bank_account_usd: e.target.value})}
                        placeholder="Account Number"
                     />
                  </div>
                  <div>
                     <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CBU / Alias</label>
                     <input 
                        className="input-full" 
                        value={config.bank_cbu_alias} 
                        onChange={e => setConfig({...config, bank_cbu_alias: e.target.value})}
                        placeholder="Alias o CBU"
                     />
                  </div>
               </div>
            </div>

            <button disabled={isSaving} className="primary" style={{ padding: '18px', fontSize: '1rem', fontWeight: 'bold' }}>
               {isSaving ? <Loader2 size={24} className="animate-spin" /> : 'Guardar Todos los Cambios'}
            </button>
         </form>
      </div>
   );
};

const SecurityConfigPanel = () => {
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passData.new !== passData.confirm) {
            alert("Las contraseñas nuevas no coinciden.");
            return;
        }
        if (passData.new.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);
        try {
            const res = await db.cambiarAdminPassword(passData.current, passData.new);
            if (res && res.success) {
                alert("✅ Contraseña actualizada correctamente. Use su nueva clave en el próximo ingreso.");
                setPassData({ current: '', new: '', confirm: '' });
            } else {
                alert("❌ Error: " + (res?.error || "Verifique su contraseña actual"));
            }
        } catch (err) {
            alert("❌ Error al conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass fade-in" style={{ padding: '40px', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={24} color="#ef4444" /> Seguridad de Cuenta Maestra
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '25px' }}>
                Actualice su contraseña de acceso al Panel de SuperAdmin. Use una combinación fuerte de letras, números y símbolos.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Contraseña Actual</label>
                    <input 
                        type="password"
                        className="input-full"
                        required
                        value={passData.current}
                        onChange={e => setPassData({...passData, current: e.target.value})}
                    />
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />
                <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nueva Contraseña</label>
                    <input 
                        type="password"
                        className="input-full"
                        required
                        value={passData.new}
                        onChange={e => setPassData({...passData, new: e.target.value})}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Confirmar Nueva Contraseña</label>
                    <input 
                        type="password"
                        className="input-full"
                        required
                        value={passData.confirm}
                        onChange={e => setPassData({...passData, confirm: e.target.value})}
                    />
                </div>
                <button disabled={loading} className="primary" style={{ padding: '15px', background: '#ef4444', border: 'none', boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)' }}>
                    {loading ? <Loader2 size={24} className="animate-spin" /> : 'Actualizar Contraseña Maestra'}
                </button>
            </form>
        </div>
    );
};

const SubscriptionsPanel = ({ companies, getStatusColor }) => {
   const [subs, setSubs] = useState([]);
   useEffect(() => {
      const load = async () => setSubs(await db.obtenerSuscripciones());
      load();
   }, []);

   return (
      <div className="glass fade-in" style={{ padding: '0', overflow: 'hidden' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '20px', textAlign: 'left' }}>EMPRESA</th>
                  <th style={{ padding: '20px', textAlign: 'left' }}>PLAN ADQUIRIDO</th>
                  <th style={{ padding: '20px', textAlign: 'left' }}>ESTADO</th>
                  <th style={{ padding: '20px', textAlign: 'left' }}>PRÓXIMO COBRO</th>
                  <th style={{ padding: '20px', textAlign: 'right' }}>ACCIONES</th>
               </tr>
            </thead>
            <tbody>
               {Array.isArray(subs) && subs.map(s => {
                  const companyName = companies.find(c => c.id === s.empresaId)?.name || 'S/E';
                  const planName = PLANES[s.planId?.toUpperCase()]?.nombre || s.planId;
                  return (
                     <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '20px' }}><div style={{fontWeight: 'bold'}}>{companyName}</div><div style={{fontSize: '0.65rem', color: '#94a3b8'}}>ID: {s.empresaId}</div></td>
                        <td style={{ padding: '20px' }}>
                           <span style={{ fontSize: '0.75rem', background: 'rgba(0,210,255,0.05)', padding: '4px 10px', borderRadius: '6px', color: '#00d2ff', fontWeight: 'bold' }}>{planName?.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '20px' }}>
                           <span style={{ color: getStatusColor(s.estado).text }}>{s.estado?.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '20px', color: '#cbd5e1', fontSize: '0.85rem' }}>
                           {s.fechaProximoPago && !isNaN(new Date(s.fechaProximoPago).getTime()) 
                              ? new Date(s.fechaProximoPago).toLocaleDateString() 
                              : 'Pendiente'}
                        </td>
                        <td style={{ padding: '20px', textAlign: 'right' }}>
                           <button className="secondary" style={{ padding: '5px 10px', fontSize: '0.7rem' }}>Gestionar</button>
                        </td>
                     </tr>
                  );
               })}
               {(!subs || subs.length === 0) && <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay suscripciones activas en el sistema.</td></tr>}
            </tbody>
         </table>
      </div>
   );
};

const PaymentHistoryPanel = ({ companies }) => {
  const [history, setHistory] = useState([]);
  useEffect(() => {
      const load = async () => setHistory(await db.obtenerHistorialPagos());
      load();
  }, []);

  const handleDownloadReceipt = (p) => {
    const company = companies.find(c => c.id === p.empresaId);
    const printWindow = window.open('', '_blank');
    const planName = PLANES[p.planId?.toUpperCase()]?.nombre || p.planId || 'Servicio Centinela';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Comprobante de Pago - Centinela</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
            body { font-family: 'Outfit', sans-serif; padding: 60px; color: #0f172a; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 30px; margin-bottom: 40px; }
            .logo { font-size: 28px; font-weight: 900; color: #3b82f6; letter-spacing: -1px; }
            .receipt-title { font-size: 14px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 2px; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 50px; }
            .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 900; margin-bottom: 8px; letter-spacing: 0.5px; }
            .value { font-size: 16px; font-weight: 700; color: #1e293b; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
            .table th { background: #f8fafc; text-align: left; padding: 15px; border-bottom: 2px solid #e2e8f0; font-size: 11px; color: #64748b; text-transform: uppercase; }
            .table td { padding: 20px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .total-box { background: #0f172a; color: white; padding: 30px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; }
            .total-label { font-size: 14px; font-weight: 400; opacity: 0.8; }
            .total-amount { font-size: 32px; font-weight: 900; }
            .footer { margin-top: 100px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #f1f5f9; padding-top: 30px; }
            .status-badge { display: inline-block; padding: 4px 12px; borderRadius: 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; background: #dcfce7; color: #166534; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CENTINELA SaaS</div>
            <div class="receipt-title">Comprobante Administrativo</div>
          </div>
          
          <div class="details">
            <div>
              <div class="label">CLIENTE REGISTRADO</div>
              <div class="value">\${company?.name || 'Cliente Centinela'}</div>
              <div style="margin-top: 25px;">
                <div class="label">FECHA DE VALUACIÓN</div>
                <div class="value">\${new Date(p.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="label">NÚMERO DE OPERACIÓN</div>
              <div class="value">ADM-\${p.id?.substring(0,10).toUpperCase() || 'EXTERNAL'}</div>
              <div style="margin-top: 25px;">
                <div class="label">ESTADO DEL PAGO</div>
                <div class="status-badge">RECAUDACIÓN CONFIRMADA</div>
              </div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>CONCEPTO FACTURADO</th>
                <th>ID CLIENTE</th>
                <th style="text-align: right;">VALOR NETO</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style="font-weight: 700; margin-bottom: 5px;">Licencia Centinela 2.0 - \${planName}</div>
                  <div style="font-size: 12px; color: #64748b;">Mantenimiento de infraestructura y soporte por 30 días.</div>
                </td>
                <td>\${p.empresaId || 'S/ID'}</td>
                <td style="text-align: right; font-weight: 700;">$\${p.monto} USD</td>
              </tr>
            </tbody>
          </table>

          <div class="total-box">
             <div class="total-label">Total Liquidado en Cuenta</div>
             <div class="total-amount">$\${p.monto} USD</div>
          </div>

          <div class="footer">
            <p>Documento para uso administrativo de Centinela SaaS y auditoría de la empresa cliente.</p>
            <p>© \${new Date().getFullYear()} Centinela Control Global - Sistema de Gestión de Seguridad</p>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => { 
                window.print();
                window.onafterprint = () => window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
      <div className="glass fade-in" style={{ padding: '0', overflow: 'hidden' }}>
         <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
               <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
                  <th style={{ padding: '20px', textAlign: 'left' }}>FECHA</th>
                  <th style={{ padding: '20px', textAlign: 'left' }}>EMPRESA</th>
                  <th style={{ padding: '20px', textAlign: 'left' }}>MONTO</th>
                  <th style={{ padding: '20px', textAlign: 'left' }}>REFERENCIA DE PAGO</th>
                  <th style={{ padding: '20px', textAlign: 'left' }}>ESTADO / FACTURA</th>
               </tr>
            </thead>
            <tbody>
               {Array.isArray(history) && history.map(p => {
                  const company = companies.find(c => c.id === p.empresaId);
                  return (
                     <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '20px', fontSize: '0.8rem' }}>
                           {p.fecha && !isNaN(new Date(p.fecha).getTime()) 
                              ? new Date(p.fecha).toLocaleString() 
                              : 'Fecha pendiente'}
                        </td>
                        <td style={{ padding: '20px' }}><b>{company?.name || 'S/E'}</b></td>
                        <td style={{ padding: '20px' }}><span style={{ color: '#10b981', fontWeight: 'bold' }}>${p.monto}</span></td>
                        <td style={{ padding: '20px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#94a3b8' }}>
                           {p.metodo === 'Mercado Pago' ? (p.mp_payment_id || 'Online') : (p.numero_operacion || 'Transferencia Doc.')}
                        </td>
                        <td style={{ padding: '20px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <span style={{ 
                                 fontSize: '0.65rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px',
                                 background: p.estado === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                 color: p.estado === 'approved' ? '#10b981' : '#f59e0b'
                              }}>
                                 {p.estado?.toUpperCase() || 'PENDIENTE'}
                              </span>
                              {p.estado === 'approved' && (
                                 <button 
                                   onClick={() => handleDownloadReceipt(p)}
                                   style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                   <Download size={12} /> Ver Factura
                                 </button>
                               )}
                           </div>
                        </td>
                     </tr>
                  );
               })}
               {(!history || history.length === 0) && <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay transacciones registradas.</td></tr>}
            </tbody>
         </table>
      </div>
  );
};

const PaymentsValidationPanel = ({ companies }) => {
  const [payments, setPayments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadPayments = async () => {
    const data = await db.obtenerHistorialPagos();
    // Ordenar por fecha descendente
    setPayments(data.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)));
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleApprove = async (payment) => {
    if (!window.confirm(`¿Confirma que desea aprobar este pago de $${payment.monto} y activar la licencia?`)) return;
    setIsProcessing(true);
    try {
      const today = new Date();
      const expiryDate = new Date();
      expiryDate.setDate(today.getDate() + 30);

      // Identificar datos clave y Normalizar Plan (Regla de Oro: Estabilidad de IDs)
      const empresaId = payment.empresaId;
      let plan = (payment.planId || payment.plan || 'basico').toLowerCase();
      // Limpiar ruidos comunes: "Plan Enterprise" -> "enterprise"
      plan = plan.replace('plan ', '').replace('licencia ', '').trim();
      const paymentRef = payment.id;

      // 1. Actualizar estado del pago a Aprobado
      await db.actualizarEstadoPago(paymentRef, 'approved');

      // 2. Gestionar Licencia (Actualizar Empresa)
      await db.actualizarEmpresa(empresaId, {
        status: 'activa',
        plan: plan,
        expiryDate: expiryDate.toISOString().split('T')[0], // Atributo para bloqueo de UI
        fechaInicio: today.toISOString(),
        fechaFin: expiryDate.toISOString(),
        lastPaymentRef: paymentRef
      });

      // 3. Crear o Actualizar Suscripción (Referencia de cobro)
      await db.actualizarSuscripcion(empresaId, {
        planId: plan,
        estado: 'activa',
        fechaInicio: today.toISOString(),
        fechaFin: expiryDate.toISOString(),
        fechaProximoPago: expiryDate.toISOString(),
        paymentId: paymentRef // Referencia del pago que activó la licencia
      });

      alert("✅ Licencia Activada: El acceso de la empresa ha sido restaurado y extendido por 30 días.");
      setSelectedPayment(null);
      loadPayments();
    } catch (error) {
      console.error(error);
      alert("❌ Error en la activación: " + error.message);
    }
    setIsProcessing(false);
  };

  const handleReject = async (pagoId) => {
    if (!window.confirm("¿Desea rechazar este pago?")) return;
    await db.actualizarEstadoPago(pagoId, 'rejected');
    alert("Pago rechazado.");
    loadPayments();
  };

  const filteredPayments = payments.filter(p => {
    const matchesStatus = filterStatus === 'all' || p.estado === filterStatus || (!p.estado && filterStatus === 'pending');
    const matchesMethod = filterMethod === 'all' || p.metodo === filterMethod;
    const company = companies.find(c => c.id === p.empresaId);
    const matchesSearch = !searchQuery || company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesMethod && matchesSearch;
  });

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            className="input-full" 
            style={{ marginTop: 0, paddingLeft: '45px' }} 
            placeholder="Buscar por empresa..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}>
          <option value="all">Todos los Estados</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobados</option>
          <option value="rejected">Rechazados</option>
        </select>
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' }}>
          <option value="all">Todos los Métodos</option>
          <option value="Transferencia Bancaria">Transferencia</option>
          <option value="Mercado Pago">Mercado Pago</option>
        </select>
      </div>

      <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
              <th style={{ padding: '20px', textAlign: 'left' }}>EMPRESA</th>
              <th style={{ padding: '20px', textAlign: 'left' }}>PLAN</th>
              <th style={{ padding: '20px', textAlign: 'left' }}>MONTO</th>
              <th style={{ padding: '20px', textAlign: 'left' }}>MÉTODO</th>
              <th style={{ padding: '20px', textAlign: 'left' }}>FECHA</th>
              <th style={{ padding: '20px', textAlign: 'left' }}>ESTADO</th>
              <th style={{ padding: '20px', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredPayments) && filteredPayments.map(p => {
              const company = companies.find(c => c.id === p.empresaId);
              const planId = (p.planId || 'basico').toUpperCase();
              const plan = PLANES[planId] || { nombre: p.planId };
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '20px' }}>
                    <div style={{ fontWeight: 'bold' }}>{company?.name || company?.nombre || 'S/E'}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>ID: {p.empresaId}</div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}>{plan.nombre}</span>
                  </td>
                  <td style={{ padding: '20px' }}><b style={{ color: '#10b981' }}>${p.monto} USD</b></td>
                  <td style={{ padding: '20px', fontSize: '0.85rem' }}>{p.metodo}</td>
                  <td style={{ padding: '20px', fontSize: '0.8rem' }}>
                    {p.fecha && !isNaN(new Date(p.fecha).getTime()) 
                      ? new Date(p.fecha).toLocaleDateString() 
                      : 'Pendiente'}
                  </td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold',
                      background: (p.estado === 'approved' || p.estado === 'approved') ? 'rgba(16, 185, 129, 0.1)' : (p.estado === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'),
                      color: (p.estado === 'approved' || p.estado === 'approved') ? '#10b981' : (p.estado === 'rejected' ? '#ef4444' : '#f59e0b')
                    }}>
                      {p.estado?.toUpperCase() || 'PENDIENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setSelectedPayment(p)} className="secondary" style={{ padding: '8px', minWidth: 'auto', background: 'rgba(255,255,255,0.02)' }} title="Ver Detalle">
                        <Eye size={16} />
                      </button>
                      {(p.estado === 'pending' || !p.estado) && (
                        <>
                          <button onClick={() => handleApprove(p)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Aprobar">
                            <CheckCircle2 size={16} />
                          </button>
                          <button onClick={() => handleReject(p.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Rechazar">
                            <X size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!filteredPayments || filteredPayments.length === 0) && (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>No se encontraron pagos con los filtros seleccionados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedPayment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass fade-up" style={{ width: '600px', padding: '40px', borderRadius: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <BadgeCheck color="#00d2ff" /> Validación de Comprobante
              </h3>
              <button onClick={() => setSelectedPayment(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '20px' }}>
              <div>
                <label style={{ fontSize: '0.65rem' }}>Empresa</label>
                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{companies.find(c => c.id === selectedPayment.empresaId)?.name || 'S/E'}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem' }}>Plan Seleccionado</label>
                <div style={{ fontWeight: 'bold' }}>{PLANES[(selectedPayment.planId || 'basico').toUpperCase()]?.nombre}</div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem' }}>Monto Transacción</label>
                <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.4rem' }}>\${selectedPayment.monto} USD</div>
              </div>
              <div>
                <label style={{ fontSize: '0.65rem' }}>Fecha de Envío</label>
                <div style={{ fontSize: '0.9rem' }}>{new Date(selectedPayment.fecha).toLocaleString()}</div>
              </div>
            </div>

            <label style={{ fontSize: '0.65rem', display: 'block', marginBottom: '10px' }}>Vista del Comprobante (Fisico/Digital)</label>
            <div style={{ 
              width: '100%', height: '320px', background: '#000', 
              borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '30px', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {selectedPayment.comprobante ? (
                <img src={selectedPayment.comprobante} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.3 }}>
                  <CreditCard size={48} style={{ marginBottom: '10px' }} />
                  <div>Sin imagen adjunta</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '15px' }}>
              {(selectedPayment.estado === 'pending' || !selectedPayment.estado) ? (
                <>
                  <button onClick={() => handleApprove(selectedPayment)} disabled={isProcessing} className="primary" style={{ flex: 1, background: '#10b981', border: 'none' }}>
                    {isProcessing ? <Loader2 className="animate-spin" /> : 'APROBAR Y ACTIVAR'}
                  </button>
                  <button onClick={() => { handleReject(selectedPayment.id); setSelectedPayment(null); }} className="secondary" style={{ flex: 1, color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.1)' }}>
                    RECHAZAR
                  </button>
                </>
              ) : (
                <button onClick={() => setSelectedPayment(null)} className="secondary" style={{ width: '100%' }}>CERRAR DETALLE</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="glass" style={{
    padding: '24px',
    background: `linear-gradient(135deg, ${color}cc 0%, ${color}44 100%)`,
    display: 'flex', alignItems: 'center', gap: '24px',
    border: `1px solid rgba(255,255,255,0.2)`,
    boxShadow: `0 10px 25px ${color}33`,
    transition: 'transform 0.3s ease',
    cursor: 'default'
  }}>
    <div style={{
      width: '64px', height: '64px', borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
      filter: `drop-shadow(0 0 15px rgba(255,255,255,0.4))`
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        {value} <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.8)' }}>{title}</span>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 'bold', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <TrendingUp size={12} /> {trend}
      </div>
    </div>
  </div>
);

const TacticalMap = () => (
  <div className="glass" style={{ height: '400px', background: '#0a0f1e', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
    {/* Map Background Simulation */}
    <div style={{
      position: 'absolute', inset: 0,
      backgroundImage: 'url("https://www.interesporlacomunicacion.com/wp-content/uploads/2019/11/google-maps-oscuro.jpg")',
      backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25, filter: 'grayscale(1) brightness(0.5)'
    }} />

    {/* Grid & HUD Layer */}
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle, transparent 0%, rgba(7,12,26,0.8) 100%), linear-gradient(rgba(0,210,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,255,0.03) 1px, transparent 1px)',
      backgroundSize: '100% 100%, 30px 30px, 30px 30px',
      pointerEvents: 'none'
    }} />

    {/* Search Overlay */}
    <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
      <div style={{ background: 'rgba(15,23,42,0.9)', padding: '8px 15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Search size={14} color="#00d2ff" />
        <input placeholder="Buscar evento..." style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', outline: 'none', width: '200px' }} />
      </div>
    </div>

    {/* Map Pins */}
    <MapPinPoint x="30%" y="40%" label="Hospital Italiano" time="10:25" color="#00d2ff" />
    <MapPinPoint x="60%" y="30%" label="Luis (Guardia)" time="10:25" color="#3b82f6" />
    <MapPinPoint x="45%" y="65%" label="Shopping Norte" time="10:25" color="#f59e0b" />
  </div>
);

const MapPinPoint = ({ x, y, label, time, color }) => (
  <div style={{ position: 'absolute', left: x, top: y, cursor: 'pointer', zIndex: 5 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15,23,42,0.9)', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${color}`, boxShadow: `0 0 15px ${color}44` }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <User size={12} color="white" />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{time}</div>
      </div>
    </div>
    <div style={{ position: 'absolute', bottom: '-15px', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '15px', background: color }} />
  </div>
);

const NavIcon = ({ icon, active, onClick }) => (
  <div onClick={onClick} style={{ padding: '10px', color: active ? '#00d2ff' : '#94a3b8', background: active ? 'rgba(0,210,255,0.1)' : 'transparent', borderRadius: '12px' }}>
    {icon}
  </div>
);

const DiagnosticItem = ({ label, value, color = 'white' }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
     <span style={{ color: '#94a3b8' }}>{label}:</span>
     <span style={{ fontWeight: 'bold', color }}>{value}</span>
  </div>
);

const ActionButton = ({ label, onClick, icon, primary, color }) => (
  <button 
    onClick={onClick}
    className={primary ? "primary" : "secondary"}
    style={{ 
        padding: '8px', 
        fontSize: '0.65rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '5px',
        flex: 1,
        background: color ? `${color}22` : undefined,
        borderColor: color ? `${color}44` : undefined,
        color: color || undefined
    }}
  >
    {icon} {label}
  </button>
);

export default MasterDashboard;
