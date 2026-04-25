// Centinela Dashboard - Enterprise Edition
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BarChart, Wallet, Fingerprint, Code, Server, Webhook, FileText, ToggleLeft, GitBranch, Share2, Layers, Map,
  Lock, Bell, MonitorPlay, Moon, LogOut as LogOutIcon, Upload, Crown, Smartphone, Zap, TrendingUp,
  MapPin, Users, Calendar, LayoutDashboard, LogOut, CreditCard,
  Plus, X, UserCheck, CheckCircle, Loader2, Download, FileSpreadsheet,
  History, ShieldAlert, Clock, ChevronRight, ChevronLeft, Save, User, Shield,
  Search, Building, Building2, Eye, Camera, Play, Volume2, Filter,
  MessageSquare, Send, Paperclip, AlertCircle, Headphones, QrCode, Trash2, Settings,
  Mail, Phone, UserCircle, BadgeCheck, ShieldX, RotateCw, Edit3, Folder, HardDrive
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import { QRPrintView } from '../components/QRPrintSystem';
import { 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { useAuth, ROLES } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { useNavigate } from 'react-router-dom';
import { getPlanPermisos, PLANES } from '../lib/planes';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import * as db from '../lib/dbServices';

// Fix Leaflet Icons (Use CDN to avoid Vite issues)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to re-center map when props change
const RecenterMap = ({ pos }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView(pos, 18);
  }, [pos, map]);
  return null;
};

// Custom Marker for Guards (Classic Pointer)
const guardIcon = L.divIcon({
  className: 'custom-pointer-marker',
  html: `
    <svg width="30" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#ef4444" stroke="white"/>
      <circle cx="12" cy="10" r="3" fill="white"/>
    </svg>
  `,
  iconSize: [30, 40],
  iconAnchor: [15, 40]
});

// Function to create a dynamic classic location icon for objectives with status
const createObjectiveIcon = (name, current, total) => {
  const isCovered = total > 0 && current >= total;
  const color = total === 0 ? '#64748b' : (current === 0 ? '#ef4444' : isCovered ? '#10b981' : '#f59e0b');

  return L.divIcon({
    className: 'custom-objective-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          background: white;
          padding: 4px 8px;
          border-radius: 8px;
          border: 2px solid ${color};
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          margin-bottom: 5px;
          white-space: nowrap;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          <span style="font-size: 10px; font-weight: 900; color: #1e293b; text-transform: uppercase;">${name}</span>
          <span style="font-size: 11px; font-weight: 900; color: ${color};">${current}/${total}</span>
        </div>
        <svg width="34" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${color}" stroke="white"/>
          <circle cx="12" cy="10" r="3" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [120, 80],
    iconAnchor: [60, 75]
  });
};

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

// ====================================================================
// SUBCOMPONENTES
// ====================================================================

function StatCard({ title, value, icon, color, trend }) {
  return (
    <div className="glass" style={{
      padding: '24px',
      background: `linear-gradient(135deg, ${color}cc 0%, ${color}44 100%)`,
      display: 'flex', alignItems: 'center', gap: '24px',
      border: `1px solid rgba(255,255,255,0.2)`,
      boxShadow: `0 10px 25px ${color}33`,
      borderRadius: '20px'
    }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
      }}>
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          {value} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>{title}</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>SISTEMA OPERATIVO</div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '15px', padding: '14px 25px',
      color: active ? '#00d2ff' : 'rgba(255,255,255,0.5)',
      background: active ? 'linear-gradient(90deg, rgba(0,210,255,0.1) 0%, transparent 100%)' : 'transparent',
      borderLeft: active ? '4px solid #00d2ff' : '4px solid transparent',
      cursor: 'pointer', transition: 'all 0.3s',
      margin: '4px 10px',
      borderRadius: '0 10px 10px 0'
    }}>
      <div style={{ filter: active ? 'drop-shadow(0 0 5px #00d2ff)' : 'none' }}>{icon}</div>
      <span style={{ fontWeight: active ? '900' : '500', fontSize: '0.9rem', letterSpacing: '0.5px' }}>{label}</span>
    </div>
  );
}

const DAYS = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];

const OBJETIVOS_MOCK = [
  { id: 'obj1', nombre: 'Planta Industrial Alfa', lat: -34.6037, lng: -58.3816, address: 'Sector Norte, Nave 1' },
  { id: 'obj2', nombre: 'Edificio Torre Central', lat: -34.5937, lng: -58.4016, address: 'Av. Libertador 1500' },
  { id: 'obj3', nombre: 'Centro Logístico Sur', lat: -34.6137, lng: -58.3616, address: 'Parque Industrial, Lote 4' },
];


// Helper to get Argentina local date string YYYY-MM-DD
const getARDateStr = (dateInput) => {
  if (!dateInput) return '';
  
  // Si ya es un string YYYY-MM-DD (format de la App), devolverlo directamente
  // Esto evita que new Date() lo tome como UTC y lo mueva al día anterior en Argentina
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.split('T')[0])) {
    return dateInput.split('T')[0];
  }

  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return String(dateInput).split('T')[0];

    // Usar Intl para obtener el string YYYY-MM-DD en la zona horaria de Argentina
    return new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch (e) {
    return String(dateInput).split('T')[0];
  }
};


//// ======== ENTERPRISE CONFIG COMPONENT ========
const EnterpriseConfigPanel = ({ 
  companyData, 
  companyUsers, 
  objectives, 
  showToast, 
  refreshData, 
  setSelectedUserForView,
  setNewObjective,
  setNewObjectiveCoords,
  setShowNewObjectiveModal,
  toggleBranchStatus
}) => {
  const { user } = useAuth();
  const { settings, saveSettings, testSound, stopPanic, isPanicActive } = useSound();
  const [activeSubTab, setActiveSubTab] = React.useState('Empresa');

  // Local state for company data to handle editing
  const [localCompany, setLocalCompany] = React.useState({
    id: companyData?.id || companyData?.uid || '',
    nombre: companyData?.nombre || companyData?.name || user?.company || 'STARK INDUSTRIES',
    email: companyData?.appEmail || companyData?.email || user?.email || '',
    timezone: companyData?.timezone || 'America/Argentina/Buenos_Aires (UTC-3)',
    logo: companyData?.logo || ''
  });

  // Sync state if companyData changes (e.g. after refreshData)
  React.useEffect(() => {
    if (companyData) {
      setLocalCompany({
        id: companyData.id || companyData.uid || '',
        nombre: companyData.nombre || companyData.name || user?.company || 'STARK INDUSTRIES',
        email: companyData.appEmail || companyData.email || user?.email || '',
        timezone: companyData.timezone || 'America/Argentina/Buenos_Aires (UTC-3)',
        logo: companyData.logo || ''
      });
    }
  }, [companyData, user]);

  const [isSaving, setIsSaving] = React.useState(false);

  const TABS = [
    { id: 'Empresa', icon: <Building2 size={22}/>, title: 'Empresa', description: 'Información y sucursales' },
    { id: 'Usuarios', icon: <Users size={22}/>, title: 'Usuarios', description: 'Gestión de accesos' },
    { id: 'Almacenamiento', icon: <Server size={22}/>, title: 'Almacenamiento', description: 'Archivos y retención' },
    { id: 'Sonido', icon: <Volume2 size={22}/>, title: 'Sonido', description: 'Alertas y notificaciones' },
];

  const handleSaveCompany = async () => {
    if (!localCompany.nombre.trim()) {
      showToast("El nombre de la empresa es obligatorio", "error");
      return;
    }
    setIsSaving(true);
    try {
      const dataToSave = {
        ...localCompany,
        id: companyData?.id || companyData?.uid,
        name: localCompany.nombre,
      };
      await db.actualizarEmpresa(dataToSave);
      showToast("Información de empresa actualizada.");
      refreshData();
    } catch (error) {
      showToast("Error al guardar los cambios", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast("El logo no debe superar los 2MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalCompany({ ...localCompany, logo: reader.result });
        showToast("Vista previa del logo cargada.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Nota: toggleBranchStatus se movió al componente padre (CompanyDashboard) 
  // para mejor gestión de estado y sincronización con el mapa.

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      // Usamos el servicio de base de datos para alternar el estado
      // Nota: asumimos que dbServices tiene una forma de actualizar, o usamos crearUsuarioSaaS para update
      // Si no hay endpoint de "update", usamos el patrón de reenviar el objeto con el campo cambiado.
      const targetUser = companyUsers.find(u => (u.id === userId || u.uid === userId));
      if (!targetUser) return;

      const updatedUser = { ...targetUser, activo: !currentStatus };
      await db.crearUsuarioSaaS(updatedUser); 
      
      showToast("Estado de usuario actualizado correctamente.");
      refreshData();
    } catch (error) {
      showToast("Error al actualizar estado: " + error.message, "error");
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', gap: '30px', height: 'calc(100vh - 160px)', color: 'white' }}>
      
      {/* SIDEBAR NAVIGATION */}
      <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '20px', color: '#f8fafc' }}>Configuración</h2>
        {TABS.map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
              background: activeSubTab === tab.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              border: activeSubTab === tab.id ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
              transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}
          >
            <div style={{ color: activeSubTab === tab.id ? '#3b82f6' : 'rgba(255,255,255,0.4)' }}>
              {tab.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: activeSubTab === tab.id ? '900' : '600', color: activeSubTab === tab.id ? 'white' : 'rgba(255,255,255,0.7)' }}>{tab.title}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{tab.description}</div>
            </div>
            {activeSubTab === tab.id && <div style={{ position: 'absolute', right: '15px', width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }} />}
          </div>
        ))}
        
        <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
           Configuraciones avanzadas (próximamente)
        </div>
      </div>

      {/* CONTENT AREA */}
      <div style={{ flex: 1, background: 'rgba(15, 23, 42, 0.6)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: '40px', overflowY: 'auto' }}>
        
        {/* TAB: EMPRESA */}
        {activeSubTab === 'Empresa' && (
          <div className="fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Información Base</h3>
                <button 
                  onClick={handleSaveCompany} 
                  disabled={isSaving}
                  style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} GUARDAR CAMBIOS
                </button>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '40px', marginBottom: '50px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                         <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>RAZÓN SOCIAL / NOMBRE</label>
                         <input 
                            type="text" 
                            value={localCompany.nombre} 
                            onChange={(e) => setLocalCompany({...localCompany, nombre: e.target.value})}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', color: 'white', outline: 'none' }} 
                         />
                      </div>
                      <div className="input-group">
                         <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>EMAIL PRINCIPAL</label>
                         <input 
                            type="email" 
                            value={localCompany.email} 
                            onChange={(e) => setLocalCompany({...localCompany, email: e.target.value})}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', color: 'white', outline: 'none' }} 
                         />
                      </div>
                   </div>
                   <div className="input-group">
                      <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>ZONA HORARIA OPERATIVA</label>
                      <select 
                         value={localCompany.timezone}
                         onChange={(e) => setLocalCompany({...localCompany, timezone: e.target.value})}
                         style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', color: 'white', outline: 'none' }}
                      >
                         <option value="America/Argentina/Buenos_Aires (UTC-3)">America/Argentina/Buenos_Aires (UTC-3)</option>
                         <option value="America/Santiago (UTC-4)">America/Santiago (UTC-4)</option>
                         <option value="UTC (Greenwich Mean Time)">UTC (Greenwich Mean Time)</option>
                      </select>
                   </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                   <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', marginBottom: '15px', display: 'block' }}>LOGO CORPORATIVO</label>
                   <div 
                     onClick={() => document.getElementById('logo-upload-input').click()}
                     style={{ 
                       width: '160px', height: '160px', borderRadius: '24px', 
                       background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)', 
                       margin: '0 auto', display: 'flex', flexDirection: 'column', 
                       alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
                       overflow: 'hidden', position: 'relative',
                       transition: '0.3s'
                     }}
                     onMouseOver={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                     onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                   >
                      <input 
                        type="file" 
                        id="logo-upload-input" 
                        hidden 
                        accept="image/*" 
                        onChange={handleLogoUpload} 
                      />
                      {localCompany.logo ? (
                         <img src={localCompany.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                         <>
                            <Upload size={30} style={{ opacity: 0.3, marginBottom: '10px' }} />
                            <span style={{ fontSize: '0.65rem', opacity: 0.4 }}>Subir Logo</span>
                         </>
                      )}
                   </div>
                </div>
             </div>

             <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '40px 0' }} />

             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Sucursales</h3>
                 <button 
                  onClick={() => {
                    setNewObjective({ nombre: '', address: '' });
                    setNewObjectiveCoords(null);
                    setShowNewObjectiveModal(true);
                  }}
                  style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', padding: '8px 20px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                   + NUEVA SUCURSAL
                </button>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {Array.isArray(objectives) && objectives.map(obj => (
                   <div key={obj.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                         <div>
                            <div style={{ fontWeight: 'bold' }}>{obj.nombre}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>{obj.address || 'Ubicación sin datos'}</div>
                         </div>
                         <div 
                           onClick={() => toggleBranchStatus(obj.id)}
                           style={{ width: '44px', height: '24px', background: obj.activo === false ? 'rgba(255,255,255,0.1)' : '#10b981', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
                            <div style={{ position: 'absolute', top: '3px', left: obj.activo === false ? '3px' : '23px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', transition: '0.3s' }} />
                         </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ color: 'rgba(255,255,255,0.4)' }}>Personal Asignado:</span>
                         <span style={{ fontWeight: 'bold' }}>{Array.isArray(companyUsers) ? companyUsers.filter(u => u.schedule?.objectiveId === obj.id).length : 0}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* TAB: USUARIOS */}
        {activeSubTab === 'Usuarios' && (
          <div className="fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Administración de Accesos</h3>
                <button 
                  onClick={async () => {
                    setNewUser({ 
                      ...newUser, 
                      empresaId: companyData?.id || companyData?.uid,
                      rol: 'ADMIN EMPRESA'
                    });
                    setShowUserModal(true);
                  }}
                  style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                   CREAR USUARIO
                </button>
             </div>

             <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                   <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                         <th style={{ padding: '20px' }}>NOMBRE</th>
                         <th style={{ padding: '20px' }}>ROL</th>
                         <th style={{ padding: '20px' }}>ESTADO</th>
                         <th style={{ padding: '20px', textAlign: 'right' }}>ACCIONES</th>
                      </tr>
                   </thead>
                   <tbody>
                      {companyUsers
                        .filter(u => ['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'DUEÑO'].includes((u.rol || u.role || '').trim().toUpperCase()))
                        .filter(u => (u.email || '').toLowerCase() !== 'vidal@master.com')
                        .map(u => (
                         <tr key={u.id || u.uid} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '20px' }}>
                               <div style={{ fontWeight: 'bold' }}>{u.nombre} {u.apellido}</div>
                               <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{u.email}</div>
                            </td>
                            <td style={{ padding: '20px' }}>
                               <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}>
                                  {u.rol?.toUpperCase()}
                               </span>
                            </td>
                            <td style={{ padding: '20px' }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.activo !== false ? '#10b981' : '#ef4444' }} />
                                  <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{u.activo !== false ? 'Activo' : 'Inactivo'}</span>
                               </div>
                            </td>
                            <td style={{ padding: '20px', textAlign: 'right' }}>
                               <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                  <button onClick={() => toggleUserStatus(u.id || u.uid, u.activo !== false)} style={{ background: 'transparent', border: 'none', color: u.activo !== false ? '#ef4444' : '#10b981', cursor: 'pointer', fontSize: '0.8rem' }}>
                                     {u.activo !== false ? 'Desactivar' : 'Activar'}
                                  </button>
                                  <button onClick={async () => {
                                      setSelectedUserForView(u);
                                   }} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem' }}>Editar</button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}


        {/* TAB: ALMACENAMIENTO */}
        {activeSubTab === 'Almacenamiento' && (
          <div className="fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Optimización de Almacenamiento</h3>
                <button 
                  onClick={() => showToast("Liberando espacio. Se han eliminado 240MB de logs antiguos.")}
                  style={{ background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '10px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                   LIBERAR ESPACIO
                </button>
             </div>

             <div style={{ background: 'rgba(0,0,0,0.2)', padding: '40px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                   <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Uso de Archivos</span>
                   <span style={{ color: 'rgba(255,255,255,0.4)' }}>2.3 GB / 50 GB (4.6%)</span>
                </div>
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden', display: 'flex' }}>
                   <div style={{ width: '0.8%', background: '#3b82f6', height: '100%' }} title="Imágenes" />
                   <div style={{ width: '3.6%', background: '#8b5cf6', height: '100%' }} title="Videos" />
                   <div style={{ width: '0.2%', background: '#10b981', height: '100%' }} title="Logs" />
                </div>
                
                <div style={{ display: 'flex', gap: '30px', marginTop: '30px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} /> <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Imágenes (400 MB)</span></div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8b5cf6' }} /> <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Videos (1.8 GB)</span></div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /> <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Logs (100 MB)</span></div>
                </div>
             </div>

             <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Política de Retención Automática</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '5px' }}>Los archivos se eliminarán permanentemente según esta configuración para cumplir con el RGPD.</div>
                   </div>
                   <select style={{ background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 25px', borderRadius: '12px', outline: 'none' }}>
                      <option>Retener por 30 días</option>
                      <option>Retener por 60 días</option>
                      <option selected>Retener por 90 días</option>
                   </select>
                </div>
             </div>
          </div>
        )}

        {/* TAB: SONIDO */}
        {activeSubTab === 'Sonido' && (
          <div className="fade-in">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Configuración de Audio</h3>
                {isPanicActive && (
                  <button 
                    onClick={stopPanic}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
                  >
                    <AlertCircle size={18} /> DETENER ALARMA DE PÁNICO
                  </button>
                )}
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <div>
                         <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Sonidos Generales</div>
                         <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginTop: '5px' }}>Habilitar notificaciones auditivas para eventos normales.</div>
                      </div>
                      <div 
                        onClick={() => saveSettings({ enabled: !settings.enabled })}
                        style={{ width: '50px', height: '26px', background: settings.enabled ? '#3b82f6' : 'rgba(255,255,255,0.1)', borderRadius: '13px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}
                      >
                         <div style={{ position: 'absolute', top: '3px', left: settings.enabled ? '27px' : '3px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: '0.3s' }} />
                      </div>
                   </div>

                   <div style={{ marginBottom: '25px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', marginBottom: '15px', display: 'block' }}>VOLUMEN GENERAL: {Math.round(settings.generalVolume * 100)}%</label>
                      <input 
                        type="range" min="0" max="1" step="0.01" 
                        value={settings.generalVolume} 
                        onChange={(e) => saveSettings({ generalVolume: parseFloat(e.target.value) })}
                        style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }}
                      />
                   </div>

                   <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => testSound('normal')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>PROBAR NORMAL</button>
                      <button onClick={() => testSound('qr')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}>PROBAR QR</button>
                   </div>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '30px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                   <div style={{ marginBottom: '25px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fca5a5' }}>Alarma de Pánico</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(252, 165, 165, 0.5)', marginTop: '5px' }}>Configuración crítica. Esta alarma no se puede desactivar por completo.</div>
                   </div>
                   <div style={{ marginBottom: '25px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(252, 165, 165, 0.6)', fontWeight: 'bold', marginBottom: '15px', display: 'block' }}>VOLUMEN DE PÁNICO (MÍN. 30%): {Math.round(settings.panicVolume * 100)}%</label>
                      <input 
                        type="range" min="0.3" max="1" step="0.01" 
                        value={settings.panicVolume} 
                        onChange={(e) => saveSettings({ panicVolume: parseFloat(e.target.value) })}
                        style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
                      />
                   </div>
                   <button onClick={() => testSound('panico')} style={{ width: '100%', background: '#ef4444', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}>PROBAR SIRENA</button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};


const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { playSound, speak, autoplayBlocked, setAutoplayBlocked, stopPanic, stopMissedRound, isPanicActive, isMissedRoundActive } = useSound();
  const lastEventIdRef = useRef(null);

  const [activeItem, setActiveItem] = useState('Tablero');
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => setShowUserModal(true);
    document.addEventListener('openUserModal', handleOpenModal);
    return () => document.removeEventListener('openUserModal', handleOpenModal);
  }, []);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [companyData, setCompanyData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [newObjective, setNewObjective] = useState({ nombre: '', address: '' });
  const [newObjectiveCoords, setNewObjectiveCoords] = useState(null);
  const [showNewObjectiveModal, setShowNewObjectiveModal] = useState(false);

  // Rondas QR States
  const [qrPoints, setQrPoints] = useState([]);
  const [newQrPoint, setNewQrPoint] = useState({ name: '', objectiveId: '', horarios: [] });
  const [tempSchedule, setTempSchedule] = useState({ hora: '08:00', tolerancia: 10 });
  const [selectedQrObjective, setSelectedQrObjective] = useState('');
  const [activeRondaSubTab, setActiveRondaSubTab] = useState('puntos'); // 'puntos' | 'rondas'
  const [newRonda, setNewRonda] = useState({ 
    nombre: '', 
    objectiveId: '', 
    startTime: '22:00', 
    endTime: '06:00', 
    tolerance: 15, 
    days: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'],
    assignedQrIds: [] 
  });
  const [showQrExportModal, setShowQrExportModal] = useState(false);
  const [qrExportConfig, setQrExportConfig] = useState({ perPage: 1, layout: 'full' });
  const [qrSizePrint, setQrSizePrint] = useState(300);
  const [generatedQrImages, setGeneratedQrImages] = useState({}); // { [pointId]: base64 }
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);


  // Resumen States
  const [events, setEvents] = useState([]);
  const [rondas, setRondas] = useState([]);
  const [resumenFilters, setResumenFilters] = useState({ objetivo: '', guardia: '', tipo: '' });
  const [mediaModal, setMediaModal] = useState({ show: false, content: null, type: null, event: null });

  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(null);
  const [selectedHistoryWeek, setSelectedHistoryWeek] = useState(null);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const alertedMissedRoundsRef = useRef(new Set());
  const [activeMissedRounds, setActiveMissedRounds] = useState([]);
  const [activePanics, setActivePanics] = useState([]);
  useEffect(() => {
    if (showQrExportModal) {
      const generateImages = async () => {
        setIsGeneratingQr(true);
        const pointsToExport = qrPoints.filter(p => !selectedQrObjective || p.objectiveId === selectedQrObjective);
        const images = {};
        
        try {
          await Promise.all(pointsToExport.map(async (p) => {
            const text = JSON.stringify({ id: p.id, type: 'ronda_qr' });
            const dataUrl = await QRCode.toDataURL(text, {
              width: 1024,
              margin: 2,
              errorCorrectionLevel: 'H',
              color: { dark: '#000000', light: '#ffffff' }
            });
            images[p.id] = dataUrl;
          }));
          setGeneratedQrImages(images);
        } catch (err) {
          console.error("Error generando QR:", err);
          showToast("Error al generar imágenes QR", "error");
        } finally {
          setIsGeneratingQr(false);
        }
      };
      generateImages();
    }
  }, [showQrExportModal, qrPoints, selectedQrObjective]);

  const handleExportQR_PDF = () => {
    const pointsToExport = qrPoints.filter(p => !selectedQrObjective || p.objectiveId === selectedQrObjective);
    if (pointsToExport.length === 0) {
      showToast("No hay puntos para exportar", "warning");
      return;
    }

    const printWindow = window.open('', '_blank');
    const companyName = companyData?.nombre || user?.company || 'CENTINELA SECURITY';

    let html = `
      <html>
        <head>
          <title>Exportación de QR - ${companyName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: white; }
            @page { size: A4 portrait; margin: 0; }
            
            /* Una por página */
            .page {
              width: 210mm; height: 297mm;
              page-break-after: always;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              text-align: center; box-sizing: border-box;
            }
            .page-inner {
              width: 180mm; height: 260mm; border: 2pt solid #000; border-radius: 10mm;
              display: flex; flex-direction: column; align-items: center; justify-content: space-between;
              padding: 20mm; box-sizing: border-box;
            }
            .brand { font-size: 18pt; font-weight: 900; letter-spacing: 5pt; text-transform: uppercase; color: #000; }
            .obj { font-size: 24pt; font-weight: 700; color: #666; text-transform: uppercase; }
            .point-name { font-size: 44pt; font-weight: 900; color: #000; margin: 20mm 0; text-transform: uppercase; line-height: 1.1; }
            .qr-wrap img { display: block; margin: 0 auto; }
            .meta { font-family: monospace; font-size: 12pt; font-weight: bold; color: #888; margin-top: 10mm; }
            .footer { font-size: 11pt; font-weight: bold; color: #ccc; border-top: 1pt solid #eee; width: 80%; padding-top: 5mm; }

            /* Etiquetas (Grid) */
            .labels-grid {
              width: 210mm; padding: 10mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm;
            }
            .label-item {
              border: 1pt dashed #000; padding: 5mm; display: flex; flex-direction: column; align-items: center; text-align: center;
              page-break-inside: avoid; background: white;
            }
            .l-brand { font-size: 10pt; font-weight: 900; color: #3b82f6; margin-bottom: 2mm; text-transform: uppercase; }
            .l-name { font-size: 13pt; font-weight: 900; height: 14mm; display: flex; align-items: center; justify-content: center; line-height: 1.1; text-transform: uppercase; margin-bottom: 2mm; }
            .l-qr img { width: 90px; height: 90px; }
          </style>
        </head>
        <body>
    `;

    if (qrExportConfig.layout === 'full') {
      pointsToExport.forEach(p => {
        const obj = objectives.find(o => o.id === p.objectiveId);
        const qrImg = generatedQrImages[p.id];
        html += `
          <div class="page">
            <div class="page-inner">
              <div class="brand">${companyName}</div>
              <div class="obj">${obj?.nombre || 'OBJETIVO GENERAL'}</div>
              <div class="point-name">${p.name}</div>
              <div class="qr-wrap">
                <img src="${qrImg}" style="width:${qrSizePrint}px; height:${qrSizePrint}px" />
              </div>
              <div class="meta">ID: ${p.id} | CODE: ${p.code || 'N/A'}</div>
              <div class="footer">CENTINELA 2.0 - SISTEMA DE MONITOREO</div>
            </div>
          </div>
        `;
      });
    } else {
      html += '<div class="labels-grid">';
      pointsToExport.forEach(p => {
        const obj = objectives.find(o => o.id === p.objectiveId);
        const qrImg = generatedQrImages[p.id];
        html += `
          <div class="label-item">
            <div class="l-brand">CENTINELA</div>
            <div class="l-name">${p.name}</div>
            <div class="l-qr"><img src="${qrImg}" /></div>
            <div style="font-size:7pt; margin-top:5px; font-family:monospace;">${p.code}</div>
          </div>
        `;
      });
      html += '</div>';
    }

    html += `
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => {
    // El loop de voz y sonido ahora se gestiona centralizado en SoundContext
    // para evitar solapamientos. 
  }, []);

  // Soporte States
  const [tickets, setTickets] = useState([]);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ asunto: '', descripcion: '', prioridad: 'Media', tipo: 'Consulta' });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [chatReply, setChatReply] = useState("");


  const handleRateTicket = (stars) => {
    if (!selectedTicket) return;
    const updated = { ...selectedTicket, rating: stars };
    const allT = JSON.parse(localStorage.getItem('centinela_tickets') || '[]');
    const newAll = allT.map(t => t.id === selectedTicket.id ? updated : t);
    localStorage.setItem('centinela_tickets', JSON.stringify(newAll));
    setTickets(tickets.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
  };

  const handleSendResponse = () => {
    if (!chatReply.trim() || !selectedTicket) return;
    const updatedTicket = { ...selectedTicket, respuestas: [...(selectedTicket.respuestas || []), { autor: 'EMPRESA', texto: chatReply, fecha: new Date().toISOString() }] };
    const allTickets = JSON.parse(localStorage.getItem('centinela_tickets') || '[]');
    const newAll = allTickets.map(t => t.id === selectedTicket.id ? updatedTicket : t);
    localStorage.setItem('centinela_tickets', JSON.stringify(newAll));

    // Actualizar state
    setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
    setChatReply("");
  };


  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const handleAddTicket = () => {
    if (!newTicket.asunto || !newTicket.descripcion) {
      showToast("Por favor complete todos los campos", "error");
      return;
    }

    const ticket = {
      id: 'TK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      empresaId: companyData?.id || companyData?.uid,
      nombreEmpresa: companyData?.nombre || user?.company || (user?.role === 'SUPERADMIN' ? 'MASTER' : 'CENTINELA'),
      ...newTicket,
      status: 'Abierto',
      fecha: new Date().toISOString(),
      respuestas: [],
      logs: [] // Para futuras acciones de soporte
    };

    const allTickets = JSON.parse(localStorage.getItem('centinela_tickets') || '[]');
    const updatedTickets = [ticket, ...allTickets];
    localStorage.setItem('centinela_tickets', JSON.stringify(updatedTickets));
    
    // Solo mostramos los tickets de esta empresa en el state local
    setTickets(updatedTickets.filter(t => t.empresaId === (companyData?.id || companyData?.uid)));
    setShowNewTicketModal(false);
    setNewTicket({ asunto: '', descripcion: '', prioridad: 'Media', tipo: 'Consulta' });
    showToast("✅ Consulta enviada con éxito. Un analista revisará su caso a la brevedad.");
  };

  const handleAddGuard = async (e) => {
    e.preventDefault();
    if (!newUser.nombre || !newUser.apellido || !newUser.email) {
      showToast("Nombre, Apellido y Email de Acceso son obligatorios", "error");
      return;
    }

    setIsSaving(true);
    try {
      const uid = newUser.id || newUser.uid || `user_${Date.now()}`;
      const payload = {
        ...newUser,
        id: uid,
        uid: uid,
        name: newUser.nombre,
        surname: newUser.apellido,
        dni: newUser.dni,
        legajo: newUser.legajo,
        personal_email: newUser.emailPersonal,
        birth_date: newUser.fechaNacimiento,
        phone: newUser.telefono,
        companyId: user.empresaId,
        status: 'activo'
      };

      await db.crearUsuarioSaaS(payload, user.empresaId);
      showToast(newUser.id || newUser.uid ? "Usuario actualizado" : "Usuario registrado con éxito");
      setShowUserModal(false);
      setNewUser({ 
        nombre: '', apellido: '', dni: '', legajo: '', 
        email: '', emailPersonal: '', fechaNacimiento: '', 
          rol: 'GUARDIA', telefono: '', password: 'password123' 
        });
        loadData();
    } catch (error) {
      showToast("Error al guardar usuario", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const [showTrashModal, setShowTrashModal] = useState(false);
  const [trashItems, setTrashItems] = useState([]);

  // Validación de Licencia Estratégica
  const isLicenseDisabled = useMemo(() => {
    // REGLA DE ORO: El Super Admin tiene inmunidad total de acceso
    if (user?.role === 'SUPERADMIN' || (user?.role || '').toUpperCase() === 'SUPERADMIN' || user?.email === 'vidal@master.com') return false;
    
    if (!companyData) return false; // No bloqueamos mientras carga
    
    // 1. Si el estado es activa y no hay fecha, permitimos el paso preventivamente
    const currentStatus = (companyData.status || '').toLowerCase();
    if (currentStatus === 'activa' && !companyData.expiryDate) return false;

    // 2. Verificar existencia de licencia definida
    if (!companyData.expiryDate) return true; 
    
    // 3. Verificar que el estado sea explícitamente 'activa'
    if (currentStatus !== 'activa') return true;
    
    // 4. Verificar vigencia temporal (Parsing seguro de fecha)
    try {
        const expiry = new Date(companyData.expiryDate);
        if (isNaN(expiry.getTime())) return false; // Si la fecha es inválida, no bloqueamos preventivamente
        
        const today = new Date();
        expiry.setHours(23, 59, 59, 999);
        
        return expiry < today;
    } catch(e) {
        return false;
    }
  }, [companyData, user]);
  const [selectedUserForView, setSelectedUserForView] = useState(null);
  const [fullscreenMedia, setFullscreenMedia] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const [newUser, setNewUser] = useState({ 
    nombre: '', 
    apellido: '', 
    dni: '', 
    legajo: '', 
    email: '', 
    emailPersonal: '', 
    fechaNacimiento: '', 
    rol: 'GUARD', 
    telefono: '', 
    password: 'password123' 
  });

  const [scheduleUpdate, setScheduleUpdate] = useState({
    startTime: '06:00', endTime: '18:00', objectiveId: '', workingDays: []
  });
  const [locations, setLocations] = useState([]);

  if (!user) return null;

  const permisos = useMemo(() => {
    let base;
    try {
      const rawPlan = (companyData?.plan || companyData?.planId || 'demo').toLowerCase();
      let cleanId = rawPlan;
      if (rawPlan.includes('demo')) cleanId = 'demo';
      if (rawPlan.includes('basi')) cleanId = 'basico';
      if (rawPlan.includes('prof')) cleanId = 'profesional';
      if (rawPlan.includes('ent')) cleanId = 'enterprise';
      
      base = getPlanPermisos(cleanId);
    } catch (e) {
      base = { gps: false, rondas: false };
    }

    // SUPPORT OVERRIDES (Motor de Automatización / Editor de Botones)
    if (companyData?.customUI) {
      return {
        ...base,
        gps: companyData.customUI.showGPS ?? base.gps,
        rondas: companyData.customUI.showQR ?? base.rondas,
        // Alertas de pánico y otros se manejan por visibilidad de componente
      };
    }
    return base;
  }, [companyData]);

  const currentPlanInfo = useMemo(() => {
    const pId = (companyData?.plan || companyData?.planId || 'demo').toLowerCase();
    // Normalización de nombres a IDs
    let cleanId = pId;
    if (pId.includes('demo')) cleanId = 'demo';
    if (pId.includes('basi')) cleanId = 'basico';
    if (pId.includes('prof')) cleanId = 'profesional';
    if (pId.includes('ent')) cleanId = 'enterprise';
    
    return PLANES[cleanId.toUpperCase()] || PLANES.DEMO;
  }, [companyData]);

  const exportToCSV = (data, filename) => {
    const headers = ['FECHA', 'HORA', 'USUARIO', 'TIPO', 'OBJETIVO', 'DESCRIPCION', 'ESTADO'];
    const rows = data.map(e => {
      const uId = e.usuarioId || e.guardiaId || (typeof e.usuario === 'object' ? (e.usuario.id || e.usuario.uid) : e.usuario);
      const u = companyUsers.find(cu => (cu.id === uId || cu.uid === uId));
      const obj = objectives.find(o => String(o.id) === String(e.objetivoId || (u?.schedule?.objectiveId)));
      
      return [
        new Date(e.fechaRegistro || e.fecha || 0).toLocaleDateString(),
        e.hora || '',
        u ? `${u.nombre || u.name} ${u.apellido || u.surname || ''}` : 'S/N',
        e.tipo || '',
        obj?.nombre || 'Puesto General',
        (e.mensaje || e.descripcion || '').replace(/,/g, ';').replace(/\n/g, ' '),
        e.status || 'Abierto'
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename + ".csv");
    link.click();
    showToast("Archivo CSV/Excel generado.");
  };

  const exportToPDF = (data, title) => {
    // ImplementaciÃ³n de impresiÃ³n optimizada para PDF
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            h2 { color: #00a8ff; border-bottom: 2px solid #00a8ff; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #eee; padding: 10px; text-align: left; }
            th { background: #f8fafc; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <h2>Reporte de Seguridad: ${title}</h2>
          <p>Generado por Sistema Centinela - Empresa: ${companyData?.nombre || 'Demo'}</p>
          <table>
            <thead>
              <tr>
                <th>FECHA/HORA</th>
                <th>USUARIO</th>
                <th>TIPO</th>
                <th>OBJETIVO</th>
                <th>DESCRIPCIÃ“N</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(e => {
                const uId = e.usuarioId || e.guardiaId || (typeof e.usuario === 'object' ? (e.usuario.id || e.usuario.uid) : e.usuario);
                const u = companyUsers.find(cu => (cu.id === uId || cu.uid === uId));
                const obj = objectives.find(o => String(o.id) === String(e.objetivoId || (u?.schedule?.objectiveId)));
                
                return `
                  <tr>
                    <td>${new Date(e.fechaRegistro || e.fecha || 0).toLocaleDateString()} ${e.hora || ''}</td>
                    <td>${u ? `${u.nombre || u.name} ${u.apellido || u.surname || ''}` : 'S/N'}</td>
                    <td>${e.tipo?.toUpperCase()}</td>
                    <td>${obj?.nombre || 'General'}</td>
                    <td>${(e.mensaje || e.descripcion || '').replace(/\(Archivos adjuntos:.*?\)/gi, '')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">Este documento es un registro oficial generado automÃ¡ticamente por la plataforma Centinela.</div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    showToast("Preparando vista de PDF...");
  };

  const toggleBranchStatus = async (branchId) => {
    // 1. Obtener objeto actual
    const obj = objectives.find(o => o.id === branchId);
    if (!obj) return;

    // 2. Determinar nuevo estado (Optimista)
    const currentStatus = obj.activo !== false;
    const nextStatus = !currentStatus;

    // 3. Actualización Optimista del Estado Local para respuesta INSTANTÁNEA
    setObjectives(prev => prev.map(o => o.id === branchId ? { ...o, activo: nextStatus } : o));
    
    try {
      // 4. Persistir en Base de Datos
      const updatedObj = { ...obj, activo: nextStatus };
      await db.crearObjective(updatedObj);
      showToast(nextStatus ? "✅ Sucursal activada" : "🌑 Sucursal desactivada");
    } catch (e) {
      console.error("Error toggling branch:", e);
      showToast("Error al sincronizar estado", "error");
      // Revertir en caso de fallo crítico
      setObjectives(prev => prev.map(o => o.id === branchId ? { ...o, activo: currentStatus } : o));
    }
  };

  // CARGA DE DATOS (REGLA DE ORO: Sincronización Real)
  const loadData = () => {
    if (!user?.empresaId) return;

    const unsubUsers = db.subscribeToAllUsers((allUsers) => {
      const normalized = allUsers.map(u => {
        let parsedSchedule = u.schedule;
        if (typeof u.schedule === 'string') {
          try {
            parsedSchedule = JSON.parse(u.schedule);
          } catch (e) {
            console.error("Error parsing schedule for user", u.id, e);
            parsedSchedule = null;
          }
        }
        return {
          ...u,
          schedule: parsedSchedule,
          nombre: u.nombre || u.name || 'Usuario',
          rol: u.rol || u.role || 'GUARDIA'
        };
      });
      const filtered = normalized.filter(u => {
        // REGLA DE ORO: Un SUPER_ADMIN nunca es parte de la dotación operativa de una empresa
        if (u.rol === 'SUPER_ADMIN' || u.role === 'SUPER_ADMIN') return false;
        
        const compId = user.empresaId || user.companyId;
        return (u.companyId === compId || u.empresaId === compId);
      });
      setCompanyUsers(filtered);
    });

    const unsubCompanies = db.subscribeToCompanies((allCompanies) => {
      const compId = user.empresaId || user.companyId;
      const found = allCompanies.find(c => String(c.id || c.uid) === String(compId));
      if (found) {
        // NORMALIZACIÓN ESTRATÉGICA (Evitar 'PREMIUM'/'CLIENTE' fantasmas)
        setCompanyData({
          ...found,
          nombre: found.name || found.nombre || user?.company || '',
          email: found.appEmail || found.email || user?.email || '',
          plan: (found.plan || found.planId || 'demo').toLowerCase()
        });
      }
    });
    const unsubEvents = db.subscribeToAllEventsGroup((allEvents) => {
      // NORMALIZACIÓN ESTRATÉGICA: Asegurar que todos los eventos tengan fechaRegistro y marcador de 'Hoy'
      const todayStr = new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
      
      const normalizedEvents = allEvents.map(e => {
        const fechaReg = e.fechaRegistro || e.created_at || e.fecha || new Date().toISOString();
        const eventDateStr = getARDateStr(fechaReg);
        return {
          ...e,
          fechaRegistro: fechaReg,
          isToday: eventDateStr === todayStr
        };
      });

      const compEvents = normalizedEvents.filter(e => String(e.empresaId || e.companyId) === String(user.empresaId || user.companyId));
      compEvents.sort((a, b) => new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0));
      setEvents(compEvents);

      // TRIGGER SOUNDS FOR NEW EVENTS
      if (compEvents.length > 0) {
        const latestEvent = compEvents[0];
        if (lastEventIdRef.current === null) {
          lastEventIdRef.current = latestEvent.id;
        } else if (latestEvent.id !== lastEventIdRef.current) {
          lastEventIdRef.current = latestEvent.id;
          handleNewEventAlert(latestEvent);
        }
      }
    });

    const unsubTickets = db.subscribeToTickets((allTickets) => {
      setTickets(allTickets.filter(t => t.empresaId === user.empresaId));
    });

    const unsubObjectives = db.subscribeToObjectives((allObjs) => {
      setObjectives(allObjs.filter(o => o.companyId === user.empresaId));
    });

    const unsubQrPoints = db.subscribeToQrPoints((allPts) => {
      setQrPoints(allPts.filter(p => p.companyId === user.empresaId));
    });

    const unsubRondas = db.subscribeToRondas((allR) => {
      const normalized = allR.map(r => ({
        ...r,
        days: typeof r.days === 'string' ? JSON.parse(r.days) : r.days,
        assignedQrIds: typeof r.assignedQrIds === 'string' ? JSON.parse(r.assignedQrIds) : r.assignedQrIds
      }));
      setRondas(normalized.filter(r => r.companyId === user.empresaId));
    });

    const unsubLocations = db.subscribeToLocations(user.empresaId, (allLocs) => {
      setLocations(allLocs);
    });

    return () => {
      unsubUsers(); unsubCompanies(); unsubEvents(); unsubTickets(); unsubObjectives(); unsubQrPoints(); unsubRondas(); unsubLocations();
    };
  };

  const handleNewEventAlert = (latestEvent) => {
    const isPanic = latestEvent.tipo === 'panico' || latestEvent.tipo === 'emergencia';
    if (isPanic) {
      const obj = objectives.find(o => o.id === latestEvent.objetivoId);
      const pName = obj?.nombre || 'Puesto Desconocido';
      playSound('panico', `ALERTA: PÁNICO EN: ${pName}`);
      setActivePanics(prev => [...prev, { id: latestEvent.id, pointName: pName }]);
      showToast(`🚨 PÁNICO EN: ${pName}`, 'error');
    } else {
      playSound('normal');
    }
  };

  useEffect(() => {
    const unsub = loadData();
    return () => unsub && unsub();
  }, [user?.empresaId]);

  const checkRondaCompliance = (currentRondas, currentEvents) => {
    const now = new Date();
    const todayNum = now.getDay(); // 0 is Sun, 1 is Mon...
    // Adjust to our DAYS array: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']
    // JS: SUN=0, MON=1, TUE=2, WED=3, THU=4, FRI=5, SAT=6
    // Map to: MON=0, TUE=1, WED=2, THU=3, FRI=4, SAT=5, SUN=6
    const daysMap = [6, 0, 1, 2, 3, 4, 5];
    const todayStr = DAYS[daysMap[todayNum]];
    
    const dateStr = now.toISOString().split('T')[0];
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

    const currentAlerted = alertedMissedRoundsRef.current;

    currentRondas.forEach(ronda => {
      // Check if ronda is scheduled for today
      if (Array.isArray(ronda.days) && ronda.days.includes(todayStr)) {
        const [rh, rm] = ronda.startTime.split(':').map(Number);
        const targetTimeMinutes = rh * 60 + rm;
        const tolerance = 2; // Strict 2 minutes as requested
        const limitTimeMinutes = targetTimeMinutes + tolerance;

        // Only check if we are past the limit but within a reasonable window (30 mins)
        if (currentTimeMinutes > limitTimeMinutes && currentTimeMinutes < limitTimeMinutes + 30) {
          
          // A round is missed if ANY of its assigned QR points haven't been scanned
          if (Array.isArray(ronda.assignedQrIds)) {
            ronda.assignedQrIds.forEach(qid => {
              const alertKey = `${dateStr}_${ronda.id}_${qid}_${ronda.startTime}`;
              
              if (!currentAlerted.has(alertKey)) {
                const wasScanned = currentEvents.some(e => {
                  const t = (e.tipo || '').toLowerCase();
                  if (t !== 'qr_scan' && t !== 'ronda' && t !== 'recorrido') return false;
                  
                  // Link point by ID
                  const isThisPoint = (e.puntoId === qid) || (e.id_punto === qid);
                  if (!isThisPoint) return false;

                  const eDate = new Date(e.fechaRegistro || e.timestamp);
                  const eDateStr = eDate.toISOString().split('T')[0];
                  const eMinutes = eDate.getHours() * 60 + eDate.getMinutes();
                  
                  // Check if scanned within start window (allowed since 15 mins before up to limit)
                  return eDateStr === dateStr && eMinutes >= (targetTimeMinutes - 15) && eMinutes <= limitTimeMinutes;
                });

                if (!wasScanned) {
                  currentAlerted.add(alertKey);
                  
                  // Find point name for more descriptive alert
                  const pt = qrPoints.find(p => p.id === qid);
                  const pName = pt?.name || 'Punto QR';
                  
                  const msg = `Atención: Punto ${pName} de la ronda ${ronda.nombre} no registrado a tiempo.`;
                  playSound('missed_round', msg);
                  
                  const newAlert = { id: alertKey, pointName: `${ronda.nombre}: ${pName}`, hora: ronda.startTime };
                  setActiveMissedRounds(prev => [...prev, newAlert]);
                  showToast(`⚠️ RONDA INCUMPLIDA: ${ronda.nombre} (${pName})`, 'error');
                }
              }
            });
          }
        }
      }
    });
  };

  const geocodeObjectiveAddress = async () => {
    if (!newObjective.address) return;
    setIsSaving(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newObjective.address)}&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setNewObjectiveCoords(coords);
        alert("📍  Ubicación encontrada y marcada en el mapa de vista previa.");
      } else {
        alert("Ãƒ¢Ã‚ Ã…â€™ No se pudo encontrar la dirección. Intenta ser más específico.");
      }
    } catch (error) {
      alert("Ãƒ¢Ã…¡Ã‚ Ãƒ¯Ã‚¸Ã‚  Error al conectar con el servicio de mapas.");
    }
    setIsSaving(false);
  };

  const handleSaveObjective = async () => {
    if (!newObjective.nombre || !newObjectiveCoords) {
      alert("Complete el nombre y verifique la dirección en el mapa antes de guardar.");
      return;
    }
    setIsSaving(true);
    try {
        const id = "obj_" + Date.now();
        await db.crearObjective({
            id,
            companyId: user.empresaId,
            name: newObjective.nombre,
            nombre: newObjective.nombre,
            address: newObjective.address,
            lat: newObjectiveCoords.lat,
            lng: newObjectiveCoords.lng
        });
        showToast("✅ Objetivo guardado en servidor.");
        setNewObjective({ nombre: '', address: '' });
        setNewObjectiveCoords(null);
        loadData();
    } catch (err) {
        alert("Error al guardar objetivo: " + err.message);
    } finally {
        setIsSaving(false);
    }
  };


  const handleEditUserSave = async (e) => {
    e.preventDefault();
    if (!editingUser.nombre || !editingUser.apellido || !editingUser.email) {
      showToast("Nombre, Apellido y Email de Acceso son obligatorios", "error");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...editingUser,
        name: editingUser.nombre,
        surname: editingUser.apellido,
        dni: editingUser.dni,
        legajo: editingUser.legajo,
        personal_email: editingUser.emailPersonal,
        birth_date: editingUser.fechaNacimiento,
        phone: editingUser.telefono,
        rol: editingUser.rol, // Asegurar que use el nuevo valor
        companyId: user.empresaId,
        status: editingUser.estado || editingUser.status || 'activo'
      };

      await db.crearUsuarioSaaS(payload, user.empresaId);
      showToast("Datos actualizados correctamente.");
      setShowEditUserModal(false);
      setEditingUser(null);
      loadData();
    } catch (error) {
      showToast("Error al sincronizar con el servidor", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const resetUserAccess = async (userId) => {
    if (confirm("¿Está seguro de que desea blanquear la contraseña de este usuario a 'password123'? El sistema forzará el cambio al ingresar.")) {
      try {
        const targetUser = companyUsers.find(u => (u.id === userId || u.uid === userId));
        if (!targetUser) return;

        await db.crearUsuarioSaaS({ ...targetUser, password: 'password123', mustChangePassword: true }, user.empresaId);
        showToast("Contraseña restablecida correctamente.");
      } catch (error) {
        showToast("Error al restablecer contraseña: " + error.message, "error");
      }
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const targetUser = companyUsers.find(u => (u.id === userId || u.uid === userId));
      if (!targetUser) return;

      await db.crearUsuarioSaaS({ ...targetUser, rol: newRole, role: newRole }, user.empresaId);
      showToast("Rol de usuario actualizado.");
      loadData();
      if (selectedUserForView && (selectedUserForView.id === userId || selectedUserForView.uid === userId)) {
        setSelectedUserForView({ ...selectedUserForView, rol: newRole });
      }
    } catch (error) {
      showToast("Error al actualizar rol: " + error.message, "error");
    }
  };

  const handleUpdateUserPhoto = (userId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      optimizeImage(file, async (base64) => {
        try {
          const targetUser = companyUsers.find(u => (u.id === userId || u.uid === userId));
          if (!targetUser) return;
          await db.crearUsuarioSaaS({ ...targetUser, foto: base64 }, user.empresaId);
          showToast("Fotografía actualizada.");
          loadData();
          if (selectedUserForView && (selectedUserForView.id === userId || selectedUserForView.uid === userId)) {
            setSelectedUserForView({ ...selectedUserForView, foto: base64 });
          }
        } catch (err) {
          showToast("Error al subir foto", "error");
        }
      });
    };
    input.click();
  };

  const handleSoftDeleteUser = async (u) => {
    if (!window.confirm(`¿Eliminar definitivamente a ${u.nombre || u.name}? Esta acción no se puede deshacer.`)) return;
    try {
        await db.eliminarUsuario(u.id || u.uid);
        showToast("✅ Usuario eliminado permanentemente.");
        loadData();
    } catch (err) {
        showToast("Error al eliminar usuario: " + err.message, "error");
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Preparar data base del ticket
    const ticketData = {
      ...newTicket,
      companyId: user.empresaId,
      nombreEmpresa: user.orgName || user.empresa || 'Empresa Cliente',
      empresaPlan: user.empresaPlan || 'standard',
      usuarioId: user.id || user.uid,
      usuarioNombre: user.nombre + (user.apellido ? ' ' + user.apellido : ''),
      usuarioEmail: user.email,
      fecha: new Date().toISOString(),
      status: 'Nuevo',
      respuestas: []
    };

    // Registrar vía motor de automatización
    await db.registrarNuevoTicket(ticketData);

    setTimeout(() => {
      loadData();
      setShowNewTicketModal(false);
      setIsSaving(false);
      setNewTicket({ asunto: '', descripcion: '', prioridad: 'Media', tipo: 'Consulta' });
      showToast("Ticket enviado con éxito. El soporte técnico ha sido notificado.");
    }, 1000);
  };

  const handleOpenShift = (user) => {
    setSelectedUser(user);
    setScheduleUpdate(user.schedule || { startTime: '06:00', endTime: '18:00', objectiveId: '', workingDays: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE'] });
    setShowShiftModal(true);
  };

  const toggleDay = (day) => {
    setScheduleUpdate(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day) ? prev.workingDays.filter(d => d !== day) : [...prev.workingDays, day]
    }));
  };

  const saveSchedule = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const updatedUser = { 
        ...selectedUser, 
        schedule: scheduleUpdate,
        personal_email: selectedUser.personal_email || selectedUser.emailPersonal,
        birth_date: selectedUser.birth_date || selectedUser.fechaNacimiento,
        phone: selectedUser.phone || selectedUser.telefono,
        name: selectedUser.nombre || selectedUser.name,
        surname: selectedUser.apellido || selectedUser.surname,
        rol: selectedUser.rol || selectedUser.role
      };
      
      await db.crearUsuarioSaaS(updatedUser, user.empresaId);
      showToast("Agenda actualizada correctamente.");
      
      setTimeout(() => {
        loadData();
        setShowShiftModal(false);
        setIsSaving(false);
      }, 500);
    } catch (error) {
      showToast("Error al actualizar la agenda", "error");
      setIsSaving(false);
    }
  };

  const handleUpdateEventStatus = async (status) => {
    if (!mediaModal.event) return;
    setIsSaving(true);
    
    // Create new history entry
    const historyEntry = {
      user: user.nombre + (user.apellido ? ' ' + user.apellido : ''),
      userId: user.id || user.uid,
      role: user.rol,
      status,
      resolution: resolutionText,
      date: new Date().toISOString()
    };

    try {
      // Parsear historial previo si viene como string
      let currentHistory = mediaModal.event.history;
      if (typeof currentHistory === 'string') {
        try { currentHistory = JSON.parse(currentHistory); } catch(e) { currentHistory = []; }
      }
      if (!Array.isArray(currentHistory)) currentHistory = [];

      const updatedHistory = [...currentHistory, historyEntry];

      await db.actualizarEvento(mediaModal.event.id, {
        status,
        resolution: resolutionText,
        history: updatedHistory
      });

      // Actualizar localmente para feedback inmediato
      const updatedEvent = {
        ...mediaModal.event,
        status,
        resolution: resolutionText,
        history: updatedHistory
      };

      setMediaModal(prev => ({ ...prev, event: updatedEvent }));
      setResolutionText('');
      showToast("Gestión registrada exitosamente.");
      
      // Recargar datos globales para refrescar las tablas
      setTimeout(loadData, 500);

    } catch (err) {
      console.error("Error actualizando evento:", err);
      showToast(err.message || "Error al guardar la gestión.", "error");
    } finally {
      setIsSaving(false);
    }
  };




  const optimizeImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 400;

        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.7)); // 70% quality jpeg
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: 'white', display: 'flex', fontFamily: "'Outfit', sans-serif", position: 'relative' }}>

      {/* ALERTAS FLOTANTES (PÁNICO Y RONDAS) */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 10000, display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
        {/* PANEL DE PÁNICO (PRIORIDAD ALTA) */}
        {companyData?.customUI?.showPanic !== false && activePanics.map((alert) => (
          <div 
            key={alert.id} 
            className="fade-in" 
            style={{ 
              background: '#ef4444', 
              color: 'white', 
              padding: '25px', 
              borderRadius: '24px', 
              boxShadow: '0 20px 50px rgba(239, 68, 68, 0.6)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              animation: 'pulse-panic 1.5s infinite'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'white', color: '#ef4444', padding: '12px', borderRadius: '15px' }}>
                <ShieldAlert size={32} />
              </div>
              <div>
                <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '1px' }}>EMERGENCIA: PÁNICO</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', opacity: 0.9 }}>{alert.pointName}</div>
              </div>
            </div>
            <button 
              onClick={async () => {
                const updated = activePanics.filter(a => a.id !== alert.id);
                setActivePanics(updated);
                if (updated.length === 0) stopPanic();
              }}
              style={{ background: 'white', color: '#ef4444', border: 'none', padding: '12px', borderRadius: '15px', fontSize: '0.9rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' }}
            >
              SILENCIAR ALERTA
            </button>
          </div>
        ))}

        {/* PANEL DE RONDAS */}
        {activeMissedRounds.map((alert) => (
          <div 
            key={alert.id} 
            className="fade-in" 
            style={{ 
              background: 'rgba(239, 68, 68, 0.95)', 
              color: 'white', 
              padding: '20px', 
              borderRadius: '20px', 
              boxShadow: '0 15px 35px rgba(239, 68, 68, 0.4)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: 'white', color: '#ef4444', padding: '10px', borderRadius: '12px' }}>
                <ShieldAlert size={24} />
              </div>
              <div>
                <div style={{ fontWeight: '900', fontSize: '0.8rem' }}>RONDA INCUMPLIDA</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '900' }}>{alert.pointName}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Horario: {alert.hora}</div>
              </div>
            </div>
            <button 
              onClick={async () => {
                const updated = activeMissedRounds.filter(a => a.id !== alert.id);
                setActiveMissedRounds(updated);
                if (updated.length === 0) stopMissedRound();
              }}
              style={{ background: 'white', color: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              SILENCIAR
            </button>
          </div>
        ))}
      </div>

      {/* OVERLAY DE BLOQUEO POR LICENCIA (CONTROL DE ACCESO) */}
      {isLicenseDisabled && activeItem !== 'Facturación' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(2, 6, 23, 0.96)', backdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="glass fade-up" style={{ 
            maxWidth: '500px', width: '100%', padding: '50px', 
            borderRadius: '40px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 25px 60px rgba(239, 68, 68, 0.2)'
          }}>
            <div style={{ 
              width: '100px', height: '100px', borderRadius: '30px', background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444',
              margin: '0 auto 30px', boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)'
            }}>
              <ShieldX size={55} />
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '15px', color: '#fff', letterSpacing: '-1px' }}>Licencia requerida</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '35px' }}>
              Tu licencia no está activa o ha vencido. Para continuar utilizando el sistema, debes renovar tu plan.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => setActiveItem('Facturación')}
                className="primary" 
                style={{ padding: '22px', fontSize: '1.1rem', background: '#ef4444', border: 'none', fontWeight: '900', letterSpacing: '1px' }}
              >
                IR A FACTURACIÓN
              </button>
              <button 
                onClick={logout}
                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', cursor: 'pointer', marginTop: '10px' }}
              >
                Cerrar Sesión Protegida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="noprint" style={{ width: '280px', background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '40px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo-centinela.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,210,255,0.3))' }} />
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '2px', background: 'linear-gradient(to right, #00d2ff, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>CENTINELA</h1>
            <p style={{ fontSize: '0.75rem', color: '#00d2ff', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: '900', marginTop: '2px' }}>
              {companyData?.nombre || companyData?.name || user?.company || 'STARK INDUSTRIES'}
            </p>
            <div style={{ marginTop: '5px' }}>
              <span style={{ 
                fontSize: '0.5rem', 
                padding: '2px 8px', 
                borderRadius: '8px', 
                background: 'rgba(59, 130, 246, 0.1)', 
                color: '#3b82f6', 
                border: '1px solid rgba(59, 130, 246, 0.2)',
                fontWeight: '900',
                letterSpacing: '1px'
              }}>
                MODO: {currentPlanInfo?.nombre?.replace('Plan ', '').toUpperCase() || 'DEMO'}
              </span>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '20px 0' }}>
          <NavItem icon={<LayoutDashboard size={20} />} label="RESUMEN" active={activeItem === 'Tablero'} onClick={() => setActiveItem('Tablero')} />
          
          {permisos.gps && (
            <NavItem icon={<Map size={20} />} label="MONITOREO" active={activeItem === 'Monitoreo'} onClick={() => setActiveItem('Monitoreo')} />
          )}
          
          {/* Menu items restricted for OPERADOR */}
          {user?.rol !== ROLES.OPERADOR && (
            <NavItem icon={<Users size={20} />} label="DOTACIÓN" active={activeItem === "Dotacion"} onClick={() => setActiveItem("Dotacion")} />
          )}
          
          <NavItem icon={<Calendar size={20} />} label="TURNOS" active={activeItem === 'Turnos'} onClick={() => setActiveItem('Turnos')} />
          
          {permisos.rondas && user?.rol !== ROLES.OPERADOR && (
            <NavItem icon={<QrCode size={20} />} label="RONDAS QR" active={activeItem === 'Rondas'} onClick={() => setActiveItem('Rondas')} />
          )}
          
          <NavItem icon={<MessageSquare size={20} />} label="SOPORTE" active={activeItem === 'Soporte'} onClick={() => setActiveItem('Soporte')} />
          
          {(companyData?.customUI?.showBilling !== false && user?.rol !== ROLES.OPERADOR) && (
            <NavItem icon={<Wallet size={20} />} label="FACTURACIÓN" active={activeItem === 'Facturación'} onClick={() => setActiveItem('Facturación')} />
          )}
          
          <NavItem icon={<History size={20} />} label="HISTORIAL" active={activeItem === 'Historial'} onClick={() => setActiveItem('Historial')} />
          
          {(companyData?.customUI?.showConfig !== false && user?.rol !== ROLES.OPERADOR) && (
            <NavItem icon={<Settings size={20} />} label="CONFIGURACIÓN" active={activeItem === 'Configuración'} onClick={() => setActiveItem('Configuración')} />
          )}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={logout} style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
            <LogOut size={18} /> CERRAR SESIÓN
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', position: 'relative' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>GESTIÓN DE {activeItem.toUpperCase()}</h2>
          </div>
          {activeItem === 'Dotacion' && (
            <button className="primary" onClick={() => setShowUserModal(true)} style={{ padding: '12px 25px', borderRadius: '12px' }}>
              <Plus size={18} /> AGREGAR GUARDIA
            </button>
          )}
          {activeItem === 'Soporte' && (
            <button className="primary" onClick={() => setShowNewTicketModal(true)} style={{ padding: '12px 25px', borderRadius: '12px' }}>
              <MessageSquare size={18} /> NUEVA CONSULTA
            </button>
          )}
        </header>

        {/* ALERTA DE AUTOPLAY BLOQUEADO */}
        {autoplayBlocked && (
          <div className="fade-in" style={{
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            borderLeft: '4px solid #3b82f6',
            padding: '15px 25px',
            borderRadius: '12px',
            marginBottom: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Volume2 size={24} style={{ color: '#3b82f6' }} />
              <div>
                <div style={{ fontWeight: '900', fontSize: '0.9rem', color: '#fff' }}>EL AUDIO ESTÁ SILENCIADO</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>Haz clic en el botón para habilitar las alertas auditivas en este navegador.</div>
              </div>
            </div>
            <button 
              onClick={async () => {
                testSound('normal');
                setAutoplayBlocked(false);
              }}
              style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ACTIVAR SONIDO
            </button>
          </div>
        )}


        {/* DOTACIÓN (Diseño de Tarjetas Premium) */}
        {activeItem === 'Dotacion' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Buscar integrante por nombre, legajo o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '18px 25px 18px 55px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: '0.3s',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(0,210,255,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
              <div className="glass" style={{ padding: '12px 25px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,210,255,0.05)', border: '1px solid rgba(0,210,255,0.1)' }}>
                <div style={{ width: '10px', height: '10px', background: '#00d2ff', borderRadius: '50%', boxShadow: '0 0 10px #00d2ff' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>{companyUsers.filter(u => u.email && u.nombre && !['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA'].includes(u.rol?.toUpperCase())).length} INTEGRANTES ACTIVOS</span>
              </div>
            </div>

            {companyUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>
                <Users size={64} style={{ marginBottom: '20px' }} />
                <h3>Sin integrantes registrados</h3>
                <p>Comienza agregando personal con el botón superior</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '25px' }}>
                {companyUsers
                  .filter(u => u.email && (u.nombre || u.name) && !['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'SUPERVISOR', 'DUEÑO'].includes((u.rol || u.role || '').trim().toUpperCase()))
                  .filter(u =>
                    !searchTerm ||
                    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.dni?.includes(searchTerm) ||
                    u.legajo?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((u, i) => {
                    const USER_COLORS = ['#00d2ff', '#a855f7', '#10b981', '#f43f5e', '#fbbf24', '#3b82f6', '#ec4899', '#6366f1'];
                    const isAdmin = u.rol?.toUpperCase() === 'ADMIN' || u.rol?.toUpperCase() === 'OPERADOR';
                    const roleColor = USER_COLORS[i % USER_COLORS.length];
                    const roleBg = `${roleColor}15`;
                    
                    return (
                      <div
                        key={u.id || u.uid || i}
                        onClick={() => setSelectedUserForView(u)}
                        className="staff-card"
                        style={{
                          padding: '24px',
                          borderRadius: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '24px',
                          background: 'linear-gradient(145deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                          transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          position: 'relative',
                          overflow: 'hidden',
                          opacity: 0,
                          animation: `fadeSlideIn 0.6s ease-out forwards ${i * 0.1}s`
                        }}
                      >
                        {/* Glow Background Effect */}
                        <div style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: `radial-gradient(circle, ${roleColor}05 0%, transparent 70%)`, pointerEvents: 'none' }} />

                        <div style={{
                          width: '100px',
                          height: '100px',
                          borderRadius: '22px',
                          background: u.foto ? 'white' : `linear-gradient(135deg, ${roleColor}44 0%, rgba(15,23,42,1) 100%)`,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          border: `2px solid ${roleColor}22`,
                          overflow: 'hidden',
                          flexShrink: 0,
                          boxShadow: `0 8px 25px ${roleColor}15`,
                          position: 'relative',
                          zIndex: 1
                        }}>
                          {u.foto ? (
                            <img src={u.foto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ fontSize: '2.2rem', fontWeight: '900', color: roleColor, textShadow: `0 0 20px ${roleColor}44` }}>
                              {u.nombre?.charAt(0)}{u.apellido?.charAt(0)}
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ 
                              padding: '6px 14px',
                              borderRadius: '20px',
                              background: roleBg,
                              border: `1px solid ${roleColor}33`,
                              color: roleColor,
                              fontSize: '0.65rem',
                              fontWeight: '900',
                              letterSpacing: '1.5px',
                              width: 'fit-content',
                              boxShadow: `0 0 15px ${roleColor}11`
                            }}>
                              {u.rol?.toUpperCase() || 'GUARDIA'}
                            </div>
                            
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' }}>
                              {u.nombre} {u.apellido?.toUpperCase()}
                            </h3>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                              <Fingerprint size={14} style={{ opacity: 0.6 }} />
                              <span style={{ fontWeight: '600' }}>ID: <span style={{ color: 'rgba(255,255,255,0.8)' }}>{u.legajo || 'S/LEGAJO'}</span></span>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Arrow Indicator */}
                        <div className="arrow-indicator" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%) translateX(20px)', opacity: 0, transition: '0.3s' }}>
                          <ChevronRight size={20} color={roleColor} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {selectedUserForView && (
          <div style={styles.modalOverlay} onClick={() => setSelectedUserForView(null)}>
            <div className="glass fade-up" style={{ width: '100%', maxWidth: '550px', borderRadius: '28px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
              <div style={{ padding: '50px 40px 40px', background: 'linear-gradient(180deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,1) 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                    boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '25px',
                    overflow: 'hidden',
                    border: '3px solid rgba(255,255,255,0.1)'
                  }}>
                    {selectedUserForView.foto ? (
                      <img src={selectedUserForView.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={60} color="white" />
                    )}
                  </div>
                  <button
                    onClick={() => handleUpdateUserPhoto(selectedUserForView.id || selectedUserForView.uid)}
                    style={{
                      position: 'absolute', bottom: '15px', right: '-10px',
                      width: '40px', height: '40px', borderRadius: '12px',
                      background: 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '4px solid #0f172a', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                    }}
                    title="Cambiar Foto"
                  >
                    <Camera size={18} />
                  </button>
                </div>

                <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', color: 'white', textAlign: 'center' }}>
                  {selectedUserForView.nombre} {selectedUserForView.apellido?.toUpperCase()}
                </h2>

                <div style={{ marginTop: '20px', width: '100%', maxWidth: '200px' }}>
                  <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', display: 'block', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>ROL ASIGNADO</label>
                  <div style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.85rem',
                    fontWeight: '900',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {selectedUserForView.rol || selectedUserForView.role || 'GUARDIA'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 40px 40px', background: '#0f172a' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '35px' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>DNI / DOCUMENTO</label>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{selectedUserForView.dni || 'NO ASIGNADO'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>LEGAJO / ID ÚNICO</label>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)' }}>{selectedUserForView.legajo || 'S/L'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>TELÉFONO PERSONAL</label>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{selectedUserForView.phone || selectedUserForView.telefono || 'SIN REGISTRO'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>EMAIL CORPORATIVO</label>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedUserForView.email || 'SIN EMAIL'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>PUESTO ASIGNADO</label>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#10b981' }}>
                      {objectives.find(o => o.id === selectedUserForView.schedule?.objectiveId)?.nombre || 'SIN ASIGNAR'}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '35px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>ACCESO RESTRINGIDO</label>
                      <div style={{ fontWeight: '900', fontFamily: 'monospace', letterSpacing: '4px', fontSize: '1.2rem', color: '#f59e0b' }}>
                        {selectedUserForView.password || '********'}
                      </div>
                    </div>
                    <button
                      onClick={() => resetUserAccess(selectedUserForView.id || selectedUserForView.uid)}
                      style={{
                        padding: '12px 20px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.1) 100%)',
                        color: '#f59e0b', fontSize: '0.75rem', fontWeight: '900',
                        border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                    >
                      <RotateCw size={14} /> BLANQUEAR
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    onClick={async () => { 
                      // Mapear campos de DB a campos de Formulario para que no aparezcan vacíos
                      const mappedUser = {
                        ...selectedUserForView,
                        nombre: selectedUserForView.nombre || selectedUserForView.name,
                        apellido: selectedUserForView.apellido || selectedUserForView.surname,
                        emailPersonal: selectedUserForView.emailPersonal || selectedUserForView.personal_email,
                        fechaNacimiento: selectedUserForView.fechaNacimiento || selectedUserForView.birth_date,
                        telefono: selectedUserForView.telefono || selectedUserForView.phone,
                        rol: selectedUserForView.rol || selectedUserForView.role
                      };
                      setEditingUser(mappedUser); 
                      setShowEditUserModal(true); 
                      setSelectedUserForView(null); 
                    }}
                    className="primary"
                    style={{ flex: 1, padding: '16px', borderRadius: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    <Edit3 size={18} /> EDITAR PERFIL COMPLETO
                  </button>
                  <button
                    onClick={async () => { handleOpenShift(selectedUserForView); setSelectedUserForView(null); }}
                    className="secondary"
                    style={{ flex: 1, padding: '16px', borderRadius: '16px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <MapPin size={18} /> ASIGNAR PUESTO
                  </button>
                  <button
                    onClick={async () => { handleSoftDeleteUser(selectedUserForView); setSelectedUserForView(null); }}
                    style={{
                      flex: 0.4, padding: '16px', borderRadius: '16px',
                      background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                      border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.9rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserForView(null)}
                style={{ position: 'absolute', top: '25px', right: '25px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {activeItem === 'Turnos' && (
          <div className="fade-in">
            <div className="glass" style={{ padding: '30px', borderRadius: '25px', marginBottom: '30px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ padding: '15px', background: 'rgba(16,185,129,0.1)', borderRadius: '15px', color: '#10b981' }}>
                  <Calendar size={30} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Agenda Operativa y Gestión de Turnos</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '5px', margin: 0 }}>Gestione los roles, horarios, francos y objetivos asignados a su personal.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '20px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
                <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Buscar en turnos por nombre, legajo o DNI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ 
                    width: '100%',
                    padding: '18px 25px 18px 55px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px',
                    color: 'white',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: '0.3s',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(16,185,129,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
              <div className="glass" style={{ padding: '12px 25px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>{companyUsers.filter(u => u.email && (u.nombre || u.name) && !['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA'].includes(u.rol?.toUpperCase())).length} PERSONAS EN AGENDA</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px' }}>
              {companyUsers
                .filter(u => u.email && (u.nombre || u.name) && !['ADMIN', 'OPERADOR', 'SUPERADMIN', 'ADMIN EMPRESA', 'SUPERVISOR', 'DUEÑO'].includes((u.rol || u.role || '').trim().toUpperCase()))
                .filter(u => 
                  !searchTerm ||
                  u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  u.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  u.dni?.includes(searchTerm) ||
                  u.legajo?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((u, i) => {
                  const hasSchedule = u.schedule && u.schedule.workingDays?.length > 0;
                  const obj = objectives.find(o => String(o.id) === String(u.schedule?.objectiveId));
                  const USER_COLORS = ['#00d2ff', '#a855f7', '#10b981', '#f43f5e', '#fbbf24', '#3b82f6', '#ec4899', '#6366f1'];
                  const color = USER_COLORS[i % USER_COLORS.length];

                  return (
                    <div
                      key={u.id || u.uid}
                      onClick={() => handleOpenShift(u)}
                      className="glass staff-card fade-slide-in"
                      style={{
                        padding: '24px',
                        borderRadius: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        position: 'relative',
                        border: '1px solid rgba(255,255,255,0.05)',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '18px',
                        background: u.foto ? `url(${u.foto}) center/cover` : `linear-gradient(135deg, ${color} 0%, #0f172a 100%)`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '1.4rem',
                        fontWeight: '900',
                        color: 'white',
                        boxShadow: `0 10px 20px ${color}20`,
                        border: '2px solid rgba(255,255,255,0.1)'
                      }}>
                        {!u.foto && u.nombre?.charAt(0)}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                           <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '6px', background: color + '20', color: color, fontWeight: 'bold' }}>TURNOS</span>
                           <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'white' }}>
                              {u.nombre} {u.apellido?.toUpperCase()}
                           </h3>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: hasSchedule ? '#10b981' : 'rgba(255,255,255,0.3)' }}>
                              <Clock size={12} />
                              <span style={{ fontWeight: 'bold' }}>{hasSchedule ? `${u.schedule.startTime} - ${u.schedule.endTime}` : 'HORARIO NO ASIGNADO'}</span>
                           </div>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                              <MapPin size={12} color={color} />
                              <span style={{ fontWeight: '500', color: obj ? 'white' : 'rgba(255,255,255,0.2)' }}>{obj?.nombre || 'SIN OBJETIVO'}</span>
                           </div>
                        </div>
                        
                        {hasSchedule && (
                           <div style={{ display: 'flex', gap: '3px', marginTop: '10px' }}>
                              {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(d => (
                                 <div key={d} style={{ 
                                    width: '20px', height: '20px', borderRadius: '4px', fontSize: '0.5rem', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900',
                                    background: u.schedule.workingDays.includes(d) ? color : 'rgba(255,255,255,0.05)',
                                    color: u.schedule.workingDays.includes(d) ? 'white' : 'rgba(255,255,255,0.1)'
                                 }}>{d.charAt(0)}</div>
                              ))}
                           </div>
                        )}
                      </div>

                      <div className="arrow-indicator" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', transition: '0.3s' }}>
                        <ChevronRight size={18} color={color} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* SOPORTE (Centro de Ayuda y Respuesta Directa) */}
        {activeItem === 'Soporte' && (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '30px', height: 'calc(100vh - 250px)' }}>

              {/* Lista de Tickets */}
              <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderRadius: '25px', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Headphones size={20} color="var(--primary)" /> TUS SOLICITUDES
                </h3>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tickets.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      style={{
                        padding: '15px', borderRadius: '15px', cursor: 'pointer', transition: '0.3s',
                        background: selectedTicket?.id === t.id ? 'rgba(0,168,255,0.1)' : 'rgba(255,255,255,0.02)',
                        border: selectedTicket?.id === t.id ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: t.status === 'Resuelto' ? '#10b981' : '#f59e0b', textTransform: 'uppercase' }}>{t.status}</span>
                        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{new Date(t.fecha).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>{t.asunto}</div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.descripcion}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalles y Chat de Soporte */}
              <div className="glass" style={{ borderRadius: '25px', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)' }}>
                {selectedTicket ? (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ padding: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
                      <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{selectedTicket.asunto}</h2>
                      <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>IDC: {selectedTicket.id}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>TIPO: {selectedTicket.tipo}</span>
                      </div>
                    </div>

                    <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                      {/* Mensaje Original */}
                      <div style={{ alignSelf: 'flex-end', maxWidth: '80%', padding: '20px', background: 'rgba(0,168,255,0.1)', borderRadius: '20px 20px 0 20px', border: '1px solid rgba(0,168,255,0.2)' }}>
                        <div style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "bold", marginBottom: "8px" }}>TÚ</div>
                        <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>{selectedTicket.descripcion}</p>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '10px', textAlign: 'right' }}>{new Date(selectedTicket.fecha).toLocaleTimeString()}</div>
                      </div>

                      {/* Respuestas de Soporte */}
                      {(selectedTicket.respuestas || []).filter(r => r.autor !== 'NOTA INTERNA').map((r, i) => (
                        <div key={i} style={{ alignSelf: r.autor === 'EMPRESA' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '20px', background: r.autor === 'EMPRESA' ? 'rgba(0,168,255,0.1)' : 'rgba(15,23,42,0.8)', borderRadius: r.autor === 'EMPRESA' ? '20px 20px 0 20px' : '20px 20px 20px 0', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ fontSize: '0.8rem', color: r.autor === 'EMPRESA' ? 'var(--primary)' : '#10b981', fontWeight: 'bold', marginBottom: '8px' }}>{r.autor === 'EMPRESA' ? 'TÚ' : 'SOPORTE CENTINELA'}</div>
                          <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>{r.texto}</p>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '10px', textAlign: r.autor === 'EMPRESA' ? 'right' : 'left' }}>{new Date(r.fecha).toLocaleTimeString()}</div>
                        </div>
                      ))}

                      {(selectedTicket.status === 'Cerrado' || selectedTicket.status === 'Resuelto') && (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'white', background: 'rgba(16,185,129,0.05)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '15px' }}><CheckCircle size={24} style={{ marginBottom: '10px', display: 'block', margin: '0 auto' }} /> Ticket resuelto y cerrado</div>
                          {!selectedTicket.rating ? (
                            <div>
                              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '15px' }}>Por favor, califica la atención de nuestro equipo de soporte:</p>
                              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button key={star} onClick={() => handleRateTicket(star)} style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'scale(1.2)'} onMouseOut={e => e.target.style.transform = 'scale(1)'}>☆</button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>Atención calificada con</p>
                              <div style={{ color: '#f59e0b', fontSize: '1.5rem', letterSpacing: '5px' }}>{'★'.repeat(selectedTicket.rating)}{'☆'.repeat(5 - selectedTicket.rating)}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ padding: '25px', backgroundColor: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ position: 'relative' }}>
                        <textarea
                          value={chatReply} onChange={e => setChatReply(e.target.value)}
                          placeholder="Responder a soporte o brindar más detalles..."
                          style={{ width: '100%', boxSizing: 'border-box', padding: '20px', paddingRight: '120px', borderRadius: '20px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', minHeight: '80px', resize: 'none' }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendResponse(); } }}
                        />
                        <div style={{ position: 'absolute', right: '15px', bottom: '15px', display: 'flex', gap: '10px' }}>
                          <button onClick={() => alert("Función visual (Adjuntar imagen/pdf)")} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><Paperclip size={18} /></button>
                          <button disabled={!chatReply.trim()} onClick={handleSendResponse} style={{ padding: '8px 15px', background: chatReply.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', color: 'white', cursor: chatReply.trim() ? 'pointer' : 'not-allowed' }}><Send size={18} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                    <AlertCircle size={60} style={{ marginBottom: '20px' }} />
                    <p>Seleccione un ticket para ver la comunicación con el soporte técnico de Centinela.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal: Nueva Consulta de Soporte */}
            {showNewTicketModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
                <div className="glass fade-up" style={{ width: '600px', padding: '40px', borderRadius: '32px', border: '1px solid var(--primary)', boxShadow: '0 0 50px rgba(0, 168, 255, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}><MessageSquare color="var(--primary)" size={28} /> Nueva Solicitud de Soporte</h3>
                    <button onClick={() => setShowNewTicketModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>ASUNTO / TÍTULO BREVE</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Problema con acceso de usuario"
                        value={newTicket.asunto}
                        onChange={e => setNewTicket({...newTicket, asunto: e.target.value})}
                        style={{ ...styles.input, marginBottom: 0 }} 
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>TIPO DE CONSULTA</label>
                        <select 
                          value={newTicket.tipo}
                          onChange={e => setNewTicket({...newTicket, tipo: e.target.value})}
                          style={styles.input}
                        >
                          <option value="Consulta">Consulta General</option>
                          <option value="Falla Técnica">Falla Técnica</option>
                          <option value="Problema de App">Problema en App Móvil</option>
                          <option value="Facturación">Duda de Facturación</option>
                          <option value="Urgencia">Urgencia Operativa</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>PRIORIDAD</label>
                        <select 
                          value={newTicket.prioridad}
                          onChange={e => setNewTicket({...newTicket, prioridad: e.target.value})}
                          style={styles.input}
                        >
                          <option value="Baja">Baja</option>
                          <option value="Media">Media</option>
                          <option value="Alta">Alta</option>
                          <option value="Crítica">Crítica / Pánico</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>DESCRIPCIÓN DETALLADA</label>
                      <textarea 
                        placeholder="Describa el problema lo más detalladamente posible..."
                        value={newTicket.descripcion}
                        onChange={e => setNewTicket({...newTicket, descripcion: e.target.value})}
                        style={{ ...styles.input, height: '150px', resize: 'none' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                      <button onClick={handleAddTicket} className="primary" style={{ flex: 1, padding: '18px', borderRadius: '15px', fontSize: '1rem', fontWeight: 'bold' }}>ENVIAR SOLICITUD</button>
                      <button onClick={() => setShowNewTicketModal(false)} style={{ flex: 1, padding: '18px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 'bold' }}>CANCELAR</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RONDAS QR (Puntos de Control) */}
        {activeItem === 'Rondas' && (
          <div className="fade-in">
            {/* SUB-NAVEGACION RONDAS */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
               <button 
                  onClick={() => setActiveRondaSubTab('puntos')}
                  style={{
                     flex: 1, padding: '15px', borderRadius: '16px', cursor: 'pointer', transition: '0.3s',
                     background: activeRondaSubTab === 'puntos' ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.02)',
                     border: activeRondaSubTab === 'puntos' ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.05)',
                     color: activeRondaSubTab === 'puntos' ? '#00d2ff' : 'rgba(255,255,255,0.4)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold'
                  }}
               >
                  <MapPin size={20} /> PUNTOS DE CONTROL (ESTÁTICOS)
               </button>
               <button 
                  onClick={() => setActiveRondaSubTab('rondas')}
                  style={{
                     flex: 1, padding: '15px', borderRadius: '16px', cursor: 'pointer', transition: '0.3s',
                     background: activeRondaSubTab === 'rondas' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                     border: activeRondaSubTab === 'rondas' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                     color: activeRondaSubTab === 'rondas' ? '#3b82f6' : 'rgba(255,255,255,0.4)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold'
                  }}
               >
                  <Calendar size={20} /> PROGRAMACIÓN DE RONDAS
               </button>
            </div>

            <style>
              {`
                  @media print {
                    .noprint, nav, header, aside, button, .arrow-indicator, .glass::before, .glass { 
                      display: none !important; 
                    }
                    #root, main {
                      display: block !important;
                      background: white !important;
                    }
                  }
               `}
            </style>



            {activeRondaSubTab === 'puntos' && (
            <>
            <div className="glass noprint" style={{ padding: '30px', borderRadius: '25px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ padding: '15px', background: 'rgba(0,210,255,0.1)', borderRadius: '15px', color: '#00d2ff' }}>
                   <MapPin size={30} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Puntos de Control QR</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '5px' }}>Defina las ubicaciones físicas que deben ser patrulladas. Estos códigos son permanentes y no varían con los horarios.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', marginTop: '25px', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                <select
                  style={{ ...styles.input, marginBottom: 0 }}
                  value={newQrPoint.objectiveId}
                  onChange={e => setNewQrPoint({ ...newQrPoint, objectiveId: e.target.value })}
                >
                  <option value="">-- Seleccionar Objetivo --</option>
                  {Array.isArray(objectives) && objectives.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Ej: Sala de Servidores, Estacionamiento B"
                  value={newQrPoint.name}
                  onChange={e => setNewQrPoint({ ...newQrPoint, name: e.target.value })}
                  style={{ ...styles.input, marginBottom: 0 }}
                />

                <button
                  onClick={async () => {
                    if (!newQrPoint.name || !newQrPoint.objectiveId) return alert("Complete el nombre del punto y seleccione a qué objetivo pertenece.");
                    const np = { 
                      id: 'qr_' + Date.now().toString(36), 
                      companyId: user.empresaId, 
                      objectiveId: newQrPoint.objectiveId, 
                      name: newQrPoint.name,
                      code: 'QR-' + Math.random().toString(36).substr(2, 6).toUpperCase()
                    };
                    
                    try {
                      await db.crearQrPoint(np);
                      setQrPoints([...qrPoints, np]);
                      setNewQrPoint({ name: '', objectiveId: newQrPoint.objectiveId, horarios: [] });
                      showToast("✅ Punto de control creado con éxito.");
                    } catch (e) {
                      showToast("Error al guardar punto QR", "error");
                    }
                  }}
                  className="primary noprint"
                  style={{ padding: '15px 30px', borderRadius: '12px', height: '100%', fontWeight: 'bold' }}
                >
                  <Plus size={18} /> AGREGAR PUNTO
                </button>
              </div>
            </div>

            <div className="glass" style={{ padding: '30px', borderRadius: '25px' }}>
              <div className="noprint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ margin: 0 }}>Códigos QR Generados</h3>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <select
                    style={{ padding: '10px 15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', minWidth: '200px' }}
                    value={selectedQrObjective}
                    onChange={(e) => setSelectedQrObjective(e.target.value)}
                  >
                    <option value="">Todos los Objetivos</option>
                    {Array.isArray(objectives) && objectives.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                  </select>
                  <button
                    onClick={() => setShowQrExportModal(true)}
                    style={{ padding: '12px 25px', borderRadius: '12px', border: '1px solid rgba(0,210,255,0.5)', background: 'rgba(0,210,255,0.1)', color: '#00d2ff', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', transition: '0.3s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,210,255,0.2)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,210,255,0.1)'}
                  >
                    <FileText size={18} /> EXPORTAR QR (PDF)
                  </button>

                </div>
              </div>

              <div className="printable-qr-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
                {Array.isArray(qrPoints) && qrPoints
                  .filter(p => !selectedQrObjective || p.objectiveId === selectedQrObjective)
                  .map(point => {
                    const obj = Array.isArray(objectives) ? objectives.find(o => o.id === point.objectiveId) : null;
                    return (
                      <div key={point.id} className="qr-card fade-up" style={{ padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: '0.3s' }}>
                        <div className="qr-header" style={{ color: '#00d2ff', fontWeight: '900', fontSize: '0.7rem', letterSpacing: '2px', textTransform: 'uppercase' }}>CENTINELA SECURITY</div>
                        <div className="qr-obj-name" style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', textTransform: 'uppercase' }}>{obj?.nombre || 'General'}</div>
                        <h4 style={{ margin: 0, fontSize: '1.4rem', color: 'white', fontWeight: 900 }}>{point.name}</h4>
                        <div className="qr-container" style={{ position: 'relative', background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', marginTop: '10px', marginBottom: '10px' }}>
                          <QRCodeSVG
                            value={JSON.stringify({ id: point.id, type: 'ronda_qr' })}
                            size={180}
                            level="H"
                            includeMargin={true}
                            fgColor="#000000"
                            bgColor="#ffffff"
                          />
                        </div>

                        {/* INDICADOR DE ASIGNACIÓN A RONDAS */}
                        <div className="noprint" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                           {(() => {
                              const assigned = rondas.filter(r => r.assignedQrIds?.includes(point.id));
                              if (assigned.length === 0) {
                                 return (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '8px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>
                                       <X size={10} /> SIN RONDA ASIGNADA
                                    </span>
                                 )
                              }
                              return assigned.map(r => (
                                 <span key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.1)', padding: '5px 12px', borderRadius: '8px', fontSize: '0.65rem', color: '#10b981', fontWeight: 'bold', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <CheckCircle size={10} /> {r.nombre.toUpperCase()}
                                 </span>
                              ))
                           })()}
                        </div>

                        <div className="noprint" style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>PT-ID: {point.id.toUpperCase()}</div>
                        <button
                          onClick={async () => {
                            if (confirm(`¿Eliminar definitivamente el punto "${point.name}"? Los guardias no podrán escanearlo.`)) {
                              const allQrPoints = JSON.parse(localStorage.getItem('centinela_qr_points') || '[]');
                              const updated = allQrPoints.filter(p => p.id !== point.id);
                              localStorage.setItem('centinela_qr_points', JSON.stringify(updated));
                              setQrPoints(qrPoints.filter(p => p.id !== point.id));
                            }
                          }}
                          className="noprint"
                          style={{ marginTop: '15px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '8px 15px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', width: '100%' }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          ELIMINAR PUNTO
                        </button>
                      </div>
                    );
                  })}
              </div>

              {qrPoints.filter(p => !selectedQrObjective || p.objectiveId === selectedQrObjective).length === 0 && (
                <div className="noprint" style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.3)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
                  <QrCode size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px' }}>Sin puntos de control planificados</div>
                  <div>Seleccione un objetivo y añada los puntos que requieren patrullaje QR.</div>
                </div>
              )}
            </div>
            </>
            )}

            {activeRondaSubTab === 'rondas' && (
               <div className="glass fade-in" style={{ padding: '30px', borderRadius: '25px', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '25px' }}>
                     <div style={{ padding: '15px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '15px', color: '#3b82f6' }}>
                        <Clock size={30} />
                     </div>
                     <div>
                        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>Configuración de Rondas</h3>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Programe horarios, días y asigne los puntos de control QR a sus rondas operativas.</p>
                     </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                     {/* Formulario Nueva Ronda */}
                     <div style={{ padding: '25px', background: 'rgba(255,255,255,0.02)', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ color: '#3b82f6', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '20px' }}>Nueva Programación</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                           <div>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px' }}>NOMBRE DE LA RONDA</label>
                              <input 
                                 type="text" value={newRonda.nombre || ''} placeholder="Ej: Ronda Nocturna Seguridad"
                                 onChange={e => setNewRonda({...newRonda, nombre: e.target.value})}
                                 style={styles.input}
                              />
                           </div>

                           <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                              <div>
                                 <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px' }}>HORA DE INICIO (EJECUCIÓN)</label>
                                 <input type="time" value={newRonda.startTime || '22:00'} onChange={e => setNewRonda({...newRonda, startTime: e.target.value})} style={styles.input} />
                              </div>
                           </div>

                           <div>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px' }}>SELECCIONAR OBJETIVO / PUESTO</label>
                              <select 
                                 value={newRonda.objectiveId || ''} 
                                 onChange={e => {
                                    setNewRonda({...newRonda, objectiveId: e.target.value, assignedQrIds: []});
                                 }} 
                                 style={styles.input}
                              >
                                 <option value="">-- Seleccionar Puesto --</option>
                                 {Array.isArray(objectives) && objectives.map(o => (
                                    <option key={o.id} value={o.id}>{o.nombre}</option>
                                 ))}
                              </select>
                           </div>

                           <div>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>DÍAS DE SEMANA</label>
                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                 {Array.isArray(DAYS) && DAYS.map(d => {
                                    const isSel = Array.isArray(newRonda.days) && newRonda.days.includes(d);
                                    return (
                                       <button 
                                          key={d} onClick={async () => {
                                             const currentDays = Array.isArray(newRonda.days) ? newRonda.days : [];
                                             const updated = isSel ? currentDays.filter(x => x !== d) : [...currentDays, d];
                                             setNewRonda({...newRonda, days: updated});
                                          }}
                                          style={{
                                             padding: '8px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer',
                                             background: isSel ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: isSel ? 'white' : 'rgba(255,255,255,0.4)',
                                             border: 'none', transition: '0.2s'
                                          }}
                                       >{d}</button>
                                    );
                                 })}
                              </div>
                           </div>

                           <div>
                              <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '10px' }}>ASIGNAR PUNTOS DE CONTROL QR DE ESTE PUESTO</label>
                              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '15px', maxHeight: '180px', overflowY: 'auto' }} className="custom-scrollbar">
                                 {(!newRonda.objectiveId) ? (
                                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Seleccione un puesto primero para ver sus puntos QR.</div>
                                 ) : (
                                    (() => {
                                       const filteredPoints = Array.isArray(qrPoints) ? qrPoints.filter(p => p.objectiveId === newRonda.objectiveId) : [];
                                       if (filteredPoints.length === 0) {
                                          return <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>Este puesto no tiene puntos QR creados.</div>;
                                       }
                                       return (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                             {filteredPoints.map(p => {
                                                const isSel = Array.isArray(newRonda.assignedQrIds) && newRonda.assignedQrIds.includes(p.id);
                                                return (
                                                   <div 
                                                      key={p.id} 
                                                      onClick={async () => {
                                                         const currentIds = Array.isArray(newRonda.assignedQrIds) ? newRonda.assignedQrIds : [];
                                                         const up = isSel ? currentIds.filter(x => x !== p.id) : [...currentIds, p.id];
                                                         setNewRonda({...newRonda, assignedQrIds: up});
                                                      }}
                                                      style={{ padding: '10px', borderRadius: '10px', background: isSel ? 'rgba(59, 130, 246, 0.1)' : 'transparent', border: isSel ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                                   >
                                                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '2px solid #3b82f6', background: isSel ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                         {isSel && <CheckCircle size={12} color="white" />}
                                                      </div>
                                                      <div style={{ fontSize: '0.85rem', color: isSel ? '#3b82f6' : 'white' }}>{p.name}</div>
                                                   </div>
                                                );
                                             })}
                                          </div>
                                       );
                                    })()
                                 )}
                              </div>
                           </div>

                           <button 
                              className="primary" style={{ padding: '15px', marginTop: '10px' }}
                              onClick={async () => {
                                 if (!newRonda.nombre || !Array.isArray(newRonda.assignedQrIds) || newRonda.assignedQrIds.length === 0) return alert("Complete el nombre y asigne al menos un punto QR.");
                                 const nr = { ...newRonda, id: 'rd_' + Date.now().toString(36), companyId: user.empresaId };
                                 
                                 
                                 await db.guardarRondaProgramada(nr);
                                 setRondas([...rondas, nr]);
                                 setNewRonda({ nombre: '', objectiveId: '', startTime: '22:00', tolerance: 15, days: ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'], assignedQrIds: [] });
                                 showToast("✅ Ronda programada correctamente.");
                              }}
                           >GUARDAR PROGRAMACIÓN</button>
                        </div>
                     </div>

                     {/* Lista de Rondas */}
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h4 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', marginLeft: '10px' }}>Rondas Activas</h4>
                        {(!Array.isArray(rondas) || rondas.length === 0) ? (
                           <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>No hay programaciones.</div>
                        ) : (
                           rondas.map(r => (
                              <div key={r.id} className="glass" style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{(r.nombre || 'SIN NOMBRE').toUpperCase()}</div>
                                    <button 
                                       onClick={async () => {
                                          if (confirm(`¿Eliminar programación "${r.nombre}"?`)) {
                                             const up = rondas.filter(x => x.id !== r.id);
                                             await db.eliminarRonda(r.id);
                                             setRondas(up);
                                          }
                                       }}
                                       style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.5 }}
                                    ><Trash2 size={16}/></button>
                                 </div>
                                 <div style={{ display: 'flex', gap: '15px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                       <Clock size={14} color="#3b82f6" /> Inicia a las {r.startTime || '00:00'} hs
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                       <Calendar size={14} color="#3b82f6" /> {Array.isArray(r.days) && r.days.length === 7 ? 'Diaria' : (Array.isArray(r.days) ? r.days.join(', ') : 'No definido')}
                                    </div>
                                 </div>
                                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {Array.isArray(r.assignedQrIds) && r.assignedQrIds.map(qid => {
                                       const qp = Array.isArray(qrPoints) ? qrPoints.find(q => q.id === qid) : null;
                                       return (
                                          <span key={qid} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px' }}>{qp?.name || 'QR Eliminado'}</span>
                                       )
                                    })}
                                 </div>
                              </div>
                           ))
                        )}
                     </div>
                  </div>
               </div>
            )}
          </div>
        )}

        {/* MODAL CONFIGURACIÓN EXPORTACIÓN QR (PROFESIONAL) */}
        {showQrExportModal && (
          <div className="noprint" style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
            <div className="glass fade-up" style={{ width: '100%', maxWidth: '900px', borderRadius: '32px', border: '1px solid #00d2ff', overflow: 'hidden', boxShadow: '0 0 100px rgba(0,210,255,0.2)' }}>
              <div style={{ display: 'flex', height: '600px' }}>
                {/* Lado Izquierdo: Configuración */}
                <div style={{ flex: '0 0 400px', padding: '40px', background: 'rgba(15, 23, 42, 0.9)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}><Settings color="#00d2ff" size={28} /> Exportar QR</h3>
                    <button onClick={() => setShowQrExportModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', flex: 1 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '1px', display: 'block', marginBottom: '15px' }}>FORMATO DE SALIDA</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button 
                          onClick={() => setQrExportConfig({...qrExportConfig, layout: 'full'})}
                          style={{ 
                            padding: '12px', borderRadius: '12px', border: qrExportConfig.layout === 'full' ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.1)',
                            background: qrExportConfig.layout === 'full' ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.02)',
                            color: qrExportConfig.layout === 'full' ? '#00d2ff' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem'
                          }}
                        >UNA POR PÁGINA</button>
                        <button 
                          onClick={() => setQrExportConfig({...qrExportConfig, layout: 'labels'})}
                          style={{ 
                            padding: '12px', borderRadius: '12px', border: qrExportConfig.layout === 'labels' ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.1)',
                            background: qrExportConfig.layout === 'labels' ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.02)',
                            color: qrExportConfig.layout === 'labels' ? '#00d2ff' : 'rgba(255,255,255,0.5)',
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem'
                          }}
                        >ETIQUETAS (GRID)</button>
                      </div>
                    </div>

                    {qrExportConfig.layout === 'full' && (
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '1px', display: 'block', marginBottom: '15px' }}>TAMAÑO DEL CÓDIGO QR ({qrSizePrint}px)</label>
                        <input 
                          type="range" min="150" max="450" step="5"
                          value={qrSizePrint}
                          onChange={e => setQrSizePrint(parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: '#00d2ff' }}
                        />
                      </div>
                    )}

                    <div style={{ background: 'rgba(0,210,255,0.05)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0,210,255,0.1)', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#00d2ff', marginBottom: '8px' }}>
                        {isGeneratingQr ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                        <span style={{ fontSize: '0.8rem', fontWeight: '900' }}>{isGeneratingQr ? 'GENERANDO CÓDIGOS...' : 'SISTEMA PROFESIONAL'}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>
                        {isGeneratingQr 
                          ? 'Por favor espere mientras se procesan las imágenes de alta resolución...'
                          : `Se generarán ${qrPoints.filter(p => !selectedQrObjective || p.objectiveId === selectedQrObjective).length} códigos QR optimizados para impresión física sin cortes.`
                        }
                      </p>
                    </div>

                    <button 
                      disabled={isGeneratingQr}
                      onClick={handleExportQR_PDF}
                      className="primary" 
                      style={{ padding: '20px', borderRadius: '18px', fontWeight: '900', fontSize: '1rem', letterSpacing: '1px', background: 'linear-gradient(135deg, #00d2ff 0%, #3b82f6 100%)', opacity: isGeneratingQr ? 0.5 : 1, cursor: isGeneratingQr ? 'not-allowed' : 'pointer', width: '100%' }}
                    >
                      <Download size={20} /> {isGeneratingQr ? 'PROCESANDO...' : 'GENERAR E IMPRIMIR'}
                    </button>
                  </div>
                </div>

                {/* Lado Derecho: Vista Previa Real */}
                <div style={{ flex: 1, background: '#f8fafc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      VISTA PREVIA DE IMPRESIÓN (A4)
                    </div>
                  </div>

                  {/* Hoja A4 Simulada */}
                  <div style={{ 
                    width: '350px', height: '495px', background: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', 
                    display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', transform: 'scale(0.85)',
                    overflow: 'hidden', padding: qrExportConfig.layout === 'labels' ? '10px' : '0'
                  }}>
                    {qrExportConfig.layout === 'full' ? (
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
                          <div style={{ color: '#00d2ff', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', marginBottom: '5px' }}>CENTINELA SECURITY</div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>OBJETIVO MUESTRA</div>
                          <h4 style={{ margin: '10px 0', fontSize: '20px', color: 'black', fontWeight: '900' }}>PUNTO DE CONTROL</h4>
                          {isGeneratingQr ? (
                            <div style={{ width: '150px', height: '150px', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999' }}>GENERANDO...</div>
                          ) : (
                            <img 
                              src={generatedQrImages[qrPoints.find(p => !selectedQrObjective || p.objectiveId === selectedQrObjective)?.id] || ''} 
                              style={{ width: '150px', height: '150px' }} 
                              alt="PREVIEW" 
                            />
                          )}
                          <div style={{ marginTop: '20px', fontSize: '8px', color: '#94a3b8' }}>SISTEMA DE GESTIÓN OPERATIVA</div>
                       </div>
                    ) : (
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '10px' }}>
                          {qrPoints
                           .filter(p => !selectedQrObjective || p.objectiveId === selectedQrObjective)
                           .slice(0, 9)
                           .map((p, i) => (
                            <div key={p.id} style={{ border: '0.5pt dashed #ccc', padding: '8px', textAlign: 'center', background: 'white' }}>
                               <div style={{ fontSize: '5px', fontWeight: '900', color: '#3b82f6', textTransform: 'uppercase' }}>CENTINELA</div>
                               <div style={{ fontSize: '6px', fontWeight: 'bold', margin: '2px 0', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden' }}>{p.name}</div>
                               <div style={{ width: '45px', height: '45px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 {generatedQrImages[p.id] ? (
                                   <img src={generatedQrImages[p.id]} style={{ width: '100%', height: '100%' }} alt="QR" />
                                 ) : (
                                   <div style={{ width: '100%', height: '100%', background: '#eee' }} />
                                 )}
                               </div>
                            </div>
                          ))}
                          {qrPoints.filter(p => !selectedQrObjective || p.objectiveId === selectedQrObjective).length === 0 && (
                            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '20px', fontSize: '10px', color: '#999' }}>No hay puntos para mostrar</div>
                          )}
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeItem === 'Monitoreo' && (
          <div className="fade-in">
            {/* Panel de Mapa Real */}
            <div className="glass" style={{ height: '550px', position: 'relative', borderRadius: '30px', overflow: 'hidden', border: '1px solid rgba(0,168,255,0.2)', marginBottom: '30px' }}>
              <MapContainer
                center={[-34.6037, -58.3816]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {selectedObjective && <ChangeView center={[selectedObjective.lat, selectedObjective.lng]} />}

                {/* Personnel Markers (Live GPS + Fallback Objetivo) — REGLA DE ORO: Solo personal EN SERVICIO */}
                {companyUsers.map((u, idx) => {
                  // 1. Verificar presencia por eventos (ingreso/egreso)
                  const getT_gps = (e) => {
                    if (!e) return 0;
                    if (e.fechaRegistro?.seconds) return e.fechaRegistro.seconds * 1000;
                    const d = new Date(e.fechaRegistro || e.created_at || e.fecha || 0);
                    return isNaN(d.getTime()) ? 0 : d.getTime();
                  };
                  const userEvtsGps = events.filter(e => {
                    const uKeys = [String(u.id || ''), String(u.uid || ''), String(u.legajo || ''), String(u.email || '')].filter(k => k !== '').map(k => k.toLowerCase());
                    const eKeys = [
                      String(e.usuarioId || ''), String(e.userId || ''), String(e.guardiaId || ''),
                      String(e.usuario?.id || ''), String(e.usuario?.uid || ''), 
                      String(e.usuario?.legajo || ''), String(e.usuario?.email || '')
                    ].filter(k => k !== '').map(k => k.toLowerCase());
                    
                    const idMatch = eKeys.some(ek => uKeys.includes(ek));
                    if (idMatch) return true;
                    
                    const uFull = `${u.nombre || ''} ${u.apellido || ''}`.trim().toLowerCase();
                    const eFull = typeof e.usuario === 'object' ? `${e.usuario?.nombre || ''} ${e.usuario?.apellido || ''}`.trim().toLowerCase() : '';
                    return uFull !== '' && uFull === eFull;
                  });

                  const latestEventGps = userEvtsGps.length > 0 ? [...userEvtsGps].sort((a,b) => getT_gps(b) - getT_gps(a))[0] : null;
                  const isOnDuty = latestEventGps && (latestEventGps.tipo || '').toLowerCase() === 'ingreso';

                  if (!isOnDuty) return null; // No mostrar fuera de turno

                  // 2. Determinar posición: GPS real o fallback a objetivo asignado
                  const loc = locations.find(l => l.usuarioId === (u.id || u.uid));
                  const assignedObj = objectives.find(o => String(o.id) === String(u.schedule?.objectiveId));
                  
                  let pos = null;
                  let posSource = 'gps'; // 'gps' | 'objetivo'

                  if (loc && loc.latitud && loc.longitud) {
                    pos = [parseFloat(loc.latitud), parseFloat(loc.longitud)];
                  } else if (assignedObj && assignedObj.lat && assignedObj.lng) {
                    pos = [parseFloat(assignedObj.lat), parseFloat(assignedObj.lng)];
                    posSource = 'objetivo';
                  }

                  // REGLA DE ORO: Si el objetivo asignado está desactivado, no mostrar el marcador en el mapa
                  if (assignedObj && assignedObj.activo === false) return null;

                  if (!pos) return null; // Sin GPS ni objetivo con coordenadas

                  return (
                    <Marker key={u.id || u.uid || idx} position={pos} icon={guardIcon}>
                      <Popup>
                        <div style={{ color: 'black', fontSize: '12px' }}>
                          <strong style={{ textTransform: 'uppercase' }}>{u.nombre} {u.apellido}</strong><br />
                          <div style={{ marginTop: '5px', color: '#10b981', fontWeight: 'bold' }}>🟢 EN SERVICIO</div>
                          {posSource === 'gps' ? (
                            <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>Último reporte GPS: {new Date(loc.timestamp).toLocaleTimeString()}</div>
                          ) : (
                            <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '3px' }}>📍 Ubicación estimada (objetivo asignado)</div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {objectives.filter(obj => obj.activo !== false).map(obj => {
                  const assignedGuards = companyUsers.filter(u => String(u.schedule?.objectiveId) === String(obj.id));
                  const totalCount = assignedGuards.length;
                  
                  // REGLA DE ORO: La presencia depende de INGRESO > EGRESO (Igual que en RESUMEN)
                  const getT = (e) => {
                    if (!e) return 0;
                    if (e.fechaRegistro?.seconds) return e.fechaRegistro.seconds * 1000;
                    const d = new Date(e.fechaRegistro || e.created_at || e.fecha || 0);
                    return isNaN(d.getTime()) ? 0 : d.getTime();
                  };

                  const currentCount = assignedGuards.filter(u => {
                    const userEvents = events.filter(e => {
                      const uKeys = [String(u.id || ''), String(u.uid || ''), String(u.legajo || ''), String(u.email || '')].filter(k => k !== '').map(k => k.toLowerCase());
                      const eKeys = [
                        String(e.usuarioId || ''), String(e.userId || ''), String(e.guardiaId || ''),
                        String(e.usuario?.id || ''), String(e.usuario?.uid || ''), 
                        String(e.usuario?.legajo || ''), String(e.usuario?.email || '')
                      ].filter(k => k !== '').map(k => k.toLowerCase());
                      
                      const idMatch = eKeys.some(ek => uKeys.includes(ek));
                      if (idMatch) return true;
                      
                      const uFull = `${u.nombre || ''} ${u.apellido || ''}`.trim().toLowerCase();
                      const eFull = typeof e.usuario === 'object' ? `${e.usuario?.nombre || ''} ${e.usuario?.apellido || ''}`.trim().toLowerCase() : '';
                      return uFull !== '' && uFull === eFull;
                    });
                    
                    if (userEvents.length === 0) return false;
                    
                    // El evento más reciente manda (Igual que la visual del Resumen)
                    const latestEvent = [...userEvents].sort((a,b) => getT(b) - getT(a))[0];
                    return (latestEvent.tipo || '').toLowerCase() === 'ingreso';
                  }).length;

                  return (
                    <Marker
                      key={obj.id}
                      position={[obj.lat, obj.lng]}
                      icon={createObjectiveIcon(obj.nombre, currentCount, totalCount)}
                    >
                      <Popup>
                        <div style={{ color: 'black', minWidth: '200px' }}>
                          <strong style={{ fontSize: '14px' }}>{obj.nombre}</strong><br />
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{obj.address}</span>
                          
                          <hr style={{ margin: '12px 0', border: '0', borderTop: '1px solid #eee' }} />
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>COBERTURA:</span>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '900',
                              color: totalCount === 0 ? '#64748b' : (currentCount >= totalCount ? '#10b981' : currentCount === 0 ? '#ef4444' : '#f59e0b')
                            }}>{currentCount} / {totalCount}</span>
                          </div>

                          {assignedGuards.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '2px' }}>Personal Asignado</div>
                              {assignedGuards.map(u => {
                                const userEvents = events.filter(e => {
                                  const uKeys = [String(u.id || ''), String(u.uid || ''), String(u.legajo || ''), String(u.email || '')].filter(k => k !== '').map(k => k.toLowerCase());
                                  const eKeys = [
                                    String(e.usuarioId || ''), String(e.userId || ''), String(e.guardiaId || ''),
                                    String(e.usuario?.id || ''), String(e.usuario?.uid || ''), 
                                    String(e.usuario?.legajo || ''), String(e.usuario?.email || '')
                                  ].filter(k => k !== '').map(k => k.toLowerCase());
                                  
                                  const idMatch = eKeys.some(ek => uKeys.includes(ek));
                                  if (idMatch) return true;
                                  
                                  const uFull = `${u.nombre || ''} ${u.apellido || ''}`.trim().toLowerCase();
                                  const eFull = typeof e.usuario === 'object' ? `${e.usuario?.nombre || ''} ${e.usuario?.apellido || ''}`.trim().toLowerCase() : '';
                                  return uFull !== '' && uFull === eFull;
                                });
                                
                                const latestEvent = userEvents.length > 0 ? [...userEvents].sort((a,b) => getT(b) - getT(a))[0] : null;
                                const isPresent = latestEvent && (latestEvent.tipo || '').toLowerCase() === 'ingreso';

                                return (
                                  <div key={u.id || u.uid} style={{ display: 'flex', flexDirection: 'column', background: isPresent ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc', padding: '10px', borderRadius: '12px', border: isPresent ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ 
                                          width: '10px', height: '10px', borderRadius: '50%', 
                                          background: isPresent ? '#10b981' : '#ef4444',
                                          boxShadow: isPresent ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
                                        }} />
                                        <span style={{ fontSize: '12px', fontWeight: '900', color: '#1e293b', textTransform: 'uppercase' }}>{u.nombre} {u.apellido}</span>
                                      </div>
                                      <span style={{ fontSize: '10px', fontWeight: '900', color: isPresent ? '#10b981' : '#ef4444', letterSpacing: '0.5px' }}>
                                        {isPresent ? '✅ PRESENTE' : '❌ AUSENTE'}
                                      </span>
                                    </div>
                                    {isPresent && latestEvent && (
                                      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={10} /> INGRESO: {latestEvent.hora || new Date(getT(latestEvent)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{ fontSize: '10px', color: '#ef4444', textAlign: 'center', padding: '10px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '10px', border: '1px dashed #ef4444' }}>
                              ⚠️ SIN PERSONAL ASIGNADO
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {newObjectiveCoords && (
                  <Marker position={[newObjectiveCoords.lat, newObjectiveCoords.lng]}>
                    <Popup><div style={{ color: 'black' }}>Vista previa de ubicación</div></Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* HUD de Información sobre el Mapa */}
              <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 1000 }}>
                <div className="glass" style={{ padding: '15px 25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', letterSpacing: '1px' }}>SISTEMA DE RASTREO SATELITAL</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                    <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>MAPA OPERATIVO COMPACTO</span>
                  </div>
                </div>
              </div>

              {/* Leyenda de Cobertura */}
              <div style={{ position: 'absolute', bottom: '30px', left: '30px', zIndex: 1000 }}>
                <div style={{ 
                  padding: '20px', 
                  borderRadius: '24px', 
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(20px)',
                  background: 'rgba(7, 12, 26, 0.85)'
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '1.5px', marginBottom: '4px', textTransform: 'uppercase' }}>Referencias de Cobertura</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>SIN COBERTURA</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>COBERTURA PARCIAL</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff', letterSpacing: '0.5px' }}>COBERTURA COMPLETA</span>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />

                  <div style={{ fontSize: '0.6rem', color: 'rgba(0,210,255,0.6)', fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                    <span>CENTINELA GPS V2.0</span>
                    <div style={{ width: '4px', height: '4px', background: 'rgba(0,210,255,0.6)', borderRadius: '50%' }} />
                    <span>RT-TRACKING</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de Objetivos */}
            <div className="glass" style={{ padding: '30px', borderRadius: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Gestión de Objetivos</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '5px' }}>Seleccione una sede para centrar el monitoreo táctico</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <button
                    onClick={() => setShowTrashModal(true)}
                    style={{ padding: '10px 15px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}
                  >
                    <Trash2 size={16} /> PAPELERA
                  </button>
                  <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <select
                      value={selectedObjective?.id || ''}
                      onChange={(e) => {
                        const obj = objectives.find(o => o.id === e.target.value);
                        setSelectedObjective(obj);
                      }}
                      style={{ ...styles.input, paddingLeft: '45px', width: '100%', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="">-- Seleccionar Objetivo --</option>
                      {objectives.filter(obj => obj.activo !== false).map(obj => (
                        <option key={obj.id} value={obj.id}>{obj.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {selectedObjective && (
                <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '25px', paddingTop: '25px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '5px' }}>UBICACIÓN</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{selectedObjective.address}</div>
                  </div>
                  <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '5px' }}>PERSONAL ASIGNADO</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                      {companyUsers.filter(u => u.schedule?.objectiveId === selectedObjective.id).length} Guardias
                    </div>
                  </div>
                  <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '5px' }}>ESTADO</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#10b981' }}>● OPERATIVO</div>
                  </div>
                </div>
              )}

              {/* GESTIÓN DE OBJETIVOS (CLIENTE) */}
              <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>Cargar Nuevo Objetivo Operativo</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '5px' }}>Defina el nombre y la dirección del nuevo puesto de control.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', marginTop: '20px' }}>
                  <input
                    type="text"
                    placeholder="Nombre del Puesto (Ej: Planta Alfa)"
                    value={newObjective.nombre}
                    onChange={e => setNewObjective({ ...newObjective, nombre: e.target.value })}
                    style={{ ...styles.input, marginBottom: 0 }}
                  />
                  <input
                    type="text"
                    placeholder="Dirección Completa (Geolocalizar)"
                    value={newObjective.address}
                    onChange={e => setNewObjective({ ...newObjective, address: e.target.value })}
                    style={{ ...styles.input, marginBottom: 0 }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={geocodeObjectiveAddress}
                      disabled={isSaving}
                      className="secondary"
                      style={{ padding: '10px 15px', borderRadius: '12px', border: '1px solid rgba(0,210,255,0.5)', background: 'rgba(0,210,255,0.05)', color: '#00d2ff', cursor: 'pointer' }}
                    >
                      {isSaving ? <Loader2 size={16} className="spin" /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={handleSaveObjective}
                      disabled={isSaving || !newObjectiveCoords}
                      className="primary"
                      style={{ padding: '10px 20px', borderRadius: '12px', background: !newObjectiveCoords ? 'rgba(255,255,255,0.1)' : 'var(--primary)', color: 'white' }}
                    >
                      {isSaving ? <Loader2 size={16} className="spin" /> : 'GUARDAR OBJETIVO'}
                    </button>
                  </div>
                </div>
                {!newObjectiveCoords && (
                  <p style={{ fontSize: '0.65rem', color: '#f59e0b', marginTop: '10px' }}>* Debe usar la vista previa táctica antes de guardar el objetivo.</p>
                )}
              </div>

              {/* GRILLA DE OBJETIVOS (Diseño Premium Táctico) */}
              <div style={{ marginTop: '30px' }}>
                <div style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                    {Array.isArray(objectives) && objectives.filter(obj => obj.activo !== false).map(obj => {
                      const assignedGuards = companyUsers.filter(u => u.schedule?.objectiveId === obj.id);
                      const totalCount = assignedGuards.length;
                      const currentCount = assignedGuards.filter(u => {
                        const getT = (e) => {
                          if (!e) return 0;
                          if (e.fechaRegistro?.seconds) return e.fechaRegistro.seconds * 1000;
                          const d = new Date(e.fechaRegistro || e.created_at || e.fecha || 0);
                          return isNaN(d.getTime()) ? 0 : d.getTime();
                        };
                        const uKeys = [String(u.id || ''), String(u.uid || ''), String(u.legajo || '')].filter(k => k !== '');
                        const userEvents = events.filter(e => {
                          const eKey = String(e.usuarioId || e.userId || (typeof e.usuario === 'string' ? e.usuario : e.usuario?.id || e.usuario?.uid || '') || '');
                          return eKey !== '' && uKeys.includes(eKey);
                        });
                        const lastIn = userEvents.filter(e => e.tipo === 'ingreso').sort((a,b) => getT(b) - getT(a))[0];
                        const lastOut = userEvents.filter(e => e.tipo === 'egreso').sort((a,b) => getT(b) - getT(a))[0];
                        return lastIn && (!lastOut || getT(lastIn) > getT(lastOut));
                      }).length;

                      return (
                        <div
                          key={obj.id}
                          className="glass"
                          style={{
                            padding: '20px',
                            borderRadius: '22px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          {/* Borde neón lateral */}
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />

                          <div style={{ paddingLeft: '12px', flex: 1, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: '900', fontSize: '0.85rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {obj.nombre.toUpperCase()}
                              </div>
                              <div style={{ 
                                fontSize: '0.9rem', 
                                fontWeight: '900', 
                                color: totalCount === 0 ? 'rgba(255,255,255,0.2)' : (currentCount >= totalCount ? '#10b981' : (currentCount === 0 ? '#ef4444' : '#f59e0b')),
                                padding: '2px 8px',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '6px',
                                marginLeft: '10px'
                              }}>
                                {currentCount} / {totalCount}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {obj.address}
                            </div>
                          </div>

                          <button
                            onClick={() => handleSoftDeleteObjective(obj)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '12px',
                              width: '38px',
                              height: '38px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              marginLeft: '15px'
                            }}
                            title="Eliminar Objetivo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                    {objectives.length === 0 && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>No hay objetivos registrados.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeItem === 'Historial' && (
          <div className="fade-in">
            {/* Folder Navigation / Breadcrumbs */}
            <div className="glass" style={{ padding: '20px 30px', borderRadius: '25px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div 
                  onClick={async () => { setSelectedHistoryMonth(null); setSelectedHistoryWeek(null); setSelectedHistoryDate(null); }}
                  style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <HardDrive size={20} /> MI UNIDAD
                </div>
                {selectedHistoryMonth && (
                  <>
                    <ChevronRight size={16} style={{ opacity: 0.3 }} />
                    <div 
                       onClick={async () => { setSelectedHistoryWeek(null); setSelectedHistoryDate(null); }}
                       style={{ cursor: 'pointer', color: 'white', fontWeight: 'bold', textTransform: 'uppercase' }}
                    >
                       {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][parseInt(selectedHistoryMonth.split('-')[1]) - 1]} {selectedHistoryMonth.split('-')[0]}
                    </div>
                  </>
                )}
                {selectedHistoryWeek && (
                  <>
                    <ChevronRight size={16} style={{ opacity: 0.3 }} />
                    <div 
                       onClick={async () => { setSelectedHistoryDate(null); }}
                       style={{ cursor: 'pointer', color: 'white', fontWeight: 'bold' }}
                    >
                       SEMANA {selectedHistoryWeek}
                    </div>
                  </>
                )}
                {selectedHistoryDate && (
                  <>
                    <ChevronRight size={16} style={{ opacity: 0.3 }} />
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                       {new Date(selectedHistoryDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric' }).toUpperCase()}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                 {(() => {
                    const getFilteredEvents = () => {
                       let filtered = events;
                       if (selectedHistoryMonth) filtered = filtered.filter(e => e.fechaRegistro?.startsWith(selectedHistoryMonth));
                       if (selectedHistoryWeek) {
                          filtered = filtered.filter(e => {
                             const d = new Date(e.fechaRegistro);
                             return Math.ceil(d.getDate() / 7) === parseInt(selectedHistoryWeek);
                          });
                       }
                       if (selectedHistoryDate) filtered = filtered.filter(e => e.fechaRegistro?.startsWith(selectedHistoryDate));
                       return filtered;
                    };
                    const dataToExport = getFilteredEvents();
                    const title = selectedHistoryDate || (selectedHistoryWeek ? `Semana ${selectedHistoryWeek} - ${selectedHistoryMonth}` : selectedHistoryMonth || 'Historial Completo');
                    
                    return (
                       <>
                          <button onClick={() => exportToCSV(dataToExport, `Reporte_${title}`)} style={{ padding: '10px 15px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={14} /> CSV</button>
                          <button onClick={() => exportToCSV(dataToExport, `Excel_${title}`)} style={{ padding: '10px 15px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><FileSpreadsheet size={14} /> EXCEL</button>
                          <button onClick={() => exportToPDF(dataToExport, title)} style={{ padding: '10px 15px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><FileText size={14} /> PDF</button>
                       </>
                    );
                 })()}
              </div>
            </div>

            <div className="folder-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
               {/* MONTHS LEVEL */}
                {!selectedHistoryMonth && (() => {
                  const months = [...new Set(events.map(e => e.fechaRegistro?.substring(0, 7)))].filter(Boolean).sort().reverse();
                  return months.map(m => (
                     <div 
                        key={m} 
                        onClick={() => setSelectedHistoryMonth(m)}
                        className="glass folder-item"
                        style={{ padding: '25px', borderRadius: '22px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
                     >
                        <Folder size={60} color="#3b82f6" fill="#3b82f620" />
                        <div style={{ textAlign: 'center' }}>
                           <div style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                              {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][parseInt(m.split('-')[1]) - 1]} {m.split('-')[0]}
                           </div>
                           <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '5px' }}>
                              {events.filter(e => e.fechaRegistro?.startsWith(m) && !e.isToday).length} Registros
                           </div>
                        </div>
                     </div>
                  ));
               })()}

               {/* WEEKS LEVEL */}
               {selectedHistoryMonth && !selectedHistoryWeek && (() => {
                  const monthEvents = events.filter(e => e.fechaRegistro?.startsWith(selectedHistoryMonth) && !e.isToday);
                  const weeks = [...new Set(monthEvents.map(e => Math.ceil(new Date(e.fechaRegistro).getDate() / 7)))].sort();
                  return weeks.map(w => (
                     <div 
                        key={w} 
                        onClick={() => setSelectedHistoryWeek(w.toString())}
                        className="glass folder-item"
                        style={{ padding: '25px', borderRadius: '22px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
                     >
                        <Folder size={60} color="#10b981" fill="#10b98120" />
                        <div style={{ textAlign: 'center' }}>
                           <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>SEMANA {w}</div>
                           <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '5px' }}>
                              {monthEvents.filter(e => Math.ceil(new Date(e.fechaRegistro).getDate() / 7) === w && !e.isToday).length} Registros
                           </div>
                        </div>
                     </div>
                  ));
               })()}

               {/* DAYS LEVEL */}
               {selectedHistoryWeek && !selectedHistoryDate && (() => {
                  const weekEvents = events.filter(e => {
                     const d = new Date(e.fechaRegistro);
                     return e.fechaRegistro?.startsWith(selectedHistoryMonth) && Math.ceil(d.getDate() / 7) === parseInt(selectedHistoryWeek) && !e.isToday;
                  });
                  const days = [...new Set(weekEvents.map(e => e.fechaRegistro?.split('T')[0]))].sort();
                  return days.map(d => (
                     <div 
                        key={d} 
                        onClick={() => setSelectedHistoryDate(d)}
                        className="glass folder-item"
                        style={{ padding: '25px', borderRadius: '22px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
                     >
                        <Folder size={60} color="var(--primary)" fill="var(--primary)20" />
                        <div style={{ textAlign: 'center' }}>
                           <div style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                              {new Date(d + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })}
                           </div>
                           <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: '5px' }}>
                              {weekEvents.filter(e => e.fechaRegistro?.startsWith(d)).length} Registros
                           </div>
                        </div>
                     </div>
                  ));
               })()}
            </div>

            {/* EVENT LIST LEVEL */}
            {selectedHistoryDate && (
              <div className="glass fade-in" style={{ borderRadius: '25px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'left', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                      <th style={{ padding: '20px' }}>HORA</th>
                      <th>GUARDIA</th>
                      <th>TIPO</th>
                      <th>OBJETIVO</th>
                      <th>DETALLE</th>
                      <th>EVIDENCIA</th>
                      <th style={{ paddingRight: '20px' }}>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events
                      .filter(e => e.fechaRegistro?.split('T')[0] === selectedHistoryDate)
                      .sort((a, b) => b.hora?.localeCompare(a.hora))
                      .map((event, idx) => (
                        <tr 
                          key={idx} 
                          className="clickable-row"
                          onClick={() => setMediaModal({ 
                            show: true, 
                            type: (event.videoUrl || event.video) ? 'video' : (event.audioUrl || event.audio) ? 'audio' : 'image', 
                            content: event.fotoUrl || event.videoUrl || event.audioUrl || event.mediaUrl || event.foto || event.video || event.audio, 
                            event 
                          })}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}
                        >
                          <td style={{ padding: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{event.hora || '--:--'}</td>
                          <td>
                            {(() => {
                              const uId = event.usuarioId || event.guardiaId || (typeof event.usuario === 'object' ? (event.usuario.id || event.usuario.uid) : event.usuario);
                              const u = companyUsers.find(cu => (cu.id === uId || cu.uid === uId));
                              return u ? `${u.nombre || u.name} ${u.apellido || u.surname || ''}` : 'Sin datos';
                            })()}
                          </td>
                          <td>
                            <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 'bold', background: event.tipo === 'emergencia' ? '#ef444420' : '#ffffff05', color: event.tipo === 'emergencia' ? '#ef4444' : 'white' }}>{event.tipo?.toUpperCase()}</span>
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {(() => {
                               if (event.objetivoId) {
                                 const obj = objectives.find(o => String(o.id) === String(event.objetivoId));
                                 if (obj) return obj.nombre;
                               }
                               const uId = event.usuarioId || event.guardiaId || (typeof event.usuario === 'object' ? (event.usuario.id || event.usuario.uid) : event.usuario);
                               const u = companyUsers.find(cu => (cu.id === uId || cu.uid === uId));
                               if (u?.schedule?.objectiveId) {
                                 const obj = objectives.find(o => String(o.id) === String(u.schedule.objectiveId));
                                 if (obj) return obj.nombre;
                               }
                               return 'General';
                            })()}
                          </td>
                          <td style={{ maxWidth: '250px', fontSize: '0.8rem', opacity: 0.7 }}>
                             {event.mensaje || event.descripcion || (event.tipo === 'qr_scan' ? `Escaneo de Punto: ${event.puntoNombre || 'S/N'}` : 'Sin descripción')}
                          </td>
                          <td>
                             {event.hasMedia || event.mediaUrl || event.fotoUrl || event.videoUrl || event.audioUrl || (event.adjuntos && (event.adjuntos.foto || event.adjuntos.video || event.adjuntos.audio)) ? <Camera size={14} color="var(--primary)" /> : '---'}
                          </td>
                          <td style={{ paddingRight: '20px', fontSize: '0.7rem', fontWeight: '900', color: event.status === 'Cerrado' ? '#10b981' : '#ef4444' }}>{event.status?.toUpperCase() || 'ABIERTO'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* RESUMEN (Tablero Mejorado) */}
        {activeItem === 'Tablero' && (
          <div className="fade-in">
            {/* Estadísticas Rápidas — Acumulado del mes en curso */}
            {(() => {
              // DE-DUPLICACIÓN: Evitar doble conteo si hay eventos con el mismo ID
              const uniqueEvents = [];
              const eventIds = new Set();
              events.forEach(e => {
                if (!e.id) e.id = Math.random().toString(); // Fallback ID
                if (!eventIds.has(e.id)) {
                  eventIds.add(e.id);
                  uniqueEvents.push(e);
                }
              });

              const now = new Date();
              const currentMonth = now.getMonth();
              const currentYear = now.getFullYear();
              const eventsThisMonth = uniqueEvents.filter(e => {
                if (!e.fechaRegistro) return false;
                const d = new Date(e.fechaRegistro);
                // Usar Argentina timezone para determinar mes y año
                const arMonth = parseInt(new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Argentina/Buenos_Aires', month: '2-digit' }).format(d)) - 1;
                const arYear = parseInt(new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric' }).format(d));
                return arMonth === currentMonth && arYear === currentYear;
              });
              const rondasThisMonth = rondas.filter(r => {
                const d = new Date(r.inicio || r.fechaRegistro);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              });

              // TOTAL NOVEDADES: 
              const totalNovedades = eventsThisMonth.filter(e => {
                const t = (e.tipo || '').toLowerCase();
                return t === 'novedad' || t === 'informe';
              }).length;
              // RECORRIDOS: rondas QR o Libres completadas (Se basa en eventos para evitar conteo doble)
              const totalRecorridos = eventsThisMonth.filter(e => {
                const t = (e.tipo || '').toLowerCase();
                return t === 'recorrido' || t === 'ronda_completada' || t === 'recorrido_completado';
              }).length;
              // ALERTAS: botón de pánico
              const totalAlertas = eventsThisMonth.filter(e => {
                const t = (e.tipo || '').toLowerCase();
                return t === 'emergencia' || t === 'alerta';
              }).length;

              const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

              const totalActiveGuards = companyUsers.filter(u => {
                const getT = (e) => {
                  if (!e) return 0;
                  if (e.fechaRegistro?.seconds) return e.fechaRegistro.seconds * 1000;
                  const d = new Date(e.fechaRegistro || e.created_at || e.fecha || 0);
                  return isNaN(d.getTime()) ? 0 : d.getTime();
                };
                const uKeys = [String(u.id || ''), String(u.uid || ''), String(u.legajo || '')].filter(k => k !== '');
                const userEvents = events.filter(e => {
                  const eKey = String(e.usuarioId || e.userId || (typeof e.usuario === 'string' ? e.usuario : e.usuario?.id || e.usuario?.uid || '') || '');
                  return eKey !== '' && uKeys.includes(eKey);
                });
                const lastIn = userEvents.filter(e => e.tipo === 'ingreso').sort((a,b) => getT(b) - getT(a))[0];
                const lastOut = userEvents.filter(e => e.tipo === 'egreso').sort((a,b) => getT(b) - getT(a))[0];
                return lastIn && (!lastOut || getT(lastIn) > getT(lastOut));
              }).length;

              return (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                    <StatCard title="Operatividad Real" value={companyUsers.length} icon={<UserCheck />} color="#00a8ff" />
                    <StatCard title="Total Novedades" value={totalNovedades} icon={<FileText />} color="#f59e0b" />
                    <StatCard title="Recorridos" value={totalRecorridos} icon={<MapPin />} color="#10b981" />
                    <StatCard title="Alertas" value={totalAlertas} icon={<ShieldAlert />} color="#ef4444" />
                  </div>

                  {/* DASHBOARDS ANALÍTICOS LADO A LADO - Restringidos para Operadores */}
                  {user?.rol !== ROLES.OPERADOR && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '20px', marginBottom: '30px' }}>
                        
                        {/* DASHBOARD 1A: ESTADÍSTICAS OPERATIVAS (BARRAS) */}
                        <div className="glass fade-up" style={{ padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(145deg, rgba(30,41,59,0.3) 0%, rgba(15,23,42,0.5) 100%)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>Cómputo Total</h4>
                              <div style={{ padding: '8px', background: 'rgba(0,168,255,0.1)', borderRadius: '10px', color: '#00a8ff' }}><BarChart size={16} /></div>
                          </div>
                          
                          <div style={{ height: '180px', width: '100%' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                  <ReBarChart data={[
                                    { name: 'G.', val: companyUsers.length, c: '#3b82f6' },
                                    { name: 'N.', val: totalNovedades, c: '#f59e0b' },
                                    { name: 'R.', val: totalRecorridos, c: '#10b981' },
                                    { name: 'A.', val: totalAlertas, c: '#ef4444' }
                                  ]} margin={{ top: 5, right: 0, left: -35, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                                    <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={20}>
                                        { [0,1,2,3].map(i => <Cell key={i} fill={['#3b82f6','#f59e0b','#10b981','#ef4444'][i]} />) }
                                    </Bar>
                                  </ReBarChart>
                              </ResponsiveContainer>
                          </div>
                        </div>

                        {/* DASHBOARD 1B: TENDENCIA OPERATIVA (LÍNEAS) */}
                        <div className="glass fade-up" style={{ padding: '25px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(145deg, rgba(30,41,59,0.3) 0%, rgba(15,23,42,0.5) 100%)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                              <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: '900', color: 'white', textTransform: 'uppercase' }}>Tendencia Actividad</h4>
                              <div style={{ padding: '8px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', color: '#10b981' }}><TrendingUp size={16} /></div>
                          </div>
                          
                          <div style={{ height: '180px', width: '100%' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={[
                                    { d: 'L', v: 4 }, { d: 'M', v: 7 }, { d: 'M', v: 5 }, 
                                    { d: 'J', v: 9 }, { d: 'V', v: 12 }, { d: 'S', v: totalRecorridos }, { d: 'D', v: totalRecorridos + 2 }
                                  ]} margin={{ top: 5, right: 5, left: -35, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                                    <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                                    <Area type="monotone" dataKey="v" stroke="#10b981" fillOpacity={1} fill="url(#colorTrend)" strokeWidth={3} />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>
                        </div>

                        {/* DASHBOARD 2: RECURSOS Y SISTEMA */}
                        <div className="glass fade-up" style={{ padding: '30px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(145deg, rgba(30,41,59,0.3) 0%, rgba(15,23,42,0.5) 100%)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: 'white' }}>ACTIVIDAD DEL SISTEMA</h4>
                                <p style={{ margin: '5px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>Uso de almacenamiento y cuotas</p>
                              </div>
                              <div style={{ padding: '10px', background: 'rgba(168,85,247,0.1)', borderRadius: '12px', color: '#a855f7' }}><Server size={20} /></div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '180px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '15px' }}>
                                <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Uso del sistema</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#f59e0b', marginTop: '5px' }}>Nivel medio</div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                                      <div style={{ width: '50%', height: '100%', background: '#f59e0b' }} />
                                    </div>
                                </div>
                                <div style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>CUOTA DE USUARIOS</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#a855f7', marginTop: '5px' }}>{companyUsers.length} <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>/ 100</span></div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                                      <div style={{ width: `${(companyUsers.length / 100) * 100}%`, height: '100%', background: '#a855f7' }} />
                                    </div>
                                </div>
                              </div>

                              <div style={{ position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                          data={[
                                            { name: 'Nivel', value: 50 },
                                            { name: 'Resto', value: 50 }
                                          ]}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={60}
                                          outerRadius={80}
                                          paddingAngle={5}
                                          dataKey="value"
                                      >
                                          <Cell fill="#f59e0b" />
                                          <Cell fill="rgba(255,255,255,0.05)" />
                                      </Pie>
                                      <Tooltip 
                                          contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                                      />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white' }}>50%</div>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Nivel de actividad</div>
                                </div>
                              </div>
                          </div>
                        </div>
                      </div>

                    <div style={{ textAlign: 'right', marginBottom: '30px', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px', fontWeight: 'bold' }}>
                      ACUMULADO {monthNames[currentMonth]} {currentYear}
                    </div>
                  </>
                )}
              </>
            );
          })()}

            {/* Barra de Filtros */}
            <div className="glass" style={{ padding: '20px', borderRadius: '20px', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center' }}>
              <Filter size={20} color="var(--primary)" />
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <select
                  style={styles.filterSelect}
                  value={resumenFilters.objetivo}
                  onChange={(e) => setResumenFilters({ ...resumenFilters, objetivo: e.target.value })}
                >
                  <option value="">Todos los Objetivos</option>
                  {Array.isArray(objectives) && objectives.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </select>
                <select
                  style={styles.filterSelect}
                  value={resumenFilters.guardia}
                  onChange={(e) => setResumenFilters({ ...resumenFilters, guardia: e.target.value })}
                >
                  <option value="">Todos los Usuarios</option>
                  {companyUsers.map(u => <option key={u.id || u.uid} value={u.id || u.uid}>{u.nombre} {u.apellido}</option>)}
                </select>
                <select
                  style={styles.filterSelect}
                  value={resumenFilters.tipo}
                  onChange={(e) => setResumenFilters({ ...resumenFilters, tipo: e.target.value })}
                >
                  <option value="">Todos los Eventos</option>
                  <option value="novedad">Novedades</option>
                  <option value="recorrido">Recorridos</option>
                  <option value="emergencia">Emergencias</option>
                  <option value="ingreso">Ingresos / Egresos</option>
                </select>
              </div>
            </div>

            {/* Lista de Registros */}
            <div className="glass" style={{ padding: '0', borderRadius: '25px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                    <th style={{ padding: '20px' }}>FECHA / HORA</th>
                    <th>USUARIO</th>
                    <th>OBJETIVO / TIPO</th>
                    <th>DESCRIPCIÓN</th>
                    <th>MULTIMEDIA</th>
                    <th style={{ paddingRight: '20px' }}>ESTADO</th>
                  </tr>
                </thead>
                <tbody>
                  {events
                    .filter(e => e.isToday)
                    .filter(e => {
                      if (!resumenFilters.objetivo) return true;
                      let objId = e.objetivoId;
                      if (!objId) {
                        const uId = e.usuarioId || e.guardiaId || (typeof e.usuario === 'object' ? (e.usuario.id || e.usuario.uid) : null);
                        const guardUser = companyUsers.find(u => (u.id === uId || u.uid === uId));
                        objId = guardUser?.schedule?.objectiveId;
                      }
                      return objId === resumenFilters.objetivo;
                    })
                    .filter(e => {
                      if (!resumenFilters.guardia) return true;
                      const uId = e.usuarioId || e.guardiaId || (typeof e.usuario === 'object' ? (e.usuario.id || e.usuario.uid) : null);
                      return uId === resumenFilters.guardia;
                    })
                    .filter(e => {
                      if (!resumenFilters.tipo) {
                        // REGLA DE ORO: Ocultar eventos técnicos de qr_scan en la tabla de Resumen para evitar duplicidad visual
                        return e.tipo !== 'qr_scan';
                      }
                      const t = (e.tipo || '').toLowerCase();
                      if (resumenFilters.tipo === 'novedad') return t === 'novedad' || t === 'informe';
                      if (resumenFilters.tipo === 'recorrido') return t === 'recorrido' || t === 'ronda_completada' || t === 'recorrido_completado';
                      if (resumenFilters.tipo === 'emergencia') return t === 'emergencia' || t === 'alerta';
                      if (resumenFilters.tipo === 'ingreso') return t === 'ingreso' || t === 'egreso';
                      return t === resumenFilters.tipo;
                    })
                    .map((event, idx) => (
                      <tr
                        key={idx}
                        className="clickable-row"
                        onClick={(e) => {
                          if (!e.target.closest('.media-icon') && !e.target.closest('.guard-link')) {
                            setMediaModal({ show: true, type: event.mediaType || 'info', content: event.mediaUrl, event });
                            setResolutionText(event.resolution || '');
                          }
                        }}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}
                      >
                        <td style={{ padding: '20px' }}>
                          <div style={{ fontWeight: 'bold' }}>
                            {(() => {
                              const d = event.fechaRegistro || event.fecha || event.created_at;
                              const dateStr = getARDateStr(d);
                              if (!dateStr) return 'Hoy';
                              const [y, m, day] = dateStr.split('-');
                              return `${day}/${m}`;
                            })()}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{event.hora || 'S/H'}</div>
                        </td>
                        <td
                          className="guard-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            const u = (typeof event.usuario === 'object' && event.usuario !== null) 
                                ? event.usuario 
                                : companyUsers.find(cu => (cu.id === event.usuarioId || cu.uid === event.usuarioId || cu.id === event.guardiaId));
                            if (u) {
                              setSelectedUserForView(u);
                            }
                          }}
                          style={{ cursor: 'pointer', color: 'var(--primary)' }}
                        >
                          {(() => {
                             const u = (typeof event.usuario === 'object' && event.usuario !== null) 
                                 ? event.usuario 
                                 : companyUsers.find(cu => (cu.id === event.usuarioId || cu.uid === event.usuarioId || cu.id === event.guardiaId));
                             
                             return (
                                <>
                                  <div style={{ fontWeight: '900', textDecoration: 'underline' }}>
                                    {u ? `${u.nombre || u.name} ${u.apellido || u.surname || ''}` : 'Sin datos'}
                                  </div>
                                  <div style={{ fontSize: '0.65rem', color: 'rgba(0,168,255,0.5)' }}>
                                    ID: {u ? (u.legajo || 'S/L') : 'Sin datos'}
                                  </div>
                                </>
                             );
                          })()}
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold',
                            background: event.tipo === 'emergencia' ? 'rgba(239,68,68,0.1)' : 
                                       (event.tipo === 'ingreso' || event.tipo === 'egreso') ? 'rgba(245,158,11,0.1)' : 'rgba(0,168,255,0.1)',
                            color: event.tipo === 'emergencia' ? '#ef4444' : 
                                   (event.tipo === 'ingreso' || event.tipo === 'egreso') ? '#f59e0b' : 'var(--primary)',
                            textTransform: 'uppercase'
                          }}>
                            {event.tipo === 'ingreso' ? 'INGRESO' : (event.tipo === 'egreso' ? 'EGRESO' : event.tipo)}
                          </span>
                          <div style={{ fontSize: '0.7rem', marginTop: '5px', fontWeight: event.tipo === 'emergencia' ? '900' : 'normal', color: event.tipo === 'emergencia' ? '#ef4444' : 'rgba(255,255,255,0.3)' }}>
                            {(() => {
                              // Prioridad 1: ID de Objetivo directo (Nuevo en MySQL)
                              if (event.objetivoId) {
                                const obj = objectives.find(o => String(o.id) === String(event.objetivoId));
                                if (obj) return obj.nombre;
                              }

                              // Prioridad 2: Nombre guardado directamente en el evento
                              if (event.objetivoNombre) return event.objetivoNombre;
                              
                              // Prioridad 3: Buscar por usuario asignado (Schedule)
                              const uId = event.usuarioId || event.guardiaId || (typeof event.usuario === 'object' ? (event.usuario.id || event.usuario.uid) : null);
                              const guardUser = companyUsers.find(u => (u.id === uId || u.uid === uId));
                              
                              if (guardUser?.schedule?.objectiveId) {
                                const obj = objectives.find(o => String(o.id) === String(guardUser.schedule.objectiveId));
                                if (obj) return obj.nombre;
                              }
                              
                              return 'General / Base';
                            })()}
                          </div>
                        </td>
                        <td style={{ maxWidth: '250px', color: event.tipo === 'emergencia' ? '#ff4d4d' : 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: event.tipo === 'emergencia' ? 'bold' : 'normal' }}>
                          {event.tipo === 'emergencia' ? 'ACTIVACION BOTON PANICO' : 
                          (event.tipo === 'ingreso' ? 'Inicio de turno' : 
                          (event.tipo === 'egreso' ? 'Egreso de turno' : 
                          (event.tipo === 'qr_scan' ? `Escaneo de Punto: ${event.puntoNombre || 'S/N'}` : 
                          (event.mensaje || event.descripcion || 'Sin descripción').replace(/\(Archivos adjuntos:.*?\)/gi, '').trim())))}
                        </td>
                        <td>
                          {(() => {
                            // Detectar multimedia real desde nuevos campos LONGTEXT, adjuntos o legacy
                            const hasAdjuntos = (event.adjuntos && (event.adjuntos.foto || event.adjuntos.video || event.adjuntos.audio));
                            const hasNewMedia = event.fotoUrl || event.videoUrl || event.audioUrl;
                            const hasLegacyMedia = event.hasMedia || event.mediaUrl || event.foto || event.video || event.audio || event.mediaType;
                            const hasDescMedia = event.descripcion && (event.descripcion.toLowerCase().includes('adjuntos') || event.descripcion.toLowerCase().includes('fotografia') || event.descripcion.toLowerCase().includes('video') || event.descripcion.toLowerCase().includes('audio'));
                            
                            const hasFoto = event.fotoUrl || (hasAdjuntos ? !!event.adjuntos.foto : (event.mediaType === 'image' || event.foto || (event.descripcion && event.descripcion.toLowerCase().includes('fotografia'))));
                            const hasVideo = event.videoUrl || (hasAdjuntos ? !!event.adjuntos.video : (event.mediaType === 'video' || event.video || (event.descripcion && event.descripcion.toLowerCase().includes('video'))));
                            const hasAudio = event.audioUrl || (hasAdjuntos ? !!event.adjuntos.audio : (event.mediaType === 'audio' || event.audio || (event.descripcion && event.descripcion.toLowerCase().includes('audio'))));

                            if (hasFoto || hasVideo || hasAudio || hasLegacyMedia || hasDescMedia) {
                              return (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {hasFoto && (
                                    <Camera
                                      size={18}
                                      className="media-icon"
                                      style={{ cursor: 'pointer', color: 'var(--primary)', transition: '0.3s' }}
                                      onClick={() => setMediaModal({ show: true, type: 'image', content: event.fotoUrl || event.mediaUrl || event.foto, event })}
                                    />
                                  )}
                                  {hasVideo && (
                                    <Play
                                      size={18}
                                      className="media-icon"
                                      style={{ cursor: 'pointer', color: '#00a8ff', transition: '0.3s' }}
                                      onClick={() => setMediaModal({ show: true, type: 'video', content: event.videoUrl || event.video, event })}
                                    />
                                  )}
                                  {hasAudio && (
                                    <Volume2
                                      size={18}
                                      className="media-icon"
                                      style={{ cursor: 'pointer', color: '#10b981', transition: '0.3s' }}
                                      onClick={() => setMediaModal({ show: true, type: 'audio', content: event.audioUrl || event.audio, event })}
                                    />
                                  )}
                                  {!hasFoto && !hasVideo && !hasAudio && (hasLegacyMedia || hasDescMedia) && (
                                    <Paperclip
                                      size={18}
                                      className="media-icon"
                                      style={{ cursor: 'pointer', color: 'var(--primary)', transition: '0.3s' }}
                                      onClick={() => setMediaModal({ show: true, type: 'info', content: event.mediaUrl, event })}
                                    />
                                  )}
                                </div>
                              );
                            }
                            return <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>Sin archivos</span>;
                          })()}
                        </td>
                        <td style={{ paddingRight: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: event.status === 'Cerrado' ? '#10b981' : (event.status === 'En Seguimiento' ? '#f59e0b' : '#ef4444'), fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {event.status === 'Cerrado' ? <CheckCircle size={14} /> : <div style={{ width: '8px', height: '8px', background: 'currentColor', borderRadius: '50%' }} />}
                            {event.status || 'Abierto'}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>CID: {event.empresaId?.slice(-6) || 'DEMO'}</div>
                        </td>
                      </tr>
                    ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '50px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>No se encontraron registros activos para los filtros seleccionados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODALES TÁCTICOS - GESTIÓN DE PERSONAL Y EVENTOS */}
        
        {/* Modal: Agregar Nuevo Guardia */}
        {showUserModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
             <div className="glass fade-up" style={{ width: '600px', padding: '40px', borderRadius: '32px', border: '1px solid rgba(0,168,255,0.3)', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 25px', display: 'flex', alignItems: 'center', gap: '15px' }}><Plus size={24} color="#00d2ff" /> Alta de Nuevo Personal</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                   <div><label style={styles.modalLabel}>Nombre</label><input type="text" value={newUser.nombre} onChange={e => setNewUser({...newUser, nombre: e.target.value})} style={styles.input} /></div>
                   <div><label style={styles.modalLabel}>Apellido</label><input type="text" value={newUser.apellido} onChange={e => setNewUser({...newUser, apellido: e.target.value})} style={styles.input} /></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                   <div><label style={styles.modalLabel}>DNI / Documento</label><input type="text" value={newUser.dni} onChange={e => setNewUser({...newUser, dni: e.target.value})} style={styles.input} /></div>
                   <div><label style={styles.modalLabel}>Legajo / ID</label><input type="text" value={newUser.legajo} onChange={e => setNewUser({...newUser, legajo: e.target.value})} style={styles.input} /></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                   <div><label style={styles.modalLabel}>Email Personal</label><input type="email" value={newUser.emailPersonal} onChange={e => setNewUser({...newUser, emailPersonal: e.target.value})} style={styles.input} /></div>
                   <div><label style={styles.modalLabel}>Fecha de Nacimiento</label><input type="date" value={newUser.fechaNacimiento} onChange={e => setNewUser({...newUser, fechaNacimiento: e.target.value})} style={styles.input} /></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                   <div><label style={styles.modalLabel}>Teléfono</label><input type="tel" value={newUser.telefono} onChange={e => setNewUser({...newUser, telefono: e.target.value})} style={styles.input} /></div>
                   <div><label style={styles.modalLabel}>Rol / Rango</label>
                      <select value={newUser.rol} onChange={e => setNewUser({...newUser, rol: e.target.value})} style={styles.input}>
                         <option value="GUARDIA">GUARDIA (App Móvil)</option>
                         <option value="SUPERVISOR">SUPERVISOR (App Móvil)</option>
                         <option value="OPERADOR">OPERADOR (Panel Control)</option>
                         <option value="ADMIN">ADMINISTRADOR (Acceso Total)</option>
                      </select>
                   </div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                   <label style={styles.modalLabel}>Email de Acceso (USUARIO)</label>
                   <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} style={styles.input} />
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                   <button onClick={handleAddGuard} className="primary" style={{ flex: 1, padding: '15px', borderRadius: '15px' }}>REGISTRAR USUARIO</button>
                   <button onClick={() => setShowUserModal(false)} className="secondary" style={{ flex: 1, padding: '15px', borderRadius: '15px' }}>CANCELAR</button>
                </div>
             </div>
          </div>
        )}

        {/* Modal: Editar Guardia */}
        {showEditUserModal && editingUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
             <div className="glass fade-up" style={{ width: '600px', padding: '40px', borderRadius: '32px', border: '1px solid #00d2ff', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 25px', display: 'flex', alignItems: 'center', gap: '15px' }}><UserCircle size={24} color="#00d2ff" /> Modificar Datos: {editingUser.nombre}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                   <div><label style={styles.modalLabel}>Nombre</label><input type="text" value={editingUser.nombre} onChange={e => setEditingUser({...editingUser, nombre: e.target.value})} style={styles.input} /></div>
                   <div><label style={styles.modalLabel}>Apellido</label><input type="text" value={editingUser.apellido} onChange={e => setEditingUser({...editingUser, apellido: e.target.value})} style={styles.input} /></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                   <div><label style={styles.modalLabel}>DNI / Documento</label><input type="text" value={editingUser.dni} onChange={e => setEditingUser({...editingUser, dni: e.target.value})} style={styles.input} /></div>
                   <div><label style={styles.modalLabel}>Legajo / ID</label><input type="text" value={editingUser.legajo} onChange={e => setEditingUser({...editingUser, legajo: e.target.value})} style={styles.input} /></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                   <div><label style={styles.modalLabel}>Email Personal</label><input type="email" value={editingUser.emailPersonal} onChange={e => setEditingUser({...editingUser, emailPersonal: e.target.value})} style={styles.input} /></div>
                   <div><label style={styles.modalLabel}>Fecha de Nacimiento</label><input type="date" value={editingUser.fechaNacimiento} onChange={e => setEditingUser({...editingUser, fechaNacimiento: e.target.value})} style={styles.input} /></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                   <div><label style={styles.modalLabel}>Teléfono</label><input type="tel" value={editingUser.telefono} onChange={e => setEditingUser({...editingUser, telefono: e.target.value})} style={styles.input} /></div>
                   <div><label style={styles.modalLabel}>Rol / Rango</label>
                      <select value={editingUser.rol || editingUser.role} onChange={e => setEditingUser({...editingUser, rol: e.target.value, role: e.target.value})} style={styles.input}>
                         <option value="GUARDIA">GUARDIA (App Móvil)</option>
                         <option value="SUPERVISOR">SUPERVISOR (App Móvil)</option>
                         <option value="OPERADOR">OPERADOR (Panel Control)</option>
                         <option value="ADMIN">ADMINISTRADOR (Acceso Total)</option>
                      </select>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                   <div><label style={styles.modalLabel}>Email de Acceso</label><input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} style={styles.input} /></div>
                   <div><label style={styles.modalLabel}>Estado</label>
                      <select value={editingUser.estado || editingUser.status} onChange={e => setEditingUser({...editingUser, estado: e.target.value})} style={styles.input}>
                         <option value="ACTIVO">ACTIVO</option>
                         <option value="INACTIVO">INACTIVO</option>
                      </select>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                   <button onClick={handleEditUserSave} className="primary" style={{ flex: 1, padding: '15px', borderRadius: '15px' }}>GUARDAR CAMBIOS</button>
                   <button onClick={() => setShowEditUserModal(false)} className="secondary" style={{ flex: 1, padding: '15px', borderRadius: '15px' }}>DESCARTAR</button>
                </div>
             </div>
          </div>
        )}

        {/* Modal: Planificación de Turnos (Shift) */}
        {showShiftModal && selectedUser && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
             <div className="glass fade-up custom-scrollbar" style={{ width: '550px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', borderRadius: '32px', border: '1px solid #10b981' }}>
                <h3 style={{ margin: '0 0 25px', display: 'flex', alignItems: 'center', gap: '15px' }}><Calendar size={24} color="#10b981" /> Agenda Operativa: {selectedUser.nombre}</h3>
                
                <div style={{ marginBottom: '20px' }}>
                   <label style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block', marginBottom: '10px' }}>OBJETIVO ASIGNADO (UBICACIÓN)</label>
                   <select 
                      value={scheduleUpdate.objectiveId} 
                      onChange={e => setScheduleUpdate({...scheduleUpdate, objectiveId: e.target.value})} 
                      style={{ ...styles.input, fontSize: '1rem' }}
                   >
                      <option value="">Seleccione un objetivo...</option>
                      {Array.isArray(objectives) && objectives.map(obj => <option key={obj.id} value={obj.id}>{obj.nombre}</option>)}
                   </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                   <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Hora de Entrada</label>
                      <input type="time" value={scheduleUpdate.startTime} onChange={e => setScheduleUpdate({...scheduleUpdate, startTime: e.target.value})} style={styles.input} />
                   </div>
                   <div>
                      <label style={{ fontSize: '0.75rem', opacity: 0.5 }}>Hora de Salida</label>
                      <input type="time" value={scheduleUpdate.endTime} onChange={e => setScheduleUpdate({...scheduleUpdate, endTime: e.target.value})} style={styles.input} />
                   </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                   <label style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block', marginBottom: '12px' }}>DÍAS DE SERVICIO (Haga clic para alternar)</label>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(day => (
                         <button 
                            key={day}
                            onClick={() => toggleDay(day)}
                            style={{ 
                               padding: '12px', minWidth: '45px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid',
                               background: scheduleUpdate.workingDays.includes(day) ? '#10b981' : 'transparent',
                               borderColor: scheduleUpdate.workingDays.includes(day) ? '#10b981' : 'rgba(255,255,255,0.1)',
                               color: scheduleUpdate.workingDays.includes(day) ? 'white' : 'rgba(255,255,255,0.4)',
                               cursor: 'pointer', transition: '0.2s'
                            }}
                         >
                            {day}
                         </button>
                      ))}
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                   <button onClick={saveSchedule} className="primary" style={{ flex: 1, padding: '15px', borderRadius: '15px', background: '#10b981', color: 'white' }}>ACTUALIZAR AGENDA</button>
                   <button onClick={() => setShowShiftModal(false)} className="secondary" style={{ flex: 1, padding: '15px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>CANCELAR</button>
                </div>
             </div>
          </div>
        )}

        {/* Modal: Papelera de Reciclaje */}
        {showTrashModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
            <div className="glass fade-up" style={{ width: '800px', padding: '40px', borderRadius: '32px', border: '1px solid #ef4444', boxShadow: '0 0 50px rgba(239, 68, 68, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px' }}><Trash2 color="#ef4444" size={28} /> Papelera Operativa</h3>
                <button onClick={() => setShowTrashModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X /></button>
              </div>

              <div style={{ maxHeight: '450px', overflowY: 'auto', marginBottom: '30px', paddingRight: '10px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                      <th style={{ padding: '15px' }}>ÍTEM DESACTIVADO</th>
                      <th>MOTIVO / TIPO</th>
                      <th>FECHA ELIMINACIÓN</th>
                      <th style={{ textAlign: 'right' }}>RECUPERACIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '15px' }}>
                          <div style={{ fontWeight: 'bold' }}>{item.nombre} {item.apellido}</div>
                          <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>DNI: {item.dni} • Legajo: {item.legajo}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 'bold' }}>PERSONAL</span>
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(item.deletedAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleRestoreFromTrash(item)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>RESTAURAR</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {trashItems.length === 0 && (
                      <tr><td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>La papelera está limpia.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setShowTrashModal(false)} style={{ width: '100%', padding: '18px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>SALIR DE PAPELERA</button>
            </div>
          </div>
        )}

        {/* Modal: Visor Multimedia de Eventos */}
        {mediaModal.show && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1500 }}>
                <div className="glass fade-up" style={{ width: '950px', maxHeight: '90vh', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '0', borderRadius: '32px', border: '1px solid rgba(0,168,255,0.3)', overflow: 'hidden' }}>
                  {/* Lado Izquierdo: Evidencia Visual y Geográfica */}
                  <div style={{ padding: '30px', background: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: '90vh' }} className="custom-scrollbar">
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                           <h3 style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--primary)', fontSize: '1rem' }}>Evidencia del Evento</h3>
                           <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                              {mediaModal.event?.tipo?.toUpperCase() || 'NOTIFICACIÓN'} • {mediaModal.event?.hora || '--:--'} • {(() => {
                                 const d = mediaModal.event?.fechaRegistro || mediaModal.event?.created_at || mediaModal.event?.fecha;
                                 return getARDateStr(d).split('-').reverse().join('/') || 'Hoy';
                              })()}
                           </div>
                        </div>
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                        <div className="glass" style={{ height: '320px', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(0,168,255,0.2)', position: 'relative' }}>
                           {(() => {
                              let lat = parseFloat(mediaModal.event?.lat || mediaModal.event?.latitude);
                              let lng = parseFloat(mediaModal.event?.lng || mediaModal.event?.longitude);
                              
                              // Fallback: Parsear string "lat,lng" si existe
                              if ((isNaN(lat) || isNaN(lng)) && mediaModal.event?.gps && typeof mediaModal.event.gps === 'string') {
                                 const parts = mediaModal.event.gps.split(',');
                                 if (parts.length === 2) {
                                    lat = parseFloat(parts[0]);
                                    lng = parseFloat(parts[1]);
                                 }
                              }

                              const finalLat = (!isNaN(lat) && lat !== 0) ? lat : -34.6037;
                              const finalLng = (!isNaN(lng) && lng !== 0) ? lng : -58.3816;

                              return (
                                 <React.Fragment key={mediaModal.event?.id || 'map'}>
                                    <MapContainer 
                                       center={[finalLat, finalLng]} 
                                       zoom={18} 
                                       style={{ height: '100%', width: '100%' }}
                                       zoomControl={false}
                                    >
                                       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                       <Marker position={[finalLat, finalLng]} icon={guardIcon} />
                                    </MapContainer>
                                    <div style={{ position: 'absolute', bottom: '15px', left: '15px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', padding: '8px 15px', borderRadius: '10px', fontSize: '0.65rem', color: 'white', border: '1px solid rgba(0,168,255,0.3)', zIndex: 1000, fontWeight: 'bold' }}>
                                       UBICACIÓN DE ORIGEN: {finalLat.toFixed(6)}, {finalLng.toFixed(6)}
                                    </div>
                                 </React.Fragment>
                              );
                           })()}
                         </div>

                         {/* HELPER RESOLVER (Inlined for simplicity and reliability) */}
                         {(() => {
                            const resolveSrc = (val) => {
                               if (!val) return null;
                               if (typeof val === 'string' && val.startsWith('centinela_')) {
                                  return localStorage.getItem(val);
                               }
                               return val;
                            };

                            const fotoSrc = resolveSrc(mediaModal.event?.fotoUrl || mediaModal.event?.adjuntos?.foto || mediaModal.event?.foto || (mediaModal.type === 'image' ? mediaModal.content : null));
                            const videoSrc = resolveSrc(mediaModal.event?.videoUrl || mediaModal.event?.adjuntos?.video || mediaModal.event?.video || (mediaModal.type === 'video' ? mediaModal.content : null));
                            const audioSrc = resolveSrc(mediaModal.event?.audioUrl || mediaModal.event?.adjuntos?.audio || mediaModal.event?.audio || (mediaModal.type === 'audio' ? mediaModal.content : null));

                            return (
                               <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', padding: '25px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
                                        {(['recorrido', 'ronda_completada', 'recorrido_completado', 'ronda'].includes(mediaModal.event?.tipo?.toLowerCase())) ? 'PUNTOS DE CONTROL RECORRIDO' : 'ARCHIVOS ADJUNTOS'}
                                     </span>
                                     <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold' }}>{(['recorrido', 'ronda_completada', 'recorrido_completado', 'ronda'].includes(mediaModal.event?.tipo?.toLowerCase())) ? 'VERIFICACIÓN DE RONDA' : 'HAZ CLIC PARA AMPLIAR'}</span>
                                  </div>

                                  {(['recorrido', 'ronda_completada', 'recorrido_completado', 'ronda'].includes(mediaModal.event?.tipo?.toLowerCase())) && (
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '10px' }}>
                                         {(() => {
                                            // 1. Prioridad absoluta: Datos reales enviados por la App móvil en el objeto evento
                                            let points = mediaModal.event?.puntos || mediaModal.event?.checkpoints;
                                            
                                            // 2. Si no vienen embebidos, buscar los puntos configurados para este objetivo en el sistema
                                            if (!Array.isArray(points) || points.length === 0) {
                                               // Búsqueda resiliente: si falta objetivoId, intentamos deducirlo por el nombre en la descripción
                                               const desc = mediaModal.event?.descripcion || mediaModal.event?.mensaje || "";
                                               const obj = objectives.find(o => o.id === mediaModal.event?.objetivoId || (o.nombre && desc.includes(o.nombre)));
                                               if (obj) {
                                                  points = qrPoints.filter(p => p.objectiveId === obj.id);
                                               }
                                            }

                                            // Si no hay datos reales ni configurados, no mostramos nada para evitar "inventar" datos
                                            if (!Array.isArray(points) || points.length === 0) return null;

                                            return points.map((p, idx) => {
                                               // Determinar si fue escaneado usando el dato real del punto o el estado del evento
                                               const isScanned = p.escaneado !== false && p.status !== 'pendiente';
                                               
                                               return (
                                                  <div key={p.id || idx} style={{ 
                                                     background: isScanned ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                                                     border: `1px solid ${isScanned ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                                     padding: '15px 10px', borderRadius: '18px', textAlign: 'center'
                                                  }}>
                                                     <QrCode size={20} color={isScanned ? '#10b981' : '#ef4444'} style={{ marginBottom: '8px' }} />
                                                     <div style={{ fontSize: '0.6rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', height: '1.4rem', overflow: 'hidden' }}>{p.name || p.nombre || `PUNTO ${idx + 1}`}</div>
                                                     <div style={{ fontSize: '0.5rem', fontWeight: 'bold', color: isScanned ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                                                        {isScanned ? 'REGISTRADO' : 'INCOMPLETO'}
                                                     </div>
                                                  </div>
                                               );
                                            });
                                         })()}
                                      </div>
                                   )}

                                  <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                                     {/* FOTOGRAFIA */}
                                     {fotoSrc && (
                                        <div 
                                           onClick={() => setFullscreenMedia({ type: 'image', src: fotoSrc })}
                                           className="folder-card"
                                           style={{ minWidth: '180px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}
                                        >
                                           <img src={fotoSrc} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                           <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)', display: 'flex', alignItems: 'flex-end', padding: '10px' }}>
                                              <div style={{ fontSize: '0.6rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><Camera size={10} /> IMAGEN</div>
                                           </div>
                                        </div>
                                     )}

                                     {/* VIDEO */}
                                     {videoSrc && (
                                        <div 
                                           onClick={() => setFullscreenMedia({ type: 'video', src: videoSrc })}
                                           className="folder-card"
                                           style={{ minWidth: '180px', height: '120px', background: 'rgba(0,168,255,0.1)', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(0,168,255,0.2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                           <Play size={40} color="var(--primary)" />
                                           <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)', display: 'flex', alignItems: 'flex-end', padding: '10px' }}>
                                              <div style={{ fontSize: '0.6rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><MonitorPlay size={10} /> VIDEO</div>
                                           </div>
                                        </div>
                                     )}

                                     {/* AUDIO */}
                                     {audioSrc && (
                                        <div 
                                           onClick={() => setFullscreenMedia({ type: 'audio', src: audioSrc })}
                                           className="folder-card"
                                           style={{ minWidth: '180px', height: '120px', background: 'rgba(16,185,129,0.1)', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', border: '1px solid rgba(16,185,129,0.2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                           <Volume2 size={40} color="#10b981" />
                                           <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)', display: 'flex', alignItems: 'flex-end', padding: '10px' }}>
                                              <div style={{ fontSize: '0.6rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><Headphones size={10} /> AUDIO</div>
                                           </div>
                                        </div>
                                     )}

                                     {/* SIN ARCHIVOS */}
                                     {!fotoSrc && !videoSrc && !audioSrc && (
                                        <div style={{ width: '100%', padding: '40px', textAlign: 'center', opacity: 0.2 }}>
                                           <ShieldAlert size={48} style={{ marginBottom: '10px' }} />
                                           <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>SIN MULTIMEDIAS ADJUNTAS</div>
                                        </div>
                                     )}
                                  </div>
                               </div>
                            );
                         })()}
                      </div>
                   </div>

                  {/* Lado Derecho: Gestión y Resolución */}
                  <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px', borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto', maxHeight: '90vh' }} className="custom-scrollbar">
                     <div>
                        <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>DETALLE DEL EVENTO</label>
                        <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '15px' }}>
                           {mediaModal.event?.mensaje || mediaModal.event?.descripcion || 'Sin descripción.'}
                        </div>
                     </div>

                     {(mediaModal.event?.inicio || mediaModal.event?.fin) && (
                        <div className="fade-in">
                           <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>TIEMPOS DE OPERACIÓN</label>
                           <div style={{ display: 'flex', gap: '15px', background: 'rgba(0,168,255,0.05)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(0,168,255,0.1)' }}>
                              <div style={{ flex: 1 }}>
                                 <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>Hora Inicio</div>
                                 <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#00d2ff', marginTop: '2px' }}>{mediaModal.event?.inicio || '--:--'}</div>
                              </div>
                              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                              <div style={{ flex: 1 }}>
                                 <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase' }}>Hora Fin</div>
                                 <div style={{ fontSize: '0.95rem', fontWeight: '900', color: '#00d2ff', marginTop: '2px' }}>{mediaModal.event?.fin || '--:--'}</div>
                              </div>
                           </div>
                        </div>
                     )}

                     <div style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '5px', marginBottom: '10px' }} className="custom-scrollbar">
                        <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>HISTORIAL DE GESTIÓN</label>
                        {(() => {
                           let history = mediaModal.event?.history;
                           if (typeof history === 'string') {
                              try { history = JSON.parse(history); } catch(e) { history = []; }
                           }
                           if (!Array.isArray(history)) history = [];

                           if (history.length > 0) {
                              return (
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[...history].reverse().map((h, idx) => (
                                       <div key={idx} style={{ 
                                          background: 'rgba(255,255,255,0.02)', 
                                          padding: '12px', 
                                          borderRadius: '14px', 
                                          border: '1px solid rgba(255,255,255,0.05)',
                                          position: 'relative'
                                       }}>
                                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                             <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: h.status === 'Cerrado' ? '#10b981' : (h.status === 'En Seguimiento' ? '#f59e0b' : '#ef4444') }} />
                                                <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'white' }}>{h.user || 'Operador'}</span>
                                             </div>
                                             <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 'bold' }}>{h.date ? new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}</span>
                                          </div>
                                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>
                                             {h.resolution || <em style={{ opacity: 0.5 }}>Sin comentarios adicionales</em>}
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              );
                           }
                           return (
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.15)', textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.01)', borderRadius: '15px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                                 No hay registros de seguimiento para este evento.
                              </div>
                           );
                        })()}
                     </div>

                     <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '8px' }}>RESOLUCIÓN / NOTAS</label>
                        <textarea value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} style={{ ...styles.input, height: '120px', fontSize: '0.85rem', resize: 'none' }} placeholder="Comentarios..." />
                     </div>

                     <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                           <button 
                             onClick={() => handleUpdateEventStatus('Abierto')} 
                             style={{ 
                               padding: '12px 5px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                               background: (mediaModal.event?.status === 'Abierto' || !mediaModal.event?.status) ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                               color: (mediaModal.event?.status === 'Abierto' || !mediaModal.event?.status) ? '#ef4444' : 'rgba(255,255,255,0.4)',
                               border: (mediaModal.event?.status === 'Abierto' || !mediaModal.event?.status) ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)'
                             }}
                           >ABIERTO</button>
                           <button 
                             onClick={() => handleUpdateEventStatus('En Seguimiento')} 
                             style={{ 
                               padding: '12px 5px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                               background: mediaModal.event?.status === 'En Seguimiento' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                               color: mediaModal.event?.status === 'En Seguimiento' ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                               border: mediaModal.event?.status === 'En Seguimiento' ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)'
                             }}
                           >SEGUIMIENTO</button>
                           <button 
                             onClick={() => handleUpdateEventStatus('Cerrado')} 
                             style={{ 
                               padding: '12px 5px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                               background: mediaModal.event?.status === 'Cerrado' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                               color: mediaModal.event?.status === 'Cerrado' ? '#10b981' : 'rgba(255,255,255,0.4)',
                               border: mediaModal.event?.status === 'Cerrado' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)'
                             }}
                           >CERRADO</button>
                        </div>
                        <button className="primary" onClick={() => handleUpdateEventStatus(mediaModal.event?.status || 'Abierto')} style={{ padding: '15px', borderRadius: '14px', width: '100%' }}>GUARDAR RESOLUCIÓN</button>
                        <button onClick={() => setMediaModal({ show: false, content: null, type: null, event: null })} style={{ padding: '15px', borderRadius: '14px', width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>CERRAR</button>
                     </div>
                  </div>
               </div>
            </div>
        )}

        {/* POP-OUT MEDIA VIEWER (Fullscreen) */}
        {fullscreenMedia && (
           <div 
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '40px' }}
              onClick={() => setFullscreenMedia(null)}
           >
              <div style={{ position: 'absolute', top: '40px', right: '40px', display: 'flex', gap: '20px' }}>
                 <a href={fullscreenMedia.src} target="_blank" rel="noopener noreferrer" className="glass" style={{ padding: '12px 25px', borderRadius: '12px', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    <Download size={18} /> DESCARGAR ORIGINAL
                 </a>
                 <button className="glass" onClick={() => setFullscreenMedia(null)} style={{ border: 'none', color: 'white', width: '45px', height: '45px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={24} />
                 </button>
              </div>

              <div className="fade-in" style={{ maxWidth: '90%', maxHeight: '80%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 50px 100px rgba(0,0,0,0.9)', borderRadius: '20px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                 {fullscreenMedia.type === 'image' && (
                    <img src={fullscreenMedia.src} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
                 )}
                 {fullscreenMedia.type === 'video' && (
                     <video 
                        key={fullscreenMedia.src}
                        controls 
                        autoPlay 
                        playsInline
                        style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '15px' }}
                     >
                        <source 
                           src={fullscreenMedia.src?.startsWith('data:') || fullscreenMedia.src?.startsWith('http') || fullscreenMedia.src?.startsWith('blob:') 
                              ? fullscreenMedia.src 
                              : `data:video/mp4;base64,${fullscreenMedia.src}`} 
                           type="video/mp4" 
                        />
                        <source 
                           src={fullscreenMedia.src?.startsWith('data:') || fullscreenMedia.src?.startsWith('http') || fullscreenMedia.src?.startsWith('blob:') 
                              ? fullscreenMedia.src 
                              : `data:video/webm;base64,${fullscreenMedia.src}`} 
                           type="video/webm" 
                        />
                        Tu navegador no admite la reproducción de video.
                     </video>
                  )}
                 {fullscreenMedia.type === 'audio' && (
                    <div style={{ background: '#1e293b', padding: '60px', borderRadius: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', border: '1px solid rgba(255,255,255,0.1)' }}>
                       <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Volume2 size={48} color="#10b981" />
                       </div>
                       <audio src={fullscreenMedia.src} controls autoPlay style={{ width: '350px' }} />
                       <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>REPRODUCIENDO EVIDENCIA DE AUDIO</div>
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* CONFIGURACIÓN ENTERPRISE INJECTED MODO */}
        {activeItem === 'Configuración' && (
           <EnterpriseConfigPanel 
              companyData={companyData} 
              companyUsers={companyUsers}
              objectives={objectives}
              showToast={showToast} 
              refreshData={loadData}
              setSelectedUserForView={setSelectedUserForView}
              setNewObjective={setNewObjective}
              setNewObjectiveCoords={setNewObjectiveCoords}
              setShowNewObjectiveModal={setShowNewObjectiveModal}
              toggleBranchStatus={toggleBranchStatus}
           />
        )}

        {activeItem === 'Facturación' && (
           <BillingPanel 
              companyData={companyData} 
              showToast={showToast} 
              refreshData={loadData}
              currentPlanInfo={currentPlanInfo}
           />
        )}
      </div>

       {/* MODAL: NUEVA SUCURSAL / OBJETIVO */}
       {showNewObjectiveModal && (
         <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000 }}>
           <div className="glass fade-up" style={{ width: '100%', maxWidth: '900px', borderRadius: '32px', border: '1px solid var(--primary)', overflow: 'hidden', boxShadow: '0 0 100px rgba(0,210,255,0.15)' }}>
             <div style={{ display: 'flex', height: '600px' }}>
               {/* Left Side: Form */}
               <div style={{ flex: '0 0 350px', padding: '40px', background: 'rgba(15, 23, 42, 0.9)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                   <div style={{ padding: '10px', background: 'rgba(0,210,255,0.1)', borderRadius: '12px', color: '#00d2ff' }}>
                     <Building2 size={24} />
                   </div>
                   <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900' }}>Nuevo Puesto</h3>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                   <div>
                     <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>NOMBRE DEL PUESTO</label>
                     <input 
                       type="text" 
                       placeholder="Ej: Planta Industrial Sur"
                       value={newObjective.nombre}
                       onChange={e => setNewObjective({ ...newObjective, nombre: e.target.value })}
                       style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', color: 'white', outline: 'none' }}
                     />
                   </div>

                   <div>
                     <label style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '1px', display: 'block', marginBottom: '10px' }}>DIRECCIÓN (CALLE Y NRO)</label>
                     <div style={{ display: 'flex', gap: '10px' }}>
                       <input 
                         type="text" 
                         placeholder="Av. Corrientes 1200, CABA"
                         value={newObjective.address}
                         onChange={e => setNewObjective({ ...newObjective, address: e.target.value })}
                         style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px', color: 'white', outline: 'none' }}
                       />
                       <button 
                         onClick={geocodeObjectiveAddress}
                         style={{ padding: '0 15px', borderRadius: '12px', background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.3)', color: '#00d2ff', cursor: 'pointer' }}
                         title="Localizar en Mapa"
                       >
                         {isSaving ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                       </button>
                     </div>
                   </div>

                   <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '15px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                     <div style={{ display: 'flex', gap: '10px', color: '#f59e0b' }}>
                       <AlertCircle size={18} />
                       <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Nota:</span>
                     </div>
                     <p style={{ margin: '8px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>
                       Debe localizar la dirección en el mapa (botón Lupa) antes de poder guardar el nuevo objetivo.
                     </p>
                   </div>
                 </div>

                 <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                   <button 
                     onClick={async () => {
                       await handleSaveObjective();
                       if (!newObjective.nombre && !newObjectiveCoords) {
                         // No cerramos si falló validación
                       } else {
                         setShowNewObjectiveModal(false);
                       }
                     }}
                     disabled={isSaving || !newObjectiveCoords}
                     style={{ flex: 1, background: !newObjectiveCoords ? 'rgba(255,255,255,0.1)' : '#3b82f6', color: 'white', border: 'none', padding: '15px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                   >
                     {isSaving ? <Loader2 size={18} className="spin" /> : 'GUARDAR'}
                   </button>
                   <button 
                     onClick={() => setShowNewObjectiveModal(false)}
                     style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}
                   >
                     CANCELAR
                   </button>
                 </div>
               </div>

               {/* Right Side: Map */}
               <div style={{ flex: 1, position: 'relative', background: '#0f172a' }}>
                 <MapContainer
                   center={[-34.6037, -58.3816]}
                   zoom={13}
                   style={{ height: '100%', width: '100%' }}
                   zoomControl={false}
                 >
                   <TileLayer
                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                   />
                   {newObjectiveCoords && (
                     <>
                        <Marker position={[newObjectiveCoords.lat, newObjectiveCoords.lng]}>
                          <Popup><div style={{ color: 'black' }}>Ubicación para: {newObjective.nombre}</div></Popup>
                        </Marker>
                        <RecenterMap pos={[newObjectiveCoords.lat, newObjectiveCoords.lng]} />
                     </>
                   )}
                 </MapContainer>
                 <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000 }}>
                    <div style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', padding: '8px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>
                       VISTA TÁCTICA DEL PUESTO
                    </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* NOTIFICACIONES TOAST */}
      {toast.show && (
        <div style={{
          position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)' : 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
          backdropFilter: 'blur(10px)', color: 'white', padding: '18px 35px',
          borderRadius: '20px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: '15px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)',
          minWidth: '350px', animation: 'fadeInUp 0.4s ease-out'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '12px' }}>
            {toast.type === 'error' ? <AlertCircle size={22} /> : <CheckCircle size={22} />}
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {toast.type === 'error' ? 'Error del Sistema' : 'Operación Exitosa'}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '900' }}>{toast.message}</div>
          </div>
        </div>
      )}

      {/* CSS ADICIONAL PARA TOAST */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .staff-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          background: linear-gradient(145deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,1) 100%) !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
        .staff-card:hover .arrow-indicator {
          opacity: 1 !important;
          transform: translateY(-50%) translateX(0) !important;
        }
      `}</style>
    </div>
  );
};


// ============================================================
// BILLING PANEL - REDISEÑO B2B PREMIUM
// ============================================================
const BillingPanel = ({ companyData, showToast, refreshData, currentPlanInfo }) => {
  const { user } = useAuth();
  const [billingConfig, setBillingConfig] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null); // 'transfer' | 'mp'
  const [voucher, setVoucher] = useState(null);
  const [opNumber, setOpNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const loadBillingData = async () => {
      const config = await db.obtenerConfiguracionPagos();
      setBillingConfig(config);
      const payHistory = await db.obtenerHistorialPagos(companyData?.id || companyData?.uid);
      setHistory(payHistory);
    };
    loadBillingData();
  }, [companyData]);

  const handleDownloadReceipt = (p) => {
    const printWindow = window.open('', '_blank');
    const planName = PLANES[p.planId?.toUpperCase()]?.nombre || p.planId;
    
    // Datos del Emisor (Centinela) desde Configuración
    const emisorNombre = billingConfig?.bank_holder || 'CENTINELA Seguridad Inteligente';
    const emisorCuit = billingConfig?.cuit || '30-71825412-4';
    const emisorDireccion = billingConfig?.direccion_fiscal || 'Av. Corrientes 1250, CABA';
    
    // Configuración Fiscal Dinámica
    const esExportacion = companyData?.pais && companyData.pais !== 'Argentina';
    const tipoFactura = esExportacion ? 'E' : (companyData?.condicionIva === 'Responsable Inscripto' ? 'A' : 'C');
    const denominacion = `FACTURA ${tipoFactura}`;
    const puntoVenta = billingConfig?.punto_venta || "0005";
    const nroComprobante = p.id?.substring(0,8).toUpperCase() || "00000001";
    
    // Simulación de tipo de cambio (Se puede extraer de API en prod)
    const tipoCambio = 1050.45; 
    const montoARS = (p.monto * tipoCambio).toLocaleString('es-AR', {minimumFractionDigits: 2});
    
    // Lógica avanzada de Cliente (Forzado a Responsable Inscripto por req)
    const condicionIvaFinal = 'Responsable Inscripto';
    const cuitFinal = companyData?.dni || 'CUIT NO REGISTRADO';
    const nombreFinal = companyData?.nombre || user?.company || 'STARK INDUSTRIES';
    const direccionFinal = companyData?.address || 'Domicilio no registrado';
    const representanteFinal = companyData?.responsable || companyData?.titular || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>${denominacion} - ${nroComprobante}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; }
            
            /* AFIP Layout Structure */
            .main-border { border: 2px solid #000; padding: 0; min-height: 900px; position: relative; }
            
            /* Top Header Block */
            .header-top { display: grid; grid-template-columns: 1fr 120px 1fr; border-bottom: 2px solid #000; min-height: 190px; }
            
            .issuer-info { padding: 20px; font-size: 11px; line-height: 1.4; }
            .issuer-name { font-size: 20px; font-weight: 900; color: #3b82f6; margin-bottom: 5px; }
            
            .center-box { border-left: 2px solid #000; border-right: 2px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 15px; background: white; height: 100%; box-sizing: border-box; }
            .letter { font-size: 45px; font-weight: 900; border: 2px solid #000; width: 65px; height: 65px; display: flex; align-items: center; justify-content: center; background: white; margin-bottom: 5px; }
            .cod-comprobante { font-size: 9px; font-weight: bold; text-align: center; }

            .receipt-info { padding: 20px; text-align: left; line-height: 1.4; }
            .receipt-type { font-size: 18px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase; }
            
            /* Client Block */
            .client-block { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 2px solid #000; padding: 15px 20px; font-size: 12px; gap: 20px; }
            .label { font-weight: 900; color: #64748b; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
            
            /* Items Table */
            .items-table { width: 100%; border-collapse: collapse; margin-top: -1px; }
            .items-table th { border: 2px solid #000; background: #f1f5f9; padding: 10px; font-size: 10px; text-transform: uppercase; text-align: left; }
            .items-table td { border-left: 2px solid #000; border-right: 2px solid #000; padding: 15px 10px; font-size: 13px; }
            .last-row td { border-bottom: 2px solid #000; }

            /* Totals Section */
            .totals-section { display: grid; grid-template-columns: 1fr 280px; }
            .currency-note { padding: 20px; font-size: 11px; font-style: italic; color: #64748b; border-top: 2px solid #000; }
            .totals-box { border-left: 2px solid #000; border-top: 2px solid #000; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 20px; font-size: 12px; border-bottom: 1px solid #e2e8f0; }
            .ars-total { background: #f1f5f9; font-weight: 900; font-size: 18px; border-bottom: none; display: flex; flex-direction: column; align-items: flex-end; }

            /* Fiscal Footer */
            .fiscal-footer { position: absolute; bottom: 0; width: 100%; border-top: 2px solid #000; padding: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; box-sizing: border-box; }
            .cae-box { text-align: right; line-height: 1.6; }
            .non-fiscal-warning { color: #ef4444; font-weight: 900; text-transform: uppercase; font-size: 11px; display: block; margin-top: 10px; }
            
            @media print {
              body { padding: 0; }
              .main-border { border: 2px solid #000; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <div class="main-border">
            <!-- Header -->
            <div class="header-top">
              <div class="issuer-info">
                <div class="issuer-name">${billingConfig?.brand_name || 'CENTINELA'}</div>
                <div><b>${emisorNombre}</b></div>
                <div>${emisorDireccion}</div>
                <div style="margin-top: 10px"><b>Condición IVA:</b> ${billingConfig?.condicion_iva || 'Responsable Inscripto'}</div>
              </div>
              
              <div class="center-box">
                <div class="letter">${tipoFactura}</div>
                <div class="cod-comprobante">Cód. ${esExportacion ? '19' : (tipoFactura === 'A' ? '01' : '11')}</div>
              </div>
              
              <div class="receipt-info">
                <div class="receipt-type">${denominacion}</div>
                <div><b>Comp. Nro:</b> ${nroComprobante}</div>
                <div><b>Fecha de Emisión:</b> ${p.fecha && !isNaN(new Date(p.fecha).getTime()) ? new Date(p.fecha).toLocaleDateString() : 'Pendiente'}</div>
                <div style="margin-top: 15px"><b>CUIT:</b> ${emisorCuit}</div>
                <div><b>Ingresos Brutos:</b> ${billingConfig?.ingresos_brutos || 'Exento'}</div>
                <div><b>Inicio de Actividades:</b> ${billingConfig?.inicio_actividades || '01/01/2024'}</div>
              </div>
            </div>

            <!-- Client Info -->
            <div class="client-block">
               <div>
                  <div class="label">Receptor / Cliente</div>
                  <div style="font-size: 14px; font-weight: 900">${nombreFinal}</div>
                  <div style="margin-top: 5px"><b>Dirección:</b> ${direccionFinal}</div>
                  <div><b>Atención:</b> ${representanteFinal}</div>
                  <div><b>País:</b> ${companyData?.pais || 'Argentina'}</div>
               </div>
               <div>
                  <div class="label">Información Fiscal</div>
                  <div><b>CUIT/DNI:</b> ${cuitFinal}</div>
                  <div><b>Condición IVA:</b> ${condicionIvaFinal}</div>
                  <div><b>Condición Venta:</b> Contado / Digital</div>
               </div>
            </div>

            <!-- Items -->
            <table class="items-table">
               <thead>
                  <tr>
                     <th style="width: 10%">Código</th>
                     <th style="width: 50%">Descripción / Concepto</th>
                     <th style="width: 10%; text-align: center">Cant.</th>
                     <th style="width: 15%; text-align: right">U. Medida</th>
                     <th style="width: 15%; text-align: right">Precio Unit.</th>
                  </tr>
               </thead>
               <tbody>
                  <tr style="height: 400px; vertical-align: top">
                     <td>SEC-002</td>
                     <td>
                        <div style="font-weight: 900">Licencia SaaS Centinela 2.0 - ${planName}</div>
                        <div style="font-size: 11px; margin-top: 5px; color: #475569">
                           Servicios de monitoreo activo, gestión de objetivos terrestres, telemetría de dispositivos 
                           y reporte dinámico para seguridad privada. Periodo: ${new Date().toLocaleDateString('es-ES', {month: 'long', year: 'numeric'})}
                        </div>
                     </td>
                     <td style="text-align: center">1.00</td>
                     <td style="text-align: right">unidades</td>
                     <td style="text-align: right; font-weight: 700">$ ${p.monto}</td>
                  </tr>
                  <tr class="last-row">
                     <td></td><td></td><td></td><td></td><td></td>
                  </tr>
               </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-section">
               <div class="currency-note">
                  <div><b>Cotización de Moneda Extranjera:</b> 1 USD = ${tipoCambio} ARS</div>
                  <div style="margin-top: 10px; font-size: 9px; text-transform: uppercase; color: #000">
                     ${esExportacion ? 'Operación exenta de IVA según normativa de exportación de servicios.' : 'Importe Neto no gravado / Responsable Monotributo.'}
                  </div>
               </div>
               <div class="totals-box">
                  <div class="total-row">
                     <span>Subtotal:</span>
                     <span>USD ${p.monto}</span>
                  </div>
                  <div class="total-row ars-total">
                     <div style="font-size: 10px; font-weight: 400; color: #64748b">TOTAL A PAGAR:</div>
                     <div>$ ${montoARS} ARS</div>
                     <div style="font-size: 11px; font-weight: 400; color: #64748b; margin-top: 4px;">Equivalente: USD ${p.monto}</div>
                  </div>
               </div>
            </div>

            <!-- Footer Fiscal -->
            <div class="fiscal-footer">
               <div>
                  <div><b>Pág. 1 de 1</b></div>
                  <div class="non-fiscal-warning">DOCUMENTO NO VÁLIDO COMO FACTURA FISCAL</div>
                  <div style="font-size: 9px; color: #64748b">Generado por Centinela Financial Engine 2.0</div>
               </div>
               <div class="cae-box">
                  <div><b>CAE:</b> ------------------------</div>
                  <div><b>Vto. CAE:</b> --/--/----</div>
               </div>
            </div>
          </div>

          <div style="margin-top: 20px; text-align: center; font-size: 11px; color: #1e293b; font-weight: bold;">
             Este documento es un comprobante de pago pro-forma hasta su fiscalización electrónica.
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

  const handleUploadVoucher = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("El archivo es demasiado grande (máx 5MB)", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setVoucher(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmTransfer = async () => {
    if (!selectedPlan) {
      showToast("Por favor selecciona un plan primero", "error");
      return;
    }
    if (!voucher) {
      showToast("Debes adjuntar el comprobante de la transferencia", "error");
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        empresaId: companyData?.id || companyData?.uid,
        planId: selectedPlan.id,
        monto: selectedPlan.precio,
        metodo: 'Transferencia Bancaria',
        comprobante: voucher,
        estado: 'pending',
        fecha: new Date().toISOString(),
        numero_operacion: opNumber
      };
      
      await db.registrarPago(paymentData);
      
      showToast("✅ ¡Comprobante enviado con éxito! El equipo de Centinela validará el pago y activará tu licencia en las próximas horas.");
      
      // Limpiar estados
      setVoucher(null);
      setOpNumber('');
      setPaymentMethod(null);
      setSelectedPlan(null);
      
      // Recargar historial
      const payHistory = await db.obtenerHistorialPagos(companyData?.id || companyData?.uid);
      setHistory(payHistory);
    } catch (error) {
      console.error(error);
      showToast("Error al procesar el envío del pago", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMP = async () => {
    if (!selectedPlan) {
      showToast("Por favor selecciona un plan para continuar", "error");
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        empresaId: companyData?.id || companyData?.uid,
        planId: selectedPlan.id,
        monto: selectedPlan.precio,
        metodo: 'Mercado Pago',
        estado: 'pending', // Se activa automáticamente vía Webhook/IPN en producción
        fecha: new Date().toISOString()
      };
      
      await db.registrarPago(paymentData);
      
      showToast("Redirigiendo a Checkout de Mercado Pago...");
      
      // Simulación de redirección / integración futura SDK
      setTimeout(() => {
        showToast("Simulación: Pago en proceso vía Checkout Pro. Próximamente integración con SDK real.");
        setLoading(false);
        setPaymentMethod(null);
        setSelectedPlan(null);
        
        // Recargar historial
        db.obtenerHistorialPagos(companyData?.id || companyData?.uid).then(setHistory);
      }, 2000);
      
    } catch (error) {
      console.error(error);
      showToast("Error al inicializar pago online", "error");
      setLoading(false);
    }
  };

  const isExpired = companyData?.expiryDate ? (new Date(companyData.expiryDate) < new Date().setHours(0,0,0,0)) : false;
  const daysLeft = (() => {
    if (!companyData?.expiryDate) return 0;
    const expiry = new Date(companyData.expiryDate);
    if (isNaN(expiry.getTime())) return 0;
    const diff = expiry - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  return (
    <div className="fade-in" style={{ color: 'white' }}>
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '10px' }}>Gestión de Licencia</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>Administra tu plan, pagos y estado del servicio profesional.</p>
      </div>

      {/* ESTADO ACTUAL */}
      <div className="glass" style={{ 
        padding: '30px', 
        marginBottom: '40px', 
        borderRadius: '32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(30,41,59,0.4) 0%, rgba(15,23,42,0.8) 100%)',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '20px', 
            background: currentPlanInfo.color + '22', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', color: currentPlanInfo.color,
            boxShadow: `0 0 30px ${currentPlanInfo.color}11`
          }}>
            <Shield size={40} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0 }}>{currentPlanInfo.nombre}</h3>
              <span style={{ 
                padding: '6px 15px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '900',
                background: isExpired ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: isExpired ? '#ef4444' : '#10b981',
                border: `1px solid ${isExpired ? '#ef444433' : '#10b98133'}`
              }}>
                {isExpired ? 'LICENCIA VENCIDA' : 'SERVICIO ACTIVO'}
              </span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', display: 'flex', gap: '20px' }}>
              <span>Vencimiento: <b style={{ color: 'white' }}>{companyData?.expiryDate || 'N/A'}</b></span>
              <span>Días restantes: <b style={{ color: isExpired ? '#ef4444' : '#00d2ff' }}>{daysLeft}</b></span>
            </div>
          </div>
        </div>
        {!selectedPlan && (
          <button 
            onClick={async () => {
              const el = document.getElementById('pricing-plans');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="primary" 
            style={{ padding: '15px 30px', borderRadius: '15px', fontSize: '0.9rem' }}
          >
            Renovar / Actualizar Licencia
          </button>
        )}
      </div>

      {/* PLANES DISPONIBLES */}
      <div id="pricing-plans" style={{ marginBottom: '50px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '25px', color: '#94a3b8' }}>PLANES DISPONIBLES</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
          {Object.values(PLANES).filter(p => p.id !== 'demo' && p.id !== 'DEMO').map(plan => (
            <div 
              key={plan.id}
              className="glass" 
              style={{ 
                padding: '30px', 
                borderRadius: '28px', 
                border: selectedPlan?.id === plan.id ? `2px solid ${plan.color}` : '1px solid rgba(255,255,255,0.05)',
                background: selectedPlan?.id === plan.id ? `${plan.color}08` : 'rgba(30,41,59,0.2)',
                transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={() => setSelectedPlan(plan)}
            >
              <h4 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '8px', color: plan.color }}>{plan.nombre}</h4>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '20px' }}>
                ${plan.precio} <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.3)', fontWeight: 'normal' }}>/ mes</span>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 30px 0', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  <CheckCircle size={16} color={plan.color} /> Hasta {plan.limite_guardias} Guardias
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  <CheckCircle size={16} color={plan.color} /> Soporte {plan.id === 'enterprise' ? 'Prioritario 24/7' : 'Personalizado'}
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                  <CheckCircle size={16} color={plan.color} /> Historial {plan.historial_dias} días
                </li>
              </ul>

              <div style={{ 
                width: '100%', height: '50px', borderRadius: '12px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: selectedPlan?.id === plan.id ? plan.color : 'rgba(255,255,255,0.05)',
                color: selectedPlan?.id === plan.id ? 'white' : 'rgba(255,255,255,0.4)',
                fontWeight: '900', transition: '0.3s'
              }}>
                {selectedPlan?.id === plan.id ? 'ELEGIDO' : 'SELECCIONAR'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MÉTODO DE PAGO */}
      {selectedPlan && (
        <div className="fade-up" style={{ marginBottom: '60px' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '25px', color: '#94a3b8' }}>MÉTODO DE PAGO</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
            {/* Transferencia */}
            <div 
              className="glass" 
              onClick={() => setPaymentMethod('transfer')}
              style={{ 
                padding: '25px', borderRadius: '22px', cursor: 'pointer',
                border: paymentMethod === 'transfer' ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.05)',
                background: paymentMethod === 'transfer' ? 'rgba(245, 158, 11, 0.05)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Transferencia Bancaria</h4>
                  <p style={{ margin: '3px 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>USD - Activación en {'<'} 24hs</p>
                </div>
              </div>
            </div>

            {/* Mercado Pago */}
            <div 
              className="glass" 
              onClick={() => setPaymentMethod('mp')}
              style={{ 
                padding: '25px', borderRadius: '22px', cursor: 'pointer',
                border: paymentMethod === 'mp' ? '2px solid #00d2ff' : '1px solid rgba(255,255,255,0.05)',
                background: paymentMethod === 'mp' ? 'rgba(0, 210, 255, 0.05)' : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Mercado Pago</h4>
                  <p style={{ margin: '3px 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Tarjetas - Activación instantánea</p>
                </div>
              </div>
            </div>
          </div>

          {/* DETALLES TRANSFERENCIA */}
          {paymentMethod === 'transfer' && (
            <div className="glass fade-up" style={{ marginTop: '25px', padding: '35px', borderRadius: '28px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                <div>
                  <h4 style={{ color: '#f59e0b', fontSize: '1rem', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Datos para la Transferencia</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Banco:</span>
                      <span style={{ fontWeight: 'bold' }}>{billingConfig?.bank_name || 'Santander'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Titular:</span>
                      <span style={{ fontWeight: 'bold' }}>{billingConfig?.bank_holder || 'Centinela S.A.'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Cuenta USD:</span>
                      <span style={{ fontWeight: 'bold' }}>{billingConfig?.bank_account_usd || 'Contactar Soporte'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>CBU / Alias:</span>
                      <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>{billingConfig?.bank_cbu_alias || 'centinela.seguridad.usd'}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h4 style={{ color: '#f59e0b', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Cargar Comprobante</h4>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>NÚMERO DE OPERACIÓN (OPCIONAL)</label>
                    <input 
                      type="text" 
                      value={opNumber}
                      onChange={e => setOpNumber(e.target.value)}
                      placeholder="Ej: 123456789"
                      style={{ 
                        width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white' 
                      }}
                    />
                  </div>
                  <div 
                    onClick={() => document.getElementById('voucher-upload').click()}
                    style={{ 
                      flex: 1, border: '2px dashed rgba(245, 158, 11, 0.2)', borderRadius: '20px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', background: voucher ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255,255,255,0.02)',
                      padding: '20px', gap: '10px', textAlign: 'center', transition: '0.3s'
                    }}
                  >
                    {voucher ? (
                      <>
                        <CheckCircle size={32} color="#10b981" />
                        <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '0.9rem' }}>Comprobante Listo</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>Click para cambiar archivo</span>
                      </>
                    ) : (
                      <>
                        <Upload size={32} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: '0.9rem' }}>Adjuntar Comprobante (JPG, PNG, PDF)</span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>Requerido para validación manual</span>
                      </>
                    )}
                    <input type="file" id="voucher-upload" hidden onChange={handleUploadVoucher} accept="image/*,.pdf" />
                  </div>
                  <button 
                    onClick={handleConfirmTransfer}
                    disabled={loading || !voucher}
                    className="primary" 
                    style={{ padding: '14px', background: '#f59e0b', border: 'none', color: 'white', fontWeight: '900' }}
                  >
                    {loading ? <Loader2 size={24} className="animate-spin" /> : 'CONFIRMAR Y ENVIAR'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'mp' && (
            <div className="glass fade-up" style={{ marginTop: '25px', padding: '35px', borderRadius: '28px', textAlign: 'center', border: '1px solid rgba(0, 210, 255, 0.2)' }}>
              <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                <h4 style={{ color: '#00d2ff', fontSize: '1.2rem', marginBottom: '10px' }}>Pagar con Mercado Pago</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '25px' }}>Procesamiento seguro y activación automática de tu suscripción.</p>
                <button 
                  onClick={handleConfirmMP}
                  disabled={loading}
                  className="primary" 
                  style={{ width: '100%', padding: '18px', fontSize: '1rem', background: '#00d2ff', border: 'none' }}
                >
                  {loading ? <Loader2 size={24} className="animate-spin" /> : `Pagar $${selectedPlan.precio} USD`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORIAL */}
      <div style={{ marginTop: '40px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '25px', color: '#94a3b8' }}>ÚLTIMOS PAGOS</h3>
        <div className="glass" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>
                <th style={{ padding: '20px' }}>Fecha</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Referencia de Pago</th>
                <th>Estado</th>
                <th style={{ padding: '20px', textAlign: 'right' }}>Documento</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(history) && history.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '20px', fontSize: '0.85rem' }}>
                    {p.fecha && !isNaN(new Date(p.fecha).getTime()) 
                      ? new Date(p.fecha).toLocaleDateString() 
                      : 'Pendiente'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Suscripción {PLANES[p.planId?.toUpperCase()]?.nombre || p.planId}</div>
                  </td>
                  <td><b style={{ color: '#10b981' }}>${p.monto} USD</b></td>
                  <td style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>{p.metodo}</td>
                  <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    {p.metodo === 'Mercado Pago' ? (p.mp_payment_id || 'ID Pendiente') : (p.numero_operacion || 'Transferencia Doc.')}
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '900',
                      background: p.estado === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: p.estado === 'approved' ? '#10b981' : '#f59e0b',
                      border: `1px solid ${p.estado === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                    }}>
                      {p.estado === 'approved' ? 'APROBADO' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleDownloadReceipt(p)}
                      className="secondary" 
                      style={{ padding: '6px 14px', fontSize: '0.75rem', borderRadius: '10px', fontWeight: 'bold' }}
                    >
                      <Download size={14} style={{ marginRight: '6px' }} /> Descargar PDF
                    </button>
                  </td>
                </tr>
              ))}
              {(!history || history.length === 0) && (
                <tr>
                  <td colSpan="7" style={{ padding: '50px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>
                    No se registran transacciones previas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  input: {
    width: '100%',
    borderRadius: '12px',
    padding: '15px',
    background: '#0f172a',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white'
  },
  filterSelect: {
    flex: 1,
    padding: '12px',
    background: '#0f172a',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'white'
  },
  modalOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(2,6,23,0.85)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease-out'
  },
  modalLabel: {
    fontSize: '0.75rem',
    opacity: 0.5,
    display: 'block',
    marginBottom: '8px',
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  }
};

export default CompanyDashboard;
