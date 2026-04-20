const fs = require('fs');
const path = "c:/Users/vidal/OneDrive/Anti-Gravity/Centinela 2.0 - copia (2)/src/pages/LoginPage.jsx";
let content = fs.readFileSync(path, 'utf8');

// 1. Add const [showSales, setShowSales] = useState(false);
if (!content.includes('const [showSales, setShowSales] = useState(false);')) {
  content = content.replace("const [showForgot, setShowForgot] = useState(false);", "const [showForgot, setShowForgot] = useState(false);\n  const [showSales, setShowSales] = useState(false);");
}

// 2. Change the button onClick
const targetBtn = `<button onClick={() => alert("Redirigiendo al canal de ventas de Centinela...")} className="text-btn" style={styles.textBtn}>`;
const newBtn = `<button type="button" onClick={(e) => { e.preventDefault(); setShowSales(true); }} className="text-btn" style={styles.textBtn}>`;
if (content.includes(targetBtn)) {
  content = content.replace(targetBtn, newBtn);
}

// 3. Inject SalesModal opening
const targetModals = `<ForgotModal isOpen={showForgot} onClose={() => setShowForgot(false)} originTab={activeTab} />`;
const newModals = `<SalesModal isOpen={showSales} onClose={() => setShowSales(false)} />\n      <ForgotModal isOpen={showForgot} onClose={() => setShowForgot(false)} originTab={activeTab} />`;
if (!content.includes("<SalesModal")) {
  content = content.replace(targetModals, newModals);
}

// 4. Append SalesModal definition
const salesModalComp = `
// COMPONENTE DE CONTACTO COMERCIAL (LEADS)
const SalesModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '', empresa: '', email: '', telefono: '', empleados: '', mensaje: ''
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setError('');
      setFormData({ nombre: '', empresa: '', email: '', telefono: '', empleados: '', mensaje: '' });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.nombre || !formData.empresa || !formData.email || !formData.telefono) {
      setError("Por favor, completa todos los campos obligatorios.");
      return;
    }
    
    // Email regex
    if (!/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/.test(formData.email)) {
      setError("El formato del email corporativo no es válido.");
      return;
    }

    // Phone regex (solo números, y símbolos permitidos)
    if (!/^[0-9+\\-\\s]{8,20}$/.test(formData.telefono)) {
      setError("El formato del teléfono no es válido.");
      return;
    }

    setStatus('loading');

    setTimeout(() => {
      // Backend Simulation
      const leads = JSON.parse(localStorage.getItem('centinela_leads') || '[]');
      leads.push({ ...formData, id: 'lead_' + Date.now(), fecha: new Date().toISOString(), estado: 'nuevo' });
      localStorage.setItem('centinela_leads', JSON.stringify(leads));

      console.log(\`%c[SIMULACIÓN NOTIFICACIÓN EQUIPO COMERCIAL]%c Nuevo lead registrado: \${formData.empresa} (\${formData.email}) - Tel: \${formData.telefono}\`, "color: #f59e0b; font-weight: bold;", "color: inherit;");
      console.log(\`%c[SIMULACIÓN EMAIL A POTENCIAL CLIENTE]%c Gracias por contactar a Centinela, \${formData.nombre}. Un representante se comunicará a la brevedad.\`, "color: #10b981; font-weight: bold;", "color: inherit;");

      setStatus('success');
    }, 1500);
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div className="glass fade-up custom-scrollbar" style={{ ...modalStyles.modal, maxWidth: '500px', overflowY: 'auto', maxHeight: '95vh' }} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px' }}>
              <Building2 size={20} color="#f59e0b" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '2px', fontWeight: '900', color: 'white' }}>CONTACTO VENTAS</h2>
          </div>
          <button type="button" onClick={onClose} style={modalStyles.closeBtn}><X size={20} /></button>
        </div>
        
        <div style={{ padding: '30px' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '20px 10px' }}>
              <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <ShieldCheck size={30} color="#10b981" />
              </div>
              <h3 style={{ color: 'white', marginBottom: '10px', fontSize: '1.2rem' }}>¡Solicitud enviada correctamente!</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Nuestro equipo se comunicará contigo a la brevedad para activar tu empresa.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                <p style={{ color: '#f59e0b', fontSize: '0.9rem', margin: 0, fontWeight: 'bold', textAlign: 'center' }}>
                  Dejanos tus datos y te contactamos para activar tu empresa
                </p>
              </div>

              {error && (
                <div className="shake" style={{ padding: '12px', background: 'rgba(255, 77, 77, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 77, 77, 0.2)', color: '#ff4d4d', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              <InputField placeholder="NOMBRE COMPLETO *" icon={<User size={18}/>} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              <InputField placeholder="EMPRESA *" icon={<Building2 size={18}/>} value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <InputField type="email" placeholder="EMAIL CORPORATIVO *" icon={<MessageCircle size={18}/>} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <InputField type="tel" placeholder="TELÉFONO *" icon={<LifeBuoy size={18}/>} value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
              </div>

              <input
                placeholder="CANTIDAD DE EMPLEADOS (OPCIONAL)"
                type="number"
                value={formData.empleados}
                onChange={e => setFormData({...formData, empleados: e.target.value})}
                style={{ width: '100%', boxSizing: 'border-box', padding: '15px 15px 15px 25px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', outline: 'none', fontSize: '0.9rem', transition: 'all 0.3s' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(245, 158, 11, 0.6)'; e.target.style.background = 'rgba(0,0,0,0.6)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }}
              />

              <textarea
                placeholder="MENSAJE ADICIONAL (OPCIONAL)"
                value={formData.mensaje}
                onChange={e => setFormData({...formData, mensaje: e.target.value})}
                rows={3}
                style={{ width: '100%', boxSizing: 'border-box', padding: '15px 15px 15px 25px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white', outline: 'none', fontSize: '0.9rem', resize: 'vertical', fontFamily: "'Outfit', sans-serif", transition: 'all 0.3s' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(245, 158, 11, 0.6)'; e.target.style.background = 'rgba(0,0,0,0.6)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }}
              />

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', padding: '18px', borderRadius: '16px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white', border: 'none', fontWeight: '900', letterSpacing: '2px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1, transition: 'all 0.3s', marginTop: '10px'
                }}
              >
                {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : 'SOLICITAR CONTACTO'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
`;

if (!content.includes("COMPONENTE DE CONTACTO COMERCIAL (LEADS)")) {
  content = content.replace("export default LoginPage;", salesModalComp + "\nexport default LoginPage;");
}

fs.writeFileSync(path, content, 'utf8');
console.log("LoginPage updated with Sales Contact flow!");
