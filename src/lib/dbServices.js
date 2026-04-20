import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp, onSnapshot, collectionGroup } from "firebase/firestore";
import { db } from "./firebase";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as signOutAuth } from "firebase/auth";

// ========================
// CONFIGURACIÓN API (RENDER)
// ========================
// IMPORTANTE: Cambiar esta URL por la de Render una vez desplegado
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiRequest = async (endpoint, method = 'GET', body = null) => {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Error en API (${endpoint}):`, error);
        return null;
    }
};

// HELPER PARA LOCALSTORAGE (MODO FALLBACK)
const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '[]');
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data));

// ========================
// EMPRESAS
// ========================
export const crearEmpresa = async (empresaId, data) => {
  const result = await apiRequest('/empresas', 'POST', { ...data, id: empresaId, fecha_alta: new Date().toISOString().split('T')[0] });
  if (!result) {
    const companies = getLocal('centinela_companies');
    setLocal('centinela_companies', [{ ...data, id: empresaId }, ...companies]);
  }
};

export const obtenerEmpresas = async () => {
  const data = await apiRequest('/empresas');
  return data || getLocal('centinela_companies');
};

export const actualizarEmpresa = async (id, data) => {
  await apiRequest('/empresas', 'POST', { ...data, id });
};

// ========================
// PLANES
// ========================
export const obtenerPlanes = async () => {
    const data = await apiRequest('/planes');
    if (data) return data;
    // Fallback dinámico si la API falla
    const { PLANES } = await import("./planes");
    return Object.values(PLANES);
};

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
      fecha: dataEvento.fecha || new Date().toISOString().split('T')[0],
      hora: dataEvento.hora || new Date().toLocaleTimeString('es-AR', { hour12: false }).split(' ')[0]
  };
  await apiRequest('/eventos', 'POST', newEvent);
  return newEvent.id;
};

export const obtenerEventos = async (companyId = null) => {
    const endpoint = companyId ? `/eventos?companyId=${companyId}` : '/eventos';
    return await apiRequest(endpoint);
};

// ========================
// USUARIOS (SaaS)
// ========================
export const crearUsuarioSaaS = async (datos, adminEmpresaId) => {
    // 1. Crear en Firebase (Auth) si está disponible
    let uid = `user_${Date.now()}`;
    // Aquí podrías mantener la lógica de Firebase Auth si lo deseas
    
    // 2. Guardar en MySQL
    await apiRequest('/usuarios', 'POST', { ...datos, id: uid, companyId: adminEmpresaId });
    return uid;
};

export const obtenerUsuariosEmpresa = async (empresaId) => {
    return await apiRequest(`/usuarios?companyId=${empresaId}`);
};

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

// ========================
// FACTURACIÓN
// ========================
export const registrarPago = async (data) => {
    await apiRequest('/payments/webhook', 'POST', { data }); // Simulación o endpoint directo
};

export const obtenerHistorialPagos = async (empresaId = null) => {
    // Por implementar en MySQL historial_pagos
    return [];
};

// Mantenemos los mocks de diagnóstico por ahora (no requieren DB pesada)
export const obtenerDiagnosticoUsuario = async (userId) => {
    return { id: userId, status: 'activo', lastLogin: new Date().toISOString(), rol: 'ADMIN' };
};

export const logAction = async (u, a, e, d = {}) => { console.log(`[API-LOG] ${u} -> ${a}`); };
