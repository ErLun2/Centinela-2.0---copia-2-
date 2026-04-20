import React, { useState, useEffect } from 'react';
import {
  Paperclip, Filter, Clock, Tag, Briefcase, 
  Shield, Users, Building2, MessageSquare, Wrench,
  Settings, Search, Plus, MapPin, Key, Trash2, 
  CheckCircle2, AlertCircle, TrendingUp, RefreshCcw, 
  Edit3, Radio, HelpCircle, Layout, LayoutPanelLeft,
  ChevronRight, ArrowLeft, Zap, Activity, Wifi,
  Battery, Smartphone, Code, LogOut, KeyRound, X,
  Send, Loader2, QrCode, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as db from '../lib/dbServices';

const SupportDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Ticketing');
  const [tickets, setTickets] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [quickReply, setQuickReply] = useState('');

  // Diagnostic & Actions State
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState([]);
  const [diagnosticSummary, setDiagnosticSummary] = useState(null);
  const [activeAction, setActiveAction] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [automationAlerts, setAutomationAlerts] = useState([]);

  // Multi-target State
  const [targetScope, setTargetScope] = useState('single'); // 'single' or 'all'
  const [targetUserId, setTargetUserId] = useState(null);

  // Manual Repairs State
  const [showButtonEditor, setShowButtonEditor] = useState(false);
  const [selectedRepairCompany, setSelectedRepairCompany] = useState(null);
  const [tempUIConfig, setTempUIConfig] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const handleRunDiagnostic = async (ticket) => {
    setIsRunningDiagnostic(true);
    
    // Aggregating data based on scope
    const userId = targetUserId || ticket.usuarioId || 'U-772';
    
    if (targetScope === 'all') {
       // Global check simulation
       const companyUsers = users.filter(u => u.empresaId === ticket.empresaId);
       const summary = {
         score: 'warning',
         summary: [`Analizando flota de ${companyUsers.length} dispositivos...`, "Se detectaron latencias altas en 3 terminales."]
       };
       setTimeout(() => {
         setDiagnosticSummary(summary);
         setIsRunningDiagnostic(false);
       }, 1500);
       return;
    }

    const userDiag = await db.obtenerDiagnosticoUsuario(userId);
    const deviceDiag = await db.obtenerDiagnosticoDispositivo(userId);
    const gpsDiag = await db.obtenerDiagnosticoGPS(userId);
    const logs = await db.obtenerLogsSistema(ticket.id);
    const summary = await db.ejecutarDiagnosticoAutomatico(userId, ticket);
    
    setTimeout(async () => {
      setDiagnosticData({
        user: userDiag,
        device: deviceDiag,
        gps: gpsDiag
      });
      setDiagnosticLogs(logs);
      setDiagnosticSummary(summary);
      
      // FETCH INTELLIGENT SUGGESTIONS
      const smartSuggest = await db.obtenerSugerenciasInteligentes(ticket.id, userId);
      setSuggestions(smartSuggest);
      
      setIsRunningDiagnostic(false);
    }, 1500);
  };

  const handleExecuteAction = async (actionType, actionLabel) => {
    const scopeLabel = targetScope === 'all' ? 'TODA LA EMPRESA' : (users.find(u => u.id === targetUserId || u.uid === targetUserId)?.nombre || 'Usuario Seleccionado');
    if (!window.confirm(`¿Estás seguro de que deseas ejecutar: ${actionLabel} para [${scopeLabel}]?`)) return;
    
    const result = await db.ejecutarAccionSoporte(actionType, targetUserId || selectedTicket.usuarioId || 'U-772', selectedTicket.id);
    
    if (result.success) {
      loadData();
      const allTickets = JSON.parse(localStorage.getItem('centinela_tickets') || '[]');
      const updated = allTickets.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
      
      // AUTO-REFRESH DIAGNOSTIC TO SEE CHANGES
      await handleRunDiagnostic(selectedTicket);
      
      alert(`✅ Acción '${actionLabel}' ejecutada en ${scopeLabel}.`);
    }
  };

  const handleChangeStatus = (e) => {
     if (!selectedTicket) return;
     const newStatus = e.target.value;
     const updatedTicket = { ...selectedTicket, status: newStatus };
     const allTickets = tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t);
     localStorage.setItem('centinela_tickets', JSON.stringify(allTickets));
     setTickets(allTickets);
     setSelectedTicket(updatedTicket);
  };

  const handleUpdateTicketMeta = (field, value) => {
     if (!selectedTicket) return;
     const updatedTicket = { ...selectedTicket, [field]: value };
     const allTickets = tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t);
     localStorage.setItem('centinela_tickets', JSON.stringify(allTickets));
     setTickets(allTickets);
     setSelectedTicket(updatedTicket);
  };

  const handleAdvancedReply = () => {
     if (!replyText.trim() || !selectedTicket) return;
     const autorObj = isInternalNote ? 'NOTA INTERNA' : 'SOPORTE';
     const updatedTicket = { 
       ...selectedTicket, 
       respuestas: [...(selectedTicket.respuestas || []), { autor: autorObj, texto: replyText, fecha: new Date().toISOString() }],
       status: (selectedTicket.status === 'Nuevo' && !isInternalNote) ? 'En proceso' : selectedTicket.status
     };
     const allTickets = tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t);
     localStorage.setItem('centinela_tickets', JSON.stringify(allTickets));
     setTickets(allTickets);
     setSelectedTicket(updatedTicket);
     setReplyText("");
     setIsInternalNote(false);
     setQuickReply('');
     
     if (!isInternalNote) {
       console.log(`%c[EMAIL SIMULATION] Avisando a cliente de actualización en Ticket #${selectedTicket.id}`, 'color:#10b981');
     } else {
       console.log(`%c[STAFF NOTIFICATION] Nota interna añadida a Ticket #${selectedTicket.id}`, 'color:#f59e0b');
     }
  };

  const handleOpenButtonEditor = (company) => {
    setSelectedRepairCompany(company);
    setTempUIConfig(company.customUI || {
      showGPS: true,
      showQR: true,
      showBilling: true,
      showConfig: true,
      showPanic: true
    });
    setShowButtonEditor(true);
  };

  const handleApplyUIRepair = () => {
    const updated = companies.map(c => {
      if (c.id === selectedRepairCompany.id) {
        return { ...c, customUI: tempUIConfig };
      }
      return c;
    });
    localStorage.setItem('centinela_companies', JSON.stringify(updated));
    setCompanies(updated);
    setShowButtonEditor(false);
    alert(`✅ Interfaz de '${selectedRepairCompany.name}' actualizada correctamente.`);
  };

  const loadData = () => {
    setIsLoading(true);
    
    // Check and pre-fill companies if empty
    if (!localStorage.getItem('centinela_companies')) {
       const initial = [
        { id: '1', name: "Pepelui SA", status: "activa", plan: "enterprise", guards: 15, expiryDate: '2026-12-31' },
        { id: '2', name: "Security Force Ltd", status: "activa", plan: "enterprise", guards: 150, expiryDate: '2027-06-15' },
        { id: '3', name: "Vigilancia Plus", status: "pendiente", plan: "basic", guards: 10, expiryDate: '2026-05-20' }
       ];
       localStorage.setItem('centinela_companies', JSON.stringify(initial));
    }

    const savedTickets = JSON.parse(localStorage.getItem('centinela_tickets') || '[]');
    const savedCompanies = JSON.parse(localStorage.getItem('centinela_companies') || '[]');
    const savedUsers = JSON.parse(localStorage.getItem('centinela_users') || '[]');
    
    // REMOVE DEMO/MOCK PEOPLE ONLY
    const realUsers = savedUsers.filter(u => {
      const isMockId = ['U-001', 'U-002', 'U-003', 'U-004', 'U-010', 'U-770', 'U-771', 'U-772'].includes(u.id);
      const isDemoEmail = u.email?.includes('@empresa') || u.email?.includes('@demo.com');
      return !isMockId && !isDemoEmail;
    });

    setTickets(savedTickets);
    setCompanies(savedCompanies);
    setUsers(realUsers);
    
    // SCAN FOR MASS INCIDENTS
    const alerts = db.detectarIncidentesMasivos();
    setAutomationAlerts(alerts);
    
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Case 1: Ticketing (Solving issues)
  const renderTicketing = () => {
    const metrics = {
      open: tickets.filter(t => !['Cerrado', 'Resuelto'].includes(t.status)).length,
      closed: tickets.filter(t => ['Cerrado', 'Resuelto'].includes(t.status)).length,
      avgTime: "1.2 hrs"
    };

    if (selectedTicket) {
      const companyData = companies.find(c => c.id === selectedTicket.empresaId) || { name: selectedTicket.companyName || 'Desconocida', plan: 'Desconocido' };
      const companyHist = tickets.filter(t => t.empresaId === selectedTicket.empresaId);

      return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
           <div style={styles.headerRow}>
              <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                 <button onClick={() => setSelectedTicket(null)} style={styles.actionIconBtn}><ArrowLeft size={18} /></button>
                 <h2 style={{margin:0}}>Ticket {selectedTicket.id && `#${selectedTicket.id}`}</h2>
              </div>
           </div>
           
           <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 180px)' }}>
             {/* Left: Chat Pane */}
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <h3 style={{ margin: 0 }}>{selectedTicket.asunto}</h3>
                     <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>De: {companyData.name}</span>
                   </div>
                   <select value={selectedTicket.status || 'Nuevo'} onChange={handleChangeStatus} style={{background: 'rgba(0,0,0,0.4)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 15px', borderRadius: '10px', outline: 'none'}}>
                      <option value="Nuevo">NUEVO</option>
                      <option value="En proceso">EN PROCESO</option>
                      <option value="Esperando respuesta">ESPERANDO RESPUESTA</option>
                      <option value="Resuelto">RESUELTO</option>
                      <option value="Cerrado">CERRADO</option>
                   </select>
                </div>
                
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ alignSelf: 'flex-start', maxWidth: '80%', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px 20px 20px 0', border: '1px solid rgba(255,255,255,0.1)' }}>
                       <div style={{ fontSize: "0.8rem", color: "white", fontWeight: "bold", marginBottom: "8px" }}>SOLICITUD INICIAL</div>
                       <p style={{ fontSize: '0.90rem', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{selectedTicket.descripcion}</p>
                       <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '10px' }}>{new Date(selectedTicket.fecha).toLocaleString()}</div>
                    </div>

                    {(selectedTicket.respuestas || []).map((r, i) => {
                      const isSoporte = r.autor === 'SOPORTE';
                      const isInternal = r.autor === 'NOTA INTERNA';
                      const isLog = r.autor === 'LOG_SISTEMA';

                      let bgColor = 'rgba(255,255,255,0.05)';
                      let borderColor = 'rgba(255,255,255,0.1)';
                      let titleColor = 'white';
                      let align = 'flex-start';
                      let radius = '20px 20px 20px 0';
                      let authorName = 'EMPRESA';

                      if (isSoporte) {
                        bgColor = 'rgba(0,168,255,0.1)'; borderColor = 'rgba(0,168,255,0.2)'; titleColor = '#00a8ff'; align = 'flex-end'; radius = '20px 20px 0 20px'; authorName = 'SOPORTE (PÚBLICO)';
                      } else if (isInternal) {
                        bgColor = 'rgba(245, 158, 11, 0.1)'; borderColor = 'rgba(245, 158, 11, 0.2)'; titleColor = '#f59e0b'; align = 'flex-end'; radius = '20px 20px 0 20px'; authorName = 'SOPORTE (NOTA INTERNA)';
                      } else if (isLog) {
                        bgColor = 'rgba(16, 185, 129, 0.05)'; borderColor = 'rgba(16, 185, 129, 0.2)'; titleColor = '#10b981'; align = 'center'; radius = '10px'; authorName = '⚙️ SISTEMA (ACCIÓN OPERATIVA)';
                      }

                      return (
                        <div key={i} style={{ alignSelf: align, maxWidth: isLog ? '100%' : '80%', padding: '15px 20px', background: bgColor, borderRadius: radius, border: `1px solid ${borderColor}`, margin: isLog ? '10px 0' : '0' }}>
                           <div style={{ fontSize: '0.75rem', color: titleColor, fontWeight: 'bold', marginBottom: '8px' }}>{authorName}</div>
                           <p style={{ fontSize: '0.90rem', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{r.texto}</p>
                           <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '10px', textAlign: align==='flex-end'?'right':'left' }}>{new Date(r.fecha).toLocaleString()}</div>
                        </div>
                      );
                    })}

                    <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '30px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ margin: 0, color: '#00a8ff', display: 'flex', alignItems: 'center', gap: '10px' }}><Zap size={18} /> DIAGNÓSTICO Y RESOLUCIÓN</h4>
                          <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: '5px 0 0 0' }}>OBJETIVO: {targetScope === 'all' ? 'TODA LA EMPRESA' : 'GUARDIA ESPECÍFICO'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <select 
                            value={targetScope} 
                            onChange={e => { setTargetScope(e.target.value); if(e.target.value === 'all') setTargetUserId(null); }}
                            style={{ background: 'rgba(0,168,255,0.1)', color: '#00a8ff', border: '1px solid #00a8ff', padding: '5px 10px', borderRadius: '8px', fontSize: '0.75rem', outline: 'none' }}
                          >
                             <option value="single">Puntual (1 Usuario)</option>
                             <option value="all">Global (Toda la Empresa)</option>
                          </select>
                          <button 
                            onClick={() => handleRunDiagnostic(selectedTicket)}
                            disabled={isRunningDiagnostic}
                            style={{
                              padding: '8px 15px', background: 'rgba(0,168,255,0.1)', border: '1px solid #00a8ff',
                              borderRadius: '10px', color: '#00a8ff', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                          >
                            {isRunningDiagnostic ? <Loader2 className="animate-spin" size={14} /> : <Activity size={14} />} EJECUTAR ANÁLISIS
                          </button>
                        </div>
                      </div>

                      {targetScope === 'single' && (
                        <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                           <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>SELECCIONAR GUARDIA / OPERADOR AFECTADO:</label>
                           <select 
                             value={targetUserId || selectedTicket.usuarioId || ''} 
                             onChange={e => setTargetUserId(e.target.value)}
                             style={{ width: '100%', background: '#020617', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', borderRadius: '12px', outline: 'none', fontSize: '0.9rem', fontWeight: '500' }}
                           >
                             <option value={selectedTicket.usuarioId}>{selectedTicket.usuarioNombre || selectedTicket.usuarioEmail || 'Iniciador del Ticket'} (Iniciador)</option>
                             <optgroup label="SISTEMA: SELECCIONAR USUARIO AFECTADO" style={{ background: '#020617', color: '#94a3b8' }}>
                               {(() => {
                                 const uniqueNames = new Set();
                                 return [...users]
                                   .filter(u => (u.uid || u.id) !== selectedTicket.usuarioId) // EXCLUDE INITIATOR
                                   .filter(u => {
                                     const fullName = `${u.nombre || ''} ${u.apellido || ''}`.trim();
                                     if (uniqueNames.has(fullName)) return false;
                                     uniqueNames.add(fullName);
                                     return true;
                                   })
                                   .sort((a,b) => (a.nombre || '').localeCompare(b.nombre || ''))
                                   .map(u => {
                                     const isGeneric = ['Admin', 'Personal', 'Demo'].some(word => (u.nombre || '').includes(word));
                                     return (
                                       <option key={u.uid || u.id} value={u.uid || u.id} style={{ background: '#020617', color: 'white', padding: '10px' }}>
                                         {u.nombre} {u.apellido || ''} {isGeneric ? `(${u.email})` : ''} - [{u.empresaName || u.organizacion || 'Sistema'}]
                                       </option>
                                     );
                                   });
                               })()}
                             </optgroup>
                           </select>
                        </div>
                      )}

                      {diagnosticData ? (
                        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h5 style={{ margin: '0 0 15px 0', fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px' }}>RESUMEN DE DIAGNÓSTICO</h5>
                            {diagnosticSummary?.summary.map((s, idx) => (
                              <div key={idx} style={{ fontSize: '0.8rem', color: diagnosticSummary.score === 'ok' ? '#10b981' : '#f59e0b', marginBottom: '5px' }}>• {s}</div>
                            ))}
                            
                            <div style={{ marginTop: '20px', display: 'grid', gap: '10px' }}>
                               <DiagnosticItem label="Usuario" value={diagnosticData.user.status} color="#10b981" />
                               <DiagnosticItem label="App" value={diagnosticData.device.appVersion} />
                               <DiagnosticItem label="Señal GPS" value={diagnosticData.gps.signalLevel} />
                               <DiagnosticItem label="Batería" value={diagnosticData.gps.battery} />
                            </div>
                          </div>

                          <div style={{ padding: '20px', background: 'rgba(0,168,255,0.05)', borderRadius: '15px', border: '1px solid rgba(0,168,255,0.2)' }}>
                             <h5 style={{ margin: '0 0 15px 0', fontSize: '0.7rem', color: '#00a8ff', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={14}/> ASISTENTE INTELIGENTE</h5>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {suggestions.map(s => (
                                  <div key={s.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '4px', color: 'white' }}>{s.title}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>{s.desc}</div>
                                    <button 
                                      onClick={() => handleExecuteAction(s.action, s.title)}
                                      style={{ width: '100%', padding: '6px', background: '#00a8ff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                      EJECUTAR SUGERENCIA
                                    </button>
                                  </div>
                                ))}
                                {suggestions.length === 0 && <div style={{ fontSize: '0.7rem', opacity: 0.5, textAlign: 'center', padding: '10px' }}>Analizando logs para sugerencias...</div>}
                             </div>
                          </div>

                          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                             <h5 style={{ margin: '0 0 15px 0', fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '1px' }}>ACCIONES MANUALES</h5>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <ActionButton label="Reset" onClick={() => handleExecuteAction('reset_password', 'Resetear Contraseña')} icon={<KeyRound size={12}/>} primary />
                                <ActionButton label="Logout" onClick={() => handleExecuteAction('force_logout', 'Forzar Cose')} icon={<LogOut size={12}/>} color="#f59e0b" />
                                <ActionButton label="Sync" onClick={() => handleExecuteAction('force_sync', 'Forzar Sincronización')} icon={<Activity size={12}/>} />
                                <ActionButton label="Ping" onClick={() => handleExecuteAction('device_ping', 'Enviar Ping')} icon={<Wifi size={12}/>} />
                             </div>
                             <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '0.65rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                <b>Terminal Log:</b> {diagnosticLogs[0]?.message.substring(0, 30)}...
                             </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                          <AlertCircle size={30} style={{ opacity: 0.2, marginBottom: '10px' }} />
                          <p style={{ fontSize: '0.8rem', opacity: 0.5, margin: 0 }}>Ejecute el análisis técnico para visualizar datos en tiempo real del dispositivo.</p>
                        </div>
                      )}
                    </div>
                </div>

                <div style={{ padding: '20px', backgroundColor: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', alignItems: 'center' }}>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: isInternalNote ? '#f59e0b' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={isInternalNote} onChange={e => setIsInternalNote(e.target.checked)} style={{cursor:'pointer'}}/>
                          Modo Nota Interna (Oculto al cliente)
                       </label>
                       
                       <select 
                         value={quickReply} 
                         onChange={e => { setQuickReply(e.target.value); if(e.target.value) setReplyText(e.target.value); }} 
                         style={{ background: 'transparent', color: '#00a8ff', border: '1px solid rgba(0,168,255,0.3)', borderRadius: '6px', fontSize: '0.75rem', padding: '4px 8px', outline: 'none', cursor: 'pointer' }}
                       >
                         <option value="">+ Plantillas</option>
                         <option value="Hola, estamos revisando tu caso. Te contactaremos pronto.">Respuesta inicial</option>
                         <option value="El problema reportado ha sido solucionado. Por favor verifica.">Confirmar solución</option>
                         <option value="Requerimos más información técnica para avanzar. ¿Podrías proveer capturas de pantalla?">Solicitar info</option>
                       </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <textarea 
                        value={replyText} onChange={e => setReplyText(e.target.value)}
                        placeholder={isInternalNote ? "Escribir anotación interna..." : "Escribir respuesta al cliente..."}
                        style={{ flex: 1, padding: '15px', borderRadius: '15px', background: isInternalNote ? 'rgba(245, 158, 11, 0.05)' : 'rgba(0,0,0,0.4)', color: 'white', border: `1px solid ${isInternalNote ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.1)'}`, minHeight: '60px', resize: 'none' }}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdvancedReply(); } }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button onClick={() => alert("Simulando gestor de archivos...")} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><Paperclip size={16} /></button>
                        <button onClick={handleAdvancedReply} disabled={!replyText.trim()} style={{ padding: '10px', background: replyText.trim() ? '#00a8ff' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: 'white', cursor: replyText.trim() ? 'pointer' : 'not-allowed' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button>
                      </div>
                    </div>
                </div>
             </div>

             {/* Right: Meta Pane */}
             <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ margin: '0 0 15px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', display: 'flex', gap: '8px', alignItems:'center' }}><Briefcase size={14}/> INFO. EMPRESA</h4>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '5px' }}>{companyData.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#00a8ff', marginBottom: '15px' }}>PLAN {companyData.plan?.toUpperCase()}</div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Historial: {companyHist.length} tickets en sistema.</div>
               </div>

               <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ margin: '0 0 15px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', display: 'flex', gap: '8px', alignItems:'center' }}><Tag size={14}/> GESTIÓN</h4>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>Prioridad:</label>
                  <select value={selectedTicket.prioridad || 'Media'} onChange={e => handleUpdateTicketMeta('prioridad', e.target.value)} style={{width: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: '8px', marginBottom: '15px', outline: 'none'}}>
                     <option value="Alta">Alta (Crítica)</option>
                     <option value="Media">Media (Normal)</option>
                     <option value="Baja">Baja (Menor)</option>
                  </select>

                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>Asignado a:</label>
                  <select value={selectedTicket.agente || ''} onChange={e => handleUpdateTicketMeta('agente', e.target.value)} style={{width: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: '8px', outline: 'none'}}>
                     <option value="">Sin Asignar</option>
                     <option value="Soporte Nivel 1">Soporte Nivel 1</option>
                     <option value="Ingeniería">Ingeniería</option>
                     <option value={user.nombre}>{user.nombre} (Yo)</option>
                  </select>
               </div>
               
               {selectedTicket.rating && (
                 <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '5px' }}>CALIFICACIÓN EMPRESA</div>
                    <div style={{ fontSize: '1.5rem' }}>{'★'.repeat(selectedTicket.rating)}{'☆'.repeat(5 - selectedTicket.rating)}</div>
                 </div>
               )}
             </div>
           </div>
        </div>
      );
    }

    const filteredTickets = tickets.filter(t => filterStatus === 'Todos' || (t.status === filterStatus) || (filterStatus === 'Resuelto/Cerrado' && ['Resuelto','Cerrado'].includes(t.status)));

    return (
      <div className="fade-in">
          {/* Automation Alerts */}
          {automationAlerts.length > 0 && (
            <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: '12px', color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: '15px' }}>
               <AlertCircle size={20} />
               <div style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                 DETECTADO POSIBLE INCIDENTE MASIVO: {automationAlerts.map(a => a.categoria).join(', ')} ( {automationAlerts.map(a => a.count).join('+')} tickets recientes )
               </div>
            </div>
          )}

          <div style={styles.headerRow}>
             <h2>Mesa de Ayuda (Help Desk)</h2>
             <button style={styles.refreshBtn} onClick={loadData}><RefreshCcw size={16} /> ACTUALIZAR</button>
          </div>

         {/* Metrics Row */}
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div style={{ padding: '15px', background: 'rgba(0,168,255,0.1)', borderRadius: '12px', color: '#00a8ff' }}><AlertCircle size={24}/></div>
               <div><div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{metrics.open}</div><div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Tickets Abiertos</div></div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div style={{ padding: '15px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', color: '#10b981' }}><CheckCircle2 size={24}/></div>
               <div><div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{metrics.closed}</div><div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Tickets Cerrados</div></div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '15px' }}>
               <div style={{ padding: '15px', background: 'rgba(245,158,11,0.1)', borderRadius: '12px', color: '#f59e0b' }}><Clock size={24}/></div>
               <div><div style={{ fontSize: '1.5rem', fontWeight: '900' }}>{metrics.avgTime}</div><div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Tiempo de Respuesta</div></div>
            </div>
         </div>
         
         <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {['Todos', 'Nuevo', 'En proceso', 'Esperando respuesta', 'Resuelto/Cerrado'].map(f => (
               <button key={f} onClick={() => setFilterStatus(f)} style={{ padding: '8px 15px', background: filterStatus === f ? '#00a8ff' : 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '8px', border: filterStatus === f ? 'transparent' : '1px solid rgba(255,255,255,0.1)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.3s' }}>
                  {f.toUpperCase()}
               </button>
            ))}
         </div>

         <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead>
                 <tr style={{ background: 'rgba(0,0,0,0.4)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                   <th style={{ padding: '15px 20px' }}>ID / ASUNTO</th>
                   <th style={{ padding: '15px' }}>EMPRESA</th>
                   <th style={{ padding: '15px' }}>ESTADO</th>
                   <th style={{ padding: '15px' }}>PRIORIDAD</th>
                   <th style={{ padding: '15px' }}>ASIG.</th>
                   <th style={{ padding: '15px' }}>FECHA</th>
                 </tr>
               </thead>
               <tbody>
                  {filteredTickets.map((t, idx) => {
                     const statusColor = (t.status === 'Cerrado' || t.status === 'Resuelto') ? '#10b981' : (t.status === 'En proceso' ? '#00a8ff' : (t.status === 'Esperando respuesta' ? '#f59e0b' : '#ff4d4d'));
                     const prioColor = t.prioridad === 'Alta' ? '#ff4d4d' : (t.prioridad === 'Media' ? '#f59e0b' : '#10b981');
                     return (
                     <tr key={idx} onClick={() => setSelectedTicket(t)} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'background 0.2s', ':hover': {background:'rgba(255,255,255,0.02)'} }}>
                       <td style={{ padding: '15px 20px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>{t.id && `#${t.id}`}</div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{t.asunto}</div>
                       </td>
                       <td style={{ padding: '15px', fontSize: '0.85rem' }}>{t.empresaId || t.companyName || 'N/A'}</td>
                       <td style={{ padding: '15px' }}>
                          <span style={{ padding: '4px 10px', background: `${statusColor}20`, color: statusColor, borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', border: `1px solid ${statusColor}` }}>
                             {(t.status || 'Nuevo').toUpperCase()}
                          </span>
                       </td>
                       <td style={{ padding: '15px' }}>
                          <span style={{ fontSize: '0.8rem', color: prioColor, fontWeight: 'bold' }}>{t.prioridad || 'Media'}</span>
                       </td>
                       <td style={{ padding: '15px', fontSize: '0.8rem', opacity: 0.7 }}>{t.agente || 'Ninguno'}</td>
                       <td style={{ padding: '15px', fontSize: '0.8rem', opacity: 0.5 }}>{new Date(t.fecha).toLocaleDateString()}</td>
                     </tr>
                  )})}
                  {filteredTickets.length === 0 && (
                     <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>No hay tickets que coincidan con la vista.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    );
  };

  // Case 2: Repairs & Adjustments (Configuring company panels)
  const renderRepairs = () => (
    <div className="fade-in">
       <h2>Reparación y Ajustes de Paneles</h2>
       <p style={{color: 'rgba(255,255,255,0.5)', marginBottom: '30px'}}>Configuración técnica directa de módulos para clientes.</p>
       
       <div style={styles.repairList}>
          {companies.map(c => (
            <div key={c.id} style={styles.repairCard}>
               <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <Building2 color="#00a8ff" />
                  <div>
                    <h4 style={{margin: 0}}>{c.name}</h4>
                    <span style={{fontSize: '0.7rem', opacity: 0.5}}>PLAN: {c.plan?.toUpperCase()}</span>
                  </div>
               </div>
               <div style={styles.repairActions}>
                  <button onClick={() => handleOpenButtonEditor(c)} style={styles.actionIconBtn} title="Editar Botones/UI">
                     <LayoutPanelLeft size={18} />
                  </button>
                  <button onClick={() => alert("Mejorando precisión de rastreo para " + c.name)} style={styles.actionIconBtn} title="Mejorar Rastreo GPS">
                     <Radio size={18} />
                  </button>
                  <button onClick={() => alert("Reparando base de datos de " + c.name)} style={styles.actionIconBtn} title="Reparar Base de Datos">
                     <Wrench size={18} />
                  </button>
               </div>
            </div>
          ))}
       </div>

       {/* MODAL: EDITOR DE BOTONES (REPARACIONES) */}
       {showButtonEditor && (
         <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="fade-in" style={{ background: '#070c1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px', width: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                  <h3 style={{ margin: 0, color: '#00a8ff' }}>Editor Técnico de UI</h3>
                  <button onClick={() => setShowButtonEditor(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X /></button>
               </div>
               
               <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '25px' }}>
                 Forzar visibilidad de módulos para <b>{selectedRepairCompany?.name}</b> independientemente del plan asignado.
               </p>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
                  {[
                    { id: 'showGPS', label: 'Monitor de Rastreo GPS', icon: <MapPin size={16}/> },
                    { id: 'showQR', label: 'Sistema de Rondas QR', icon: <QrCode size={16}/> },
                    { id: 'showPanic', label: 'Gestión de Botón de Pánico', icon: <AlertCircle size={16}/> },
                    { id: 'showBilling', label: 'Módulo de Facturación', icon: <CreditCard size={16}/> },
                    { id: 'showConfig', label: 'Panel de Configuración', icon: <Settings size={16}/> }
                  ].map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
                          <span style={{ color: '#00a8ff' }}>{m.icon}</span>
                          {m.label}
                       </div>
                       <input 
                         type="checkbox" 
                         checked={tempUIConfig[m.id]} 
                         onChange={e => setTempUIConfig({ ...tempUIConfig, [m.id]: e.target.checked })}
                         style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                       />
                    </div>
                  ))}
               </div>

               <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => setShowButtonEditor(false)} style={styles.secondaryBtn}>CANCELAR</button>
                  <button onClick={handleApplyUIRepair} style={styles.primaryBtn}>APLICAR REPARACIÓN UI</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );

  const resetUserPassword = (userId) => {
    if (confirm("¿Estás seguro de que deseas blanquear la contraseña a 'password123'? El usuario deberá cambiarla al ingresar.")) {
      const allUsers = JSON.parse(localStorage.getItem('centinela_users') || '[]');
      const updated = allUsers.map(u => (u.id === userId || u.uid === userId) ? { ...u, password: 'password123', mustChangePassword: true } : u);
      localStorage.setItem('centinela_users', JSON.stringify(updated));
      setUsers(updated);
      alert("✅ Contraseña restablecida a 'password123' correctamente.");
    }
  };

  const renderUsers = () => (
    <div className="fade-in">
       <div style={styles.headerRow}>
          <h2>Gestión de Usuarios y Credenciales</h2>
          <div style={styles.searchBox}>
             <Search size={16} />
             <input type="text" placeholder="Buscar usuario..." style={styles.searchInput} />
          </div>
       </div>

       <table style={styles.table}>
          <thead>
             <tr>
                <th>USUARIO</th>
                <th>EMPRESA</th>
                <th>ROL</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
             </tr>
          </thead>
          <tbody>
             {users.map((u, idx) => (
               <tr key={idx}>
                  <td>{u.nombre || u.email}</td>
                  <td>{u.empresaId || 'Master'}</td>
                  <td><span style={styles.roleTag}>{u.rol}</span></td>
                  <td><span style={{color: '#2ecc71'}}>ACTIVO</span></td>
                  <td>
                     <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={() => resetUserPassword(u.id || u.uid)} style={styles.tableActionBtn} title="Resetear Pass">
                           <Key size={14} />
                        </button>
                        <button style={styles.tableActionBtn} title="Editar Perfil">
                           <Edit3 size={14} />
                        </button>
                     </div>
                  </td>
               </tr>
             ))}
          </tbody>
       </table>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
         <div style={styles.logoArea}>
            <Shield size={24} color="#00a8ff" />
            <span style={styles.logoText}>CENTINELA <span style={{color: '#00a8ff'}}>SOPORTE</span></span>
         </div>
         
         <nav style={styles.nav}>
            <NavItem active={activeTab === 'Ticketing'} icon={<MessageSquare size={20} />} label="Tickets" onClick={() => setActiveTab('Ticketing')} />
            <NavItem active={activeTab === 'Reparaciones'} icon={<Wrench size={20} />} label="Reparaciones" onClick={() => setActiveTab('Reparaciones')} />
            <NavItem active={activeTab === 'Usuarios'} icon={<Users size={20} />} label="Usuarios" onClick={() => setActiveTab('Usuarios')} />
            <NavItem active={activeTab === 'Rastreo'} icon={<Radio size={20} />} label="Rastreo GPS" onClick={() => setActiveTab('Rastreo')} />
            <NavItem active={activeTab === 'Automatizacion'} icon={<Zap size={20} />} label="Motor de Automatización" onClick={() => setActiveTab('Automatizacion')} />
            <NavItem active={activeTab === 'Configuración'} icon={<Settings size={20} />} label="Configuración" onClick={() => setActiveTab('Configuración')} />
         </nav>

         <div style={styles.sidebarFooter}>
            <div style={styles.userInfo}>
               <div style={styles.avatar}>{user?.nombre?.charAt(0) || 'S'}</div>
               <div style={{overflow: 'hidden'}}>
                  <div style={styles.userName}>{user?.nombre || 'Support Staff'}</div>
                  <div style={styles.userRole}>CENTINELA STAFF</div>
               </div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn}>
               <ArrowLeft size={16} /> CERRAR SESIÓN
            </button>
         </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
         {activeTab === 'Ticketing' && renderTicketing()}
         {activeTab === 'Reparaciones' && renderRepairs()}
         {activeTab === 'Usuarios' && renderUsers()}
         {activeTab === 'Rastreo' && (
           <div className="fade-in">
              <h2>Centro de Control de Rastreo</h2>
              <p style={{color: 'rgba(255,255,255,0.5)'}}>Monitor de precisión para la App de Guardias.</p>
              <div style={styles.emptyState}>
                 <MapPin size={48} style={{marginBottom: '20px', opacity: 0.2}} />
                 <p>Iniciando monitor de telemetría...</p>
                 <button style={styles.primaryBtn} onClick={() => alert("Optimizando señales...")}>OPTIMIZAR RASTREO GLOBAL</button>
              </div>
           </div>
         )}
          {activeTab === 'Automatizacion' && (
             <div className="fade-in">
                <div style={styles.headerRow}>
                   <h2>Motor de Automatización Inteligente</h2>
                   <div style={{ ...styles.badge, background: '#10b981', color: 'white' }}>MOTOR ACTIVO</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
                   <div style={styles.card}>
                      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>Reglas de Autogestión (IF/THEN)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                         {[
                           { if: "Categoria = 'QR' AND Error = 'PERMISO'", then: "Ejecutar 'Actualizar Permisos'", status: 'Activa' },
                           { if: "SLA < 10min AND Prioridad = 'Alta'", then: "Notificar a Ingeniería vía Slack", status: 'Activa' },
                           { if: "Empresa = 'Enterprise' AND Nuevo Ticket", then: "Enviar Respuesta VIP Personalizada", status: 'Activa' }
                         ].map((rule, idx) => (
                           <div key={idx} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                 <div style={{ fontSize: '0.7rem', color: '#00a8ff', fontWeight: 'bold' }}>IF {rule.if}</div>
                                 <div style={{ fontSize: '0.9rem', color: 'white', marginTop: '4px' }}>THEN {rule.then}</div>
                              </div>
                              <div style={{ fontSize: '0.65rem', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px' }}>{rule.status}</div>
                           </div>
                         ))}
                         <button style={{ ...styles.primaryBtn, width: 'fit-content', marginTop: '10px' }}><Plus size={16} /> CREAR NUEVA REGLA</button>
                      </div>
                   </div>

                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={styles.card}>
                         <h4>Estado del Analizador</h4>
                         <div style={{ marginTop: '15px' }}>
                            <DiagnosticItem label="Tickets Escaneados" value="1,245" />
                            <DiagnosticItem label="Auto-Clasificados" value="98.5%" />
                            <DiagnosticItem label="Acciones Auto" value="156" />
                            <DiagnosticItem label="Ahorro Operativo" value="24 hrs/mes" color="#10b981" />
                         </div>
                      </div>
                      <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '20px', borderRadius: '16px' }}>
                         <h4 style={{ margin: '0 0 10px 0', color: '#f59e0b', fontSize: '0.9rem' }}>Centro de Alertas</h4>
                         <p style={{ fontSize: '0.75rem', color: 'white', opacity: 0.7 }}>Monitoreando picos de fallas en módulos QR y GPS en tiempo real.</p>
                      </div>
                   </div>
                </div>
             </div>
          )}
          {activeTab === 'Configuración' && (
           <div className="fade-in">
              <h2>Configuración del Soporte</h2>
              <div style={styles.card}>
                 <h3>Mantenimiento del Sistema</h3>
                 <p style={{fontSize: '0.9rem', opacity: 0.6}}>Activar modo mantenimiento para todos los paneles.</p>
                 <button style={{...styles.secondaryBtn, background: '#ff4d4d', color: 'white'}} onClick={() => alert("Entrando en mantenimiento...")}>ACTIVAR MODO CRÍTICO</button>
              </div>
           </div>
         )}
      </main>

      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }) => (
  <button 
    onClick={onClick}
    style={{
      ...styles.navItem,
      background: active ? 'rgba(0,168,255,0.1)' : 'transparent',
      color: active ? '#00a8ff' : 'rgba(255,255,255,0.4)',
      borderRight: active ? '3px solid #00a8ff' : '3px solid transparent'
    }}
  >
    {icon} <span>{label}</span>
  </button>
);

const styles = {
  container: { display: 'flex', height: '100vh', background: '#020617', color: 'white', fontFamily: "'Outfit', sans-serif" },
  sidebar: { width: '280px', background: '#070c1a', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' },
  logoArea: { padding: '30px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  logoText: { fontSize: '1rem', fontWeight: '900', letterSpacing: '2px' },
  nav: { flex: 1, padding: '20px 0' },
  navItem: { width: '100%', padding: '15px 30px', display: 'flex', alignItems: 'center', gap: '15px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.3s', textAlign: 'left' },
  sidebarFooter: { padding: '20px', background: 'rgba(0,0,0,0.2)' },
  userInfo: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  avatar: { width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #00a8ff, #0072ff)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
  userName: { fontSize: '0.85rem', fontWeight: 'bold' },
  userRole: { fontSize: '0.65rem', color: '#00a8ff', letterSpacing: '1px' },
  logoutBtn: { width: '100%', padding: '12px', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.2)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  main: { flex: 1, padding: '40px', overflowY: 'auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  refreshBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 15px', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  ticketGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  ticketCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px' },
  ticketHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  badge: { padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold' },
  ticketActions: { display: 'flex', gap: '10px' },
  primaryBtnSmall: { flex: 1, padding: '8px', background: '#00a8ff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' },
  secondaryBtnSmall: { flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.01)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
  repairList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  repairCard: { background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  repairActions: { display: 'flex', gap: '10px' },
  actionIconBtn: { width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  searchBox: { position: 'relative', width: '300px' },
  searchInput: { width: '100%', padding: '12px 15px 12px 45px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', outline: 'none' },
  table: { width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(255,255,255,0.05)' },
  roleTag: { background: 'rgba(0,168,255,0.1)', color: '#00a8ff', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' },
  tableActionBtn: { background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
  card: { background: 'rgba(255,255,255,0.02)', padding: '25px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' },
  primaryBtn: { padding: '12px 25px', background: '#00a8ff', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' },
  secondaryBtn: { padding: '12px 25px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }
};

const ActionButton = ({ label, onClick, icon, primary, color }) => (
  <button 
    onClick={onClick}
    style={{
      flex: 1, padding: '10px', background: primary ? '#00a8ff' : (color || 'rgba(255,255,255,0.05)'),
      border: 'none', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
    }}
    onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.2)'}
    onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}
  >
    {icon} {label.toUpperCase()}
  </button>
);

const DiagnosticItem = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: color || 'white' }}>{value}</span>
  </div>
);

export default SupportDashboard;
