// ========================
// SISTEMA DE ESTADOS GLOBALES
// ========================

export const ESTADOS_EMPRESA = {
  ACTIVA: 'activa',
  SUSPENDIDA: 'suspendida',
  CANCELADA: 'cancelada',
  PRUEBA: 'prueba',
};

export const ESTADOS_USUARIO = {
  ACTIVO: 'activo',
  BLOQUEADO: 'bloqueado',
  ELIMINADO: 'eliminado',
};

export const ESTADOS_PERSONAL = {
  ACTIVO: 'activo',
  LICENCIA: 'licencia',
  BAJA: 'baja',
  SUSPENDIDO: 'suspendido'
};

export const ESTADOS_EVENTO = {
  ABIERTO: 'abierto',
  EN_PROCESO: 'en_proceso',
  CERRADO: 'cerrado',
};

export const TIPOS_EVENTO = {
  RONDA: 'ronda',
  PANICO: 'panico',
  FICHAJE: 'fichaje',
  NOVEDAD: 'novedad',
  MANTENIMIENTO: 'mantenimiento'
};
