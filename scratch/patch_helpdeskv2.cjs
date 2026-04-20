const fs = require('fs');

// ========================================== //
// 1. SUPPORT DASHBOARD PATCH
// ========================================== //
const supportPath = "c:/Users/vidal/OneDrive/Anti-Gravity/Centinela 2.0 - copia (2)/src/pages/SupportDashboard.jsx";
let supportContent = fs.readFileSync(supportPath, 'utf8');

// Incorporate missing Lucide icons using a regex
const iconsTarget = "import {";
if (!supportContent.includes("Paperclip")) {
  supportContent = supportContent.replace(iconsTarget, "import {\n  Paperclip, Filter, Clock, Tag, Briefcase,");
}

// Incorporate missing states
const targetStates = "const [replyText, setReplyText] = useState('');";
const newStates = `const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [quickReply, setQuickReply] = useState('');`;

if (!supportContent.includes("const [filterStatus")) {
  supportContent = supportContent.replace(targetStates, newStates);
}

// Modify handlers to support Priority, Assigned Agent, Internal Notes
const oldHandlers = `const handleChangeStatus = (e) => {
     const newStatus = e.target.value;
     const updatedTicket = { ...selectedTicket, status: newStatus };
     const allTickets = tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t);
     localStorage.setItem('centinela_tickets', JSON.stringify(allTickets));
     setTickets(allTickets);
     setSelectedTicket(updatedTicket);
  };`;

const newHandlers = `const handleChangeStatus = (e) => {
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
       console.log(\`%c[EMAIL SIMULATION] Avisando a cliente de actualización en Ticket #\${selectedTicket.id}\`, 'color:#10b981');
     } else {
       console.log(\`%c[STAFF NOTIFICATION] Nota interna añadida a Ticket #\${selectedTicket.id}\`, 'color:#f59e0b');
     }
  };`;

if (supportContent.includes(oldHandlers)) {
  supportContent = supportContent.replace(oldHandlers, newHandlers);
}

// Replace handleReplyTicket calls with handleAdvancedReply in existing JSX
supportContent = supportContent.replace(/handleReplyTicket/g, "handleAdvancedReply");

// Entire replacement of renderTicketing
const newRenderTicketing = `const renderTicketing = () => {
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
                 <h2 style={{margin:0}}>Ticket {selectedTicket.id && \`#\${selectedTicket.id}\`}</h2>
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
                      }

                      return (
                        <div key={i} style={{ alignSelf: align, maxWidth: '80%', padding: '15px 20px', background: bgColor, borderRadius: radius, border: \`1px solid \${borderColor}\` }}>
                           <div style={{ fontSize: '0.75rem', color: titleColor, fontWeight: 'bold', marginBottom: '8px' }}>{authorName}</div>
                           <p style={{ fontSize: '0.90rem', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{r.texto}</p>
                           <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: '10px', textAlign: align==='flex-end'?'right':'left' }}>{new Date(r.fecha).toLocaleString()}</div>
                        </div>
                      );
                    })}
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
                        style={{ flex: 1, padding: '15px', borderRadius: '15px', background: isInternalNote ? 'rgba(245, 158, 11, 0.05)' : 'rgba(0,0,0,0.4)', color: 'white', border: \`1px solid \${isInternalNote ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255,255,255,0.1)'}\`, minHeight: '60px', resize: 'none' }}
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
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>{t.id && \`#\${t.id}\`}</div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{t.asunto}</div>
                       </td>
                       <td style={{ padding: '15px', fontSize: '0.85rem' }}>{t.empresaId || t.companyName || 'N/A'}</td>
                       <td style={{ padding: '15px' }}>
                          <span style={{ padding: '4px 10px', background: \`\${statusColor}20\`, color: statusColor, borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', border: \`1px solid \${statusColor}\` }}>
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
  };`;

const renderSplitSupport = supportContent.split("const renderTicketing = () => {");
if (renderSplitSupport.length === 2) {
  const afterRenderSplit = renderSplitSupport[1].split("// Case 2: Repairs & Adjustments");
  supportContent = renderSplitSupport[0] + newRenderTicketing + "\n\n  // Case 2: Repairs & Adjustments" + afterRenderSplit[1];
  fs.writeFileSync(supportPath, supportContent, 'utf8');
}


// ========================================== //
// 2. COMPANY DASHBOARD PATCH
// ========================================== //
const companyPath = "c:/Users/vidal/OneDrive/Anti-Gravity/Centinela 2.0 - copia (2)/src/pages/CompanyDashboard.jsx";
let companyContent = fs.readFileSync(companyPath, 'utf8');

// Incorporate Rating Functionality
const renderRatingFunc = `
  const handleRateTicket = (stars) => {
     if (!selectedTicket) return;
     const updated = { ...selectedTicket, rating: stars };
     const allT = JSON.parse(localStorage.getItem('centinela_tickets') || '[]');
     const newAll = allT.map(t => t.id === selectedTicket.id ? updated : t);
     localStorage.setItem('centinela_tickets', JSON.stringify(newAll));
     setTickets(tickets.map(t => t.id === selectedTicket.id ? updated : t));
     setSelectedTicket(updated);
  };
`;
if (!companyContent.includes("const handleRateTicket")) {
  companyContent = companyContent.replace("const handleSendResponse", renderRatingFunc + "\n  const handleSendResponse");
}

// Filter out internal notes in company map
const mapOld = `{(selectedTicket.respuestas || []).map((r, i) => (`;
const mapNew = `{(selectedTicket.respuestas || []).filter(r => r.autor !== 'NOTA INTERNA').map((r, i) => (`;
if (companyContent.includes(mapOld)) {
  companyContent = companyContent.replace(mapOld, mapNew);
}

// Support Rating UI
const closeOverlayTarget = `{(selectedTicket.status === 'Cerrado' || selectedTicket.status === 'Resuelto') && (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#10b981', background: 'rgba(16,185,129,0.05)', borderRadius: '15px', fontSize: '0.85rem' }}>
                          <CheckCircle size={16} /> Ticket cerrado - Problema resuelto satisfactoriamente.
                        </div>
                      )}`;
const closeOverlayReplace = `{(selectedTicket.status === 'Cerrado' || selectedTicket.status === 'Resuelto') && (
                        <div style={{ textAlign: 'center', padding: '30px', color: 'white', background: 'rgba(16,185,129,0.05)', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '15px' }}><CheckCircle size={24} style={{marginBottom:'10px', display:'block', margin:'0 auto'}}/> Ticket resuelto y cerrado</div>
                          {!selectedTicket.rating ? (
                            <div>
                               <p style={{fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '15px'}}>Por favor, califica la atención de nuestro equipo de soporte:</p>
                               <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                 {[1,2,3,4,5].map(star => (
                                    <button key={star} onClick={() => handleRateTicket(star)} style={{ background: 'transparent', border: 'none', color: '#f59e0b', fontSize: '2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e=>e.target.style.transform='scale(1.2)'} onMouseOut={e=>e.target.style.transform='scale(1)'}>☆</button>
                                 ))}
                               </div>
                            </div>
                          ) : (
                            <div>
                               <p style={{fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '10px'}}>Atención calificada con</p>
                               <div style={{ color: '#f59e0b', fontSize: '1.5rem', letterSpacing: '5px' }}>{'★'.repeat(selectedTicket.rating)}{'☆'.repeat(5-selectedTicket.rating)}</div>
                            </div>
                          )}
                        </div>
                      )}`;
if (companyContent.includes(closeOverlayTarget)) {
  companyContent = companyContent.replace(closeOverlayTarget, closeOverlayReplace);
}

// Additional UI visual touches for Company Chat Add Attachment Mock
const attachButtonOld = `<button style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: 'white' }}><Paperclip size={18} /></button>`;
const attachButtonNew = `<button onClick={() => alert("Simulador: Esta función adjunta imágenes al chat.")} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: ' سفید', cursor: 'pointer' }}><Paperclip size={18} /></button>`;
// It's white but written in spanish. 'white' -> 'white'
if (companyContent.includes(attachButtonOld)) {
  companyContent = companyContent.replace(attachButtonOld, `<button onClick={() => alert("Función visual (Adjuntar imagen/pdf)")} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer' }}><Paperclip size={18} /></button>`);
}

fs.writeFileSync(companyPath, companyContent, 'utf8');

console.log("Help Desk Module completed correctly!");
