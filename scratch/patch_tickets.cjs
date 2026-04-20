const fs = require('fs');

const supportPath = "c:/Users/vidal/OneDrive/Anti-Gravity/Centinela 2.0 - copia (2)/src/pages/SupportDashboard.jsx";
let supportContent = fs.readFileSync(supportPath, 'utf8');

// 1. Add states to SupportDashboard
if (!supportContent.includes('const [selectedTicket, setSelectedTicket] = useState(null);')) {
  supportContent = supportContent.replace(
    "const [isLoading, setIsLoading] = useState(true);",
    "const [isLoading, setIsLoading] = useState(true);\n  const [selectedTicket, setSelectedTicket] = useState(null);\n  const [replyText, setReplyText] = useState('');"
  );
}

// 2. Add local ticket handlers in SupportDashboard
const ticketHandlers = `
  const handleReplyTicket = () => {
     if (!replyText.trim() || !selectedTicket) return;
     const updatedTicket = { ...selectedTicket, respuestas: [...(selectedTicket.respuestas || []), { autor: 'SOPORTE', texto: replyText, fecha: new Date().toISOString() }] };
     const allTickets = tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t);
     localStorage.setItem('centinela_tickets', JSON.stringify(allTickets));
     setTickets(allTickets);
     setSelectedTicket(updatedTicket);
     setReplyText("");
  };

  const handleChangeStatus = (e) => {
     const newStatus = e.target.value;
     const updatedTicket = { ...selectedTicket, status: newStatus };
     const allTickets = tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t);
     localStorage.setItem('centinela_tickets', JSON.stringify(allTickets));
     setTickets(allTickets);
     setSelectedTicket(updatedTicket);
  };
`;
if (!supportContent.includes("const handleReplyTicket = () => {")) {
  supportContent = supportContent.replace("const loadData = () => {", ticketHandlers + "\n  const loadData = () => {");
}

// 3. Replace renderTicketing entirely
const originalRenderTicketingStart = "const renderTicketing = () => (";
const newRenderTicketing = `const renderTicketing = () => {
    if (selectedTicket) {
      return (
        <div className="fade-in">
           <div style={styles.headerRow}>
              <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                 <button onClick={() => setSelectedTicket(null)} style={styles.actionIconBtn}><ArrowLeft size={18} /></button>
                 <h2 style={{margin:0}}>Ticket {selectedTicket.id && \`#\${selectedTicket.id}\`} - {selectedTicket.asunto}</h2>
              </div>
              <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                 <span style={{fontSize: '0.8rem', opacity: 0.6}}>Estado:</span>
                 <select value={selectedTicket.status || 'Abierto'} onChange={handleChangeStatus} style={{background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', outline: 'none'}}>
                    <option value="Abierto">ABIERTO</option>
                    <option value="En Seguimiento">EN SEGUIMIENTO</option>
                    <option value="Cerrado">CERRADO</option>
                 </select>
              </div>
           </div>
           
           <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '60vh' }}>
              <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  {/* Original Request (Company) */}
                  <div style={{ alignSelf: 'flex-start', maxWidth: '80%', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px 20px 20px 0', border: '1px solid rgba(255,255,255,0.1)' }}>
                     <div style={{ fontSize: "0.8rem", color: "white", fontWeight: "bold", marginBottom: "8px" }}>EMPRESA PREGUNTA:</div>
                     <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>{selectedTicket.descripcion}</p>
                     <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '10px' }}>{new Date(selectedTicket.fecha).toLocaleTimeString()}</div>
                  </div>

                  {/* Replies (Chat) */}
                  {(selectedTicket.respuestas || []).map((r, i) => (
                    <div key={i} style={{ alignSelf: r.autor === 'SOPORTE' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '20px', background: r.autor === 'SOPORTE' ? 'rgba(0,168,255,0.1)' : 'rgba(255,255,255,0.05)', borderRadius: r.autor === 'SOPORTE' ? '20px 20px 0 20px' : '20px 20px 20px 0', border: r.autor === 'SOPORTE' ? '1px solid rgba(0,168,255,0.2)' : '1px solid rgba(255,255,255,0.1)' }}>
                       <div style={{ fontSize: '0.8rem', color: r.autor === 'SOPORTE' ? '#00a8ff' : 'white', fontWeight: 'bold', marginBottom: '8px' }}>{r.autor === 'SOPORTE' ? 'SOPORTE (TÚ)' : 'EMPRESA'}</div>
                       <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>{r.texto}</p>
                       <div style={{ fontSize: '0.65rem', color: 'rgba(0,168,255,0.3)', marginTop: '10px', textAlign: r.autor === 'SOPORTE' ? 'right' : 'left' }}>{new Date(r.fecha).toLocaleTimeString()}</div>
                    </div>
                  ))}
                  {(selectedTicket.status === 'Cerrado' || selectedTicket.status === 'Resuelto') && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#10b981', background: 'rgba(16,185,129,0.05)', borderRadius: '15px', fontSize: '0.85rem' }}>
                      <CheckCircle2 size={16} /> Ticket cerrado o resuelto satisfactoriamente.
                    </div>
                  )}
              </div>

              <div style={{ padding: '25px', backgroundColor: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ position: 'relative' }}>
                    <textarea 
                      value={replyText} onChange={e => setReplyText(e.target.value)}
                      placeholder="Escribe una respuesta técnica..." 
                      style={{ width: '100%', boxSizing: 'border-box', padding: '20px', paddingRight: '120px', borderRadius: '20px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', minHeight: '80px', resize: 'none' }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplyTicket(); } }}
                    />
                    <div style={{ position: 'absolute', right: '15px', bottom: '15px', display: 'flex', gap: '10px' }}>
                      <button onClick={handleReplyTicket} disabled={!replyText.trim()} style={{ padding: '8px 15px', background: replyText.trim() ? '#00a8ff' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', color: 'white', cursor: replyText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>ENVIAR</button>
                    </div>
                  </div>
              </div>
           </div>
        </div>
      );
    }

    return (
      <div className="fade-in">
         <div style={styles.headerRow}>
            <h2>Centro de Atención al Cliente</h2>
            <button style={styles.refreshBtn} onClick={loadData}><RefreshCcw size={16} /> ACTUALIZAR</button>
         </div>
         
         <div style={styles.ticketGrid}>
            {tickets.length > 0 ? tickets.map((t, idx) => (
              <div key={idx} style={styles.ticketCard}>
                 <div style={styles.ticketHeader}>
                    <span style={{...styles.badge, background: (t.status === 'Cerrado' || t.status === 'Resuelto') ? '#10b981' : (t.status === 'En Seguimiento' ? '#f59e0b' : '#ff4d4d')}}>
                      {(t.status || 'Abierto').toUpperCase()}
                    </span>
                    <span style={{fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)'}}>{new Date(t.fecha).toLocaleDateString()}</span>
                 </div>
                 <h3 style={{fontSize: '1rem', marginBottom: '10px'}}>{t.asunto || t.subject}</h3>
                 <p style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '15px'}}>{t.empresaId ? \`Empresa ID: \${t.empresaId}\` : \`\${t.companyName}\`}</p>
                 <div style={styles.ticketActions}>
                    <button style={styles.primaryBtnSmall} onClick={() => setSelectedTicket(t)}>VER / RESPONDER</button>
                 </div>
              </div>
            )) : (
              <div style={styles.emptyState}>No hay tickets pendientes actualmente.</div>
            )}
         </div>
      </div>
    );
  };
`;

const supportParts = supportContent.split("const renderTicketing = () => (");
if (supportParts.length === 2 && !supportContent.includes("if (selectedTicket) {")) {
   const beforeRender = supportParts[0];
   const afterRenderSplit = supportParts[1].split("  // Case 2: Repairs & Adjustments");
   if (afterRenderSplit.length === 2) {
       supportContent = beforeRender + newRenderTicketing + "\n\n  // Case 2: Repairs & Adjustments" + afterRenderSplit[1];
       fs.writeFileSync(supportPath, supportContent, 'utf8');
   }
}

// ========================================== //
// CompanyDashboard.jsx Modifications
// ========================================== //
const companyPath = "c:/Users/vidal/OneDrive/Anti-Gravity/Centinela 2.0 - copia (2)/src/pages/CompanyDashboard.jsx";
let companyContent = fs.readFileSync(companyPath, 'utf8');

if (!companyContent.includes('const [chatReply, setChatReply] = useState("");')) {
  companyContent = companyContent.replace(
    "const [selectedTicket, setSelectedTicket] = useState(null);",
    "const [selectedTicket, setSelectedTicket] = useState(null);\n  const [chatReply, setChatReply] = useState(\"\");\n\n  const handleSendResponse = () => {\n    if (!chatReply.trim() || !selectedTicket) return;\n    const updatedTicket = { ...selectedTicket, respuestas: [...(selectedTicket.respuestas || []), { autor: 'EMPRESA', texto: chatReply, fecha: new Date().toISOString() }] };\n    const allTickets = JSON.parse(localStorage.getItem('centinela_tickets') || '[]');\n    const newAll = allTickets.map(t => t.id === selectedTicket.id ? updatedTicket : t);\n    localStorage.setItem('centinela_tickets', JSON.stringify(newAll));\n    \n    // Actualizar state\n    setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));\n    setSelectedTicket(updatedTicket);\n    setChatReply(\"\");\n  };\n"
  );
}

// Fix replies mapping inside CompanyDashboard
const targetMapOld = `{selectedTicket.respuestas.map((r, i) => (
                        <div key={i} style={{ alignSelf: 'flex-start', maxWidth: '80%', padding: '20px', background: 'rgba(15,23,42,0.8)', borderRadius: '20px 20px 20px 0', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', marginBottom: '8px' }}>SOPORTE CENTINELA</div>
                          <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>{r.texto}</p>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '10px' }}>{new Date(r.fecha).toLocaleTimeString()}</div>
                        </div>
                      ))}`;

const dynamicMapNew = `{(selectedTicket.respuestas || []).map((r, i) => (
                        <div key={i} style={{ alignSelf: r.autor === 'EMPRESA' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '20px', background: r.autor === 'EMPRESA' ? 'rgba(0,168,255,0.1)' : 'rgba(15,23,42,0.8)', borderRadius: r.autor === 'EMPRESA' ? '20px 20px 0 20px' : '20px 20px 20px 0', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ fontSize: '0.8rem', color: r.autor === 'EMPRESA' ? 'var(--primary)' : '#10b981', fontWeight: 'bold', marginBottom: '8px' }}>{r.autor === 'EMPRESA' ? 'TÚ' : 'SOPORTE CENTINELA'}</div>
                          <p style={{ fontSize: '0.95rem', margin: 0, lineHeight: '1.6' }}>{r.texto}</p>
                          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '10px', textAlign: r.autor === 'EMPRESA' ? 'right' : 'left' }}>{new Date(r.fecha).toLocaleTimeString()}</div>
                        </div>
                      ))}`;

if (companyContent.includes(targetMapOld)) {
  companyContent = companyContent.replace(targetMapOld, dynamicMapNew);
}

// Fix statuses in CompanyDashboard
if (companyContent.includes("selectedTicket.status === 'Resuelto'") && !companyContent.includes("selectedTicket.status === 'Cerrado' || selectedTicket.status === 'Resuelto'")) {
  companyContent = companyContent.replace("selectedTicket.status === 'Resuelto'", "(selectedTicket.status === 'Cerrado' || selectedTicket.status === 'Resuelto')");
}

// Link chatReply state to text area
const textareaOld = `<textarea
                          placeholder="Responder a soporte o brindar más detalles..."
                          style={{ width: '100%', padding: '20px', paddingRight: '120px', borderRadius: '20px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', minHeight: '80px', resize: 'none' }}
                        />`;
const textareaNew = `<textarea
                          value={chatReply} onChange={e => setChatReply(e.target.value)}
                          placeholder="Responder a soporte o brindar más detalles..."
                          style={{ width: '100%', boxSizing: 'border-box', padding: '20px', paddingRight: '120px', borderRadius: '20px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', minHeight: '80px', resize: 'none' }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendResponse(); } }}
                        />`;
if (companyContent.includes(textareaOld)) {
  companyContent = companyContent.replace(textareaOld, textareaNew);
}

const sendBtnOld = `<button style={{ padding: '8px 15px', background: 'var(--primary)', border: 'none', borderRadius: '10px', color: 'white' }}><Send size={18} /></button>`;
const sendBtnNew = `<button disabled={!chatReply.trim()} onClick={handleSendResponse} style={{ padding: '8px 15px', background: chatReply.trim() ? 'var(--primary)' : 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', color: 'white', cursor: chatReply.trim() ? 'pointer' : 'not-allowed' }}><Send size={18} /></button>`;
if (companyContent.includes(sendBtnOld)) {
  companyContent = companyContent.replace(sendBtnOld, sendBtnNew);
}

fs.writeFileSync(companyPath, companyContent, 'utf8');
console.log("Comapny & Support dashboards successfully patched with sync chat functionality.");
