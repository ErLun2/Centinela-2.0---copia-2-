import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp, onSnapshot, collectionGroup } from "firebase/firestore";
import { db } from "./firebase";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as signOutAuth } from "firebase/auth";

// ========================
// CONFIGURACIÓN API (RENDER / PRODUCCIÓN)
// ========================
const getApiUrl = () => {
    // REGLA DE ORO: Priorizamos la variable de entorno de Vite, con fallback al servidor real de Render
    return import.meta.env.VITE_API_URL || 'https://centinela-backend.onrender.com/api';
};

export const API_URL = getApiUrl();

export const apiRequest = async (endpoint, method = 'GET', body = null) => {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Error ${response.status}: ${endpoint}`;
            try {
                const errorObj = JSON.parse(errorText);
                errorMessage = errorObj.error || errorMessage;
            } catch(e) {}
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        console.error('API Request error:', error);
        throw error;
    }
};

// HELPER PARA LOCALSTORAGE (MODO FALLBACK)
const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export const registrarSolicitudDemo = async (data) => {
    return await apiRequest('/demo-requests', 'POST', data);
};

// ========================
// MOTOR DE SUSCRIPCIÓN "LITE" (SMART POLLING)
// ========================
// Esta función simula un "real-time" eficiente consultando solo novedades cada 30 segundos.
const subscribeToResource = (endpoint, callback, interval = 30000) => {
    const poll = async () => {
        const data = await apiRequest(endpoint);
        if (data) {
            callback(data);
        }
    };
    poll(); // Carga inicial
    const timer = setInterval(poll, interval);
    return () => clearInterval(timer);
};

// ========================
// EMPRESAS
// ========================
export const crearEmpresa = async (empresaId, data) => {
  await apiRequest('/empresas', 'POST', { ...data, id: empresaId, fecha_alta: new Date().toISOString().split('T')[0] });
};

export const obtenerEmpresas = async () => {
  const data = await apiRequest('/empresas');
  return data || [];
};

export const subscribeToCompanies = (cb) => subscribeToResource('/empresas', cb, 30000);

// ========================
// PLANES
// ========================
export const obtenerPlanes = async () => {
    const data = await apiRequest('/planes');
    return data || [];
};

export const subscribeToPlanes = (cb) => subscribeToResource('/planes', cb, 60000);

export const guardarPlan = async (plan) => {
    const result = await apiRequest('/planes', 'POST', plan);
    return result ? plan.id : null;
};

export const eliminarPlan = async (id) => {
    await apiRequest(`/planes/${id}`, 'DELETE');
};

// ========================
// EVENTOS Y BITÁCORA
// ========================
export const crearEvento = async (empresaId, dataEvento) => {
  const newEvent = { 
      ...dataEvento, 
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`, 
      companyId: empresaId,
      fecha: dataEvento.fecha || new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date()),
      fechaRegistro: dataEvento.fechaRegistro || new Date().toISOString(),
      hora: dataEvento.hora || new Date().toLocaleTimeString('es-AR', { hour12: false }).split(' ')[0]
  };
  await apiRequest('/eventos', 'POST', newEvent);
  return newEvent.id;
};

export const actualizarEvento = async (id, datos) => {
    return await apiRequest(`/eventos/${id}/update`, 'POST', datos);
};

export const obtenerEventos = async (companyId = null) => {
    const endpoint = companyId ? `/eventos?companyId=${companyId}` : '/eventos';
    return await apiRequest(endpoint);
};

export const subscribeToAllEventsGroup = (cb) => subscribeToResource('/eventos', cb, 30000);

// ========================
// USUARIOS (SaaS)
// ========================
export const crearUsuarioSaaS = async (datos, adminEmpresaId) => {
    let uid = datos.id || datos.uid || `user_${Date.now()}`;
    await apiRequest('/usuarios', 'POST', { ...datos, id: uid, companyId: adminEmpresaId });
    return uid;
};

export const obtenerUsuariosEmpresa = async (empresaId) => {
    return await apiRequest(`/usuarios?companyId=${empresaId}`);
};

export const obtenerUsuarios = async () => {
    return await apiRequest('/usuarios');
};

export const subscribeToAllUsers = (cb) => subscribeToResource('/usuarios', cb, 35000); 

export const eliminarUsuario = async (id) => {
    return await apiRequest(`/usuarios/${id}`, 'DELETE');
};

export const crearObjective = async (data) => {
    return await apiRequest('/objectives', 'POST', data);
};

export const eliminarObjective = async (id) => {
    return await apiRequest(`/objectives/${id}`, 'DELETE');
};

export const crearQrPoint = async (data) => {
    return await apiRequest('/qr_points', 'POST', data);
};

export const subscribeToObjectives = (cb) => subscribeToResource('/objectives', cb, 45000);
export const subscribeToQrPoints = (cb) => subscribeToResource('/qr_points', cb, 45000);

// Rondas (Programación)
export const guardarRondaProgramada = async (data) => await apiRequest('/rondas', 'POST', data);
export const obtenerRondas = async (companyId) => await apiRequest(`/rondas?companyId=${companyId}`);
export const eliminarRonda = async (id) => await apiRequest(`/rondas/${id}`, 'DELETE');
export const subscribeToRondas = (cb) => subscribeToResource('/rondas', cb, 45000);

// Empresas
export const actualizarEmpresa = async (data) => await apiRequest('/empresas', 'POST', data);

// ========================
// TICKETS DE SOPORTE
// ========================
export const registrarNuevoTicket = async (ticketData) => {
    const id = "TK-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newTicket = { ...ticketData, id, fecha: new Date().toISOString() };
    await apiRequest('/tickets', 'POST', newTicket);
    return newTicket;
};

export const obtenerTickets = async () => {
    return await apiRequest('/tickets');
};

export const subscribeToTickets = (cb) => subscribeToResource('/tickets', cb, 40000);

// ========================
// FACTURACIÓN
// ========================
export const registrarPago = async (data) => {
    await apiRequest('/payments/webhook', 'POST', { data });
};

export const subscribeToAllPayments = (cb) => subscribeToResource('/payments', cb, 60000);

// ========================
// MOCKS Y DIAGNÓSTICO
// ========================
export const obtenerDiagnosticoUsuario = async (userId) => {
    return { id: userId, status: 'activo', lastLogin: new Date().toISOString(), rol: 'ADMIN' };
};
export const obtenerDiagnosticoDispositivo = async (userId) => ({ status: 'ok', brand: 'Android', version: '13' });
export const obtenerDiagnosticoGPS = async (userId) => ({ accuracy: '5m', status: 'connected' });
export const obtenerLogsSistema = async (id) => [];
export const ejecutarDiagnosticoAutomatico = async (u, t) => ({ summary: 'Sincronización OK' });
export const ejecutarAccionSoporte = async (actionId, userId, ticketId) => {
    return await apiRequest('/soporte/ejecutar', 'POST', { actionId, userId, ticketId });
};

export const logAction = async (u, a, e, d = {}) => { console.log(`[API-LOG] ${u} -> ${a}`); };

// ========================
// FUNCIONES RESTAURADAS PARA ESTABILIDAD (REGLA DE ORO)
// ========================
export const obtenerConfiguracionPagos = async () => await apiRequest('/pagos/config');
export const guardarConfiguracionPagos = async (data) => await apiRequest('/pagos/config', 'POST', data);
export const obtenerSuscripciones = async () => await apiRequest('/suscripciones');
export const obtenerHistorialPagos = async (compId = null) => {
    const url = compId ? `/payments/history?companyId=${compId}` : '/payments/history';
    return await apiRequest(url);
};
export const actualizarEstadoPago = async (id, status) => await apiRequest(`/payments/${id}`, 'POST', { status });
export const actualizarSuscripcion = async (id, data) => await apiRequest(`/suscripciones/${id}`, 'POST', data);
export const actualizarEstadoEmpresa = async (id, status) => await apiRequest(`/empresas/${id}`, 'POST', { status });
export const eliminarEmpresa = async (id) => await apiRequest(`/empresas/${id}`, 'DELETE');

// Soporte & Diagnóstico
export const obtenerSugerenciasInteligentes = async (ticket) => [];
export const detectarIncidentesMasivos = async () => [];

// Staff App & GPS
export const actualizarUbicacionGPS = async (empresaId, userId, lat, lng) => await apiRequest('/gps', 'POST', { companyId: empresaId, userId, lat, lng });
export const subscribeToLocations = (companyId, cb) => subscribeToResource(`/gps?companyId=${companyId}`, cb, 10000); // 10s para el Dashboard
export const iniciarRonda = async (data) => await apiRequest('/rondas/start', 'POST', data);
export const finalizarRonda = async (id) => await apiRequest(`/rondas/finish/${id}`, 'POST');
export const registrarPuntoRuta = async (data) => await apiRequest('/rondas/point', 'POST', data);
export const registrarEventoAudit = async (data) => await apiRequest('/audit', 'POST', data);
export const actualizarTicket = async (id, data) => await apiRequest(`/tickets/${id}`, 'POST', data);
export const enviarPropuesta = async (proposalData) => await apiRequest('/send-proposal', 'POST', proposalData);
export const verificarAdmin = async (password) => await apiRequest('/auth/verify-admin', 'POST', { password });

export const loginRemoto = async (email, password) => {
    return await apiRequest('/auth/login', 'POST', { email, password });
};

export const cambiarAdminPassword = async (currentPassword, newPassword) => await apiRequest('/auth/admin-password', 'POST', { currentPassword, newPassword });
