/**
 * Definición oficial de Planes de Servicio Centinela
 * Permite activar/desactivar funciones y establecer límites operativos.
 */
const DEFAULT_PLANES = {
  BASICO: {
    id: 'basico',
    nombre: 'Plan Básico',
    precio: 1500,
    subtitulo: 'Ideal para comenzar a digitalizar y ordenar tu operación de seguridad',
    limite_guardias: 70,
    botones_panico: 30,
    limite_puestos: Infinity,
    historial_dias: 180,
    beneficios: [
      'Control básico de asistencia y operaciones',
      'Registro de eventos con evidencia',
      'Rondas QR básicas por puntos de control'
    ],
    color: '#00d2ff'
  },
  PROFESIONAL: {
    id: 'profesional',
    nombre: 'Plan Profesional',
    precio: 3000,
    subtitulo: 'Control total de tu operación con Rondas QR y Monitoreo GPS',
    limite_guardias: 150,
    botones_panico: 100,
    limite_puestos: Infinity,
    historial_dias: 180,
    gps: true,
    rondas: true,
    geocercas: true,
    alertas_ia: false,
    app_movil: true,
    color: '#3b82f6',
    beneficios: [
      'Monitoreo GPS en tiempo real',
      'Rondas QR avanzadas con evidencia',
      'Alertas ante desvíos operativos',
      'Mejora en la calidad del servicio'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    nombre: 'Plan Enterprise',
    precio: 5000,
    subtitulo: 'Solución avanzada con IA, Rondas QR y Monitoreo Centralizado',
    limite_guardias: 250,
    botones_panico: 180,
    limite_puestos: Infinity,
    historial_dias: 365,
    gps: true,
    rondas: true,
    geocercas: true,
    alertas_ia: true,
    app_movil: true,
    color: '#8b5cf6',
    beneficios: [
      'IA para detección de eventos críticos',
      'Rondas QR masivas multidispositivo',
      'Auditoría completa de patrullajes',
      'Supervisión centralizada avanzada'
    ]
  },
  DEMO: {
    id: 'demo',
    nombre: 'Plan Demo',
    precio: 0,
    subtitulo: 'Probá el sistema completo sin compromiso',
    duracion_dias: 15,
    limite_guardias: 250,
    botones_panico: 180,
    limite_puestos: Infinity,
    historial_dias: 365,
    gps: true,
    rondas: true,
    geocercas: true,
    alertas_ia: true,
    app_movil: true,
    color: '#10b981',
    beneficios: [
      'Acceso completo a todas las funciones',
      'Simulación de operación real',
      'Evaluación sin compromiso'
    ]
  }
};

// Intentar cargar desde localStorage para persistencia de ediciones del SuperAdmin
const getPlanes = () => {
  try {
    const saved = localStorage.getItem('centinela_planes_data');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error loading planes from localStorage", e);
  }
  return DEFAULT_PLANES;
};

export const PLANES = getPlanes();

/**
 * Helper para obtener los permisos de una empresa según su ID de plan
 */
export const getPlanPermisos = (planId) => {
  const idStr = (planId || 'basico').toLowerCase();
  // Buscamos dinámicamente en el objeto PLANES
  const found = Object.values(PLANES).find(p => p.id?.toLowerCase() === idStr);
  if (found) return found;

  // Fallbacks históricos
  if (idStr === 'pro') return PLANES.PROFESIONAL;
  return PLANES.BASICO;
};

