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
const STORAGE_URL = 'https://centinela-security.com/upload.php'; // URL estándar en tu raíz de IlimitadoHost

// Función centralizada para subir archivos a IlimitadoHost
export const subirArchivoAStorage = async (base64OrFile) => {
    if (!base64OrFile) return null;
    try {
        let formData = new FormData();
        
        if (typeof base64OrFile === 'string' && base64OrFile.startsWith('data:')) {
            // Método robusto: Convertir Base64 a Blob manualmente
            const parts = base64OrFile.split(';base64,');
            const contentType = parts[0].split(':')[1];
            const raw = window.atob(parts[1]);
            const rawLength = raw.length;
            const uInt8Array = new Uint8Array(rawLength);
            for (let i = 0; i < rawLength; ++i) uInt8Array[i] = raw.charCodeAt(i);
            const blob = new Blob([uInt8Array], { type: contentType });
            
            const ext = contentType.split('/')[1] || 'png';
            formData.append('file', blob, `media_${Date.now()}.${ext}`);
        } else if (base64OrFile instanceof File || base64OrFile instanceof Blob) {
            formData.append('file', base64OrFile);
        } else {
            return base64OrFile;
        }

        const res = await fetch(STORAGE_URL, { method: 'POST', body: formData });
        const data = await res.json();
        return data.success ? data.url : base64OrFile;
    } catch (error) {
        console.error("Error subiendo a IlimitadoHost:", error);
        return base64OrFile;
    }
};

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
// Helper para obtener fecha ISO en hora local (Argentina) para evitar desfase de 3hs en los reportes
const getLocalISO = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, -1);
};

export const crearEmpresa = async (empresaId, data) => {
  const id = empresaId || `emp_${Date.now()}`;
  await apiRequest('/empresas', 'POST', { ...data, id: empresaId, fecha_alta: getLocalISO() });
  return id;
};

export const obtenerEmpresas = async () => {
  const data = await apiRequest('/empresas');
  return data || [];
};

export const getEmpresaById = async (id) => {
    try {
        return await apiRequest(`/empresas/${id}`);
    } catch (error) {
        console.error("Error fetching company by ID:", error);
        return null;
    }
};

export const subscribeToCompanies = (callback, interval = 30000) => subscribeToResource('/empresas', callback, interval);

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
  const nowISO = getLocalISO();
  const newEvent = { 
      ...dataEvento, 
      id: `evt_${Date.now()}_${Math.floor(Math.random() * 1000)}`, 
      companyId: empresaId,
      fecha: dataEvento.fecha || nowISO,
      fechaRegistro: dataEvento.fechaRegistro || nowISO,
      hora: dataEvento.hora || nowISO
  };

  // REGLA DE ORO: Si hay multimedia en Base64, subirla a IlimitadoHost
  if (newEvent.fotoUrl && newEvent.fotoUrl.startsWith('data:')) newEvent.fotoUrl = await subirArchivoAStorage(newEvent.fotoUrl);
  if (newEvent.videoUrl && newEvent.videoUrl.startsWith('data:')) newEvent.videoUrl = await subirArchivoAStorage(newEvent.videoUrl);
  if (newEvent.audioUrl && newEvent.audioUrl.startsWith('data:')) newEvent.audioUrl = await subirArchivoAStorage(newEvent.audioUrl);

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

export const resetearPasswordUsuario = async (userId, newPassword) => {
    await apiRequest('/usuarios/update-password', 'POST', { userId, newPassword, reset: true });
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
export const actualizarEmpresa = async (idOrData, data) => {
    if (data) {
        // Si se pasan dos argumentos, es una actualización quirúrgica por ID
        return await apiRequest(`/empresas/${idOrData}`, 'POST', data);
    }
    // Si se pasa uno, es el objeto completo (formato legacy/full)
    return await apiRequest('/empresas', 'POST', idOrData);
};

// ========================
// TICKETS DE SOPORTE
// ========================
export const registrarNuevoTicket = async (ticketData) => {
    const id = ticketData.id || "TK-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    let newTicket = { ...ticketData, id, fecha: ticketData.fecha || new Date().toISOString() };
    
    // REGLA DE ORO: Subir adjuntos base64 a IlimitadoHost para ahorrar espacio en DB
    if (newTicket.adjunto && newTicket.adjunto.startsWith('data:')) {
        newTicket.adjunto = await subirArchivoAStorage(newTicket.adjunto);
    }

    if (newTicket.respuestas && Array.isArray(newTicket.respuestas)) {
        for (let i = 0; i < newTicket.respuestas.length; i++) {
            if (newTicket.respuestas[i].adjunto && newTicket.respuestas[i].adjunto.startsWith('data:')) {
                newTicket.respuestas[i].adjunto = await subirArchivoAStorage(newTicket.respuestas[i].adjunto);
            }
        }
    }

    const result = await apiRequest('/tickets', 'POST', newTicket);
    // Retornamos el ticket actualizado con las respuestas que el servidor fusionó
    return result.respuestas ? { ...newTicket, respuestas: result.respuestas } : newTicket;
};

export const obtenerTickets = async () => {
    const data = await apiRequest('/tickets');
    return (data || []).map(t => ({
        ...t,
        status: t.estado || t.status || 'Nuevo'
    }));
};

export const subscribeToTickets = (cb) => subscribeToResource('/tickets', (data) => {
    const normalized = (data || []).map(t => ({
        ...t,
        status: t.estado || t.status || 'Nuevo'
    }));
    cb(normalized);
}, 10000);

// ========================
// FACTURACIÓN
// ========================
export const registrarPago = async (data) => {
    await apiRequest('/payments/webhook', 'POST', data);
};

export const crearPreferenciaPago = async (data) => {
    return await apiRequest('/payments/create-preference', 'POST', data);
};

export const subscribeToAllPayments = (cb) => subscribeToResource('/payments', cb, 60000);

// ========================
// SOPORTE & DIAGNÓSTICO REAL
// ========================
export const obtenerFullDiagnostico = async (userId) => {
    return await apiRequest(`/soporte/diagnostico/${encodeURIComponent(userId)}`);
};

export const obtenerLogsSistema = (ticket) => {
    return (ticket.respuestas || []).filter(r => r.autor === 'LOG_SISTEMA');
};
export const ejecutarDiagnosticoAutomatico = async (userId, ticket) => {
    const diag = await apiRequest(`/soporte/diagnostico/${userId}`);
    return {
        score: diag.summary.score,
        summary: diag.summary.messages
    };
};
export const ejecutarAccionSoporte = async (actionId, userId, ticketId) => {
    return await apiRequest('/soporte/ejecutar', 'POST', { actionId, userId, ticketId });
};

export const logAction = async (u, a, e, d = {}) => { 
    console.log(`[API-LOG] ${u} -> ${a}`); 
    // Podríamos crear una tabla de auditoría en el futuro
};

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
export const obtenerSugerenciasInteligentes = async (ticketId, userId) => {
    // Lógica simple de sugerencias basada en el estado
    const diag = await apiRequest(`/soporte/diagnostico/${userId}`);
    const sugs = [];
    
    if (diag.user.status !== 'activo') {
        sugs.push({ id: 1, title: 'Activar Cuenta', desc: 'El usuario figura como inactivo.', action: 'activate_user' });
    }
    if (diag.gps.status === 'Sin Señal') {
        sugs.push({ id: 2, title: 'Reiniciar GPS', desc: 'No se detecta señal en el móvil.', action: 'force_sync' });
    }
    
    sugs.push({ id: 3, title: 'Restablecer Acceso', desc: 'Sugerido si el usuario no puede entrar.', action: 'reset_password' });
    
    return sugs;
};

export const detectarIncidentesMasivos = async () => {
    const tickets = await apiRequest('/tickets');
    const recent = tickets.filter(t => {
        const diff = (new Date() - new Date(t.fecha)) / (1000 * 60 * 60);
        return diff < 2 && t.status === 'Nuevo';
    });
    
    if (recent.length >= 3) {
        return [{ categoria: 'Posible Caída Regional', count: recent.length }];
    }
    return [];
};

// Staff App & GPS
export const actualizarUbicacionGPS = async (empresaId, userId, lat, lng) => await apiRequest('/gps', 'POST', { companyId: empresaId, userId, lat, lng });
export const subscribeToLocations = (companyId, cb) => subscribeToResource(`/gps?companyId=${companyId}`, cb, 10000); // 10s para el Dashboard
export const iniciarRonda = async (data) => await apiRequest('/rondas/start', 'POST', data);
export const finalizarRonda = async (id) => await apiRequest(`/rondas/finish/${id}`, 'POST');
export const registrarPuntoRuta = async (data) => await apiRequest('/rondas/point', 'POST', data);
export const registrarEventoAudit = async (data) => await apiRequest('/audit', 'POST', data);
export const actualizarTicket = async (id, data) => await apiRequest('/tickets', 'POST', { id, ...data });
export const enviarPropuesta = async (proposalData) => await apiRequest('/send-proposal', 'POST', proposalData);
export const verificarAdmin = async (password) => await apiRequest('/auth/verify-admin', 'POST', { password });

export const loginRemoto = async (email, password) => {
    return await apiRequest('/auth/login', 'POST', { email, password });
};

export const cambiarAdminPassword = async (currentPassword, newPassword) => await apiRequest('/auth/admin-password', 'POST', { currentPassword, newPassword });
