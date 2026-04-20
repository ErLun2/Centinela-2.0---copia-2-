const fs = require('fs');
const path = "c:/Users/vidal/OneDrive/Anti-Gravity/Centinela 2.0 - copia (2)/src/pages/LoginPage.jsx";
let content = fs.readFileSync(path, 'utf8');

// 1. Add const [showForgot, setShowForgot] = useState(false);
if (!content.includes('const [showForgot, setShowForgot] = useState(false);')) {
  content = content.replace("const [showPrivacy, setShowPrivacy] = useState(false);", "const [showPrivacy, setShowPrivacy] = useState(false);\n  const [showForgot, setShowForgot] = useState(false);");
}

// 2. Change the button onClick
const targetBtn = `<button onClick={() => alert("Función de recuperación en desarrollo. Contacte a su supervisor.")} className="text-btn" style={styles.textBtn}>`;
const newBtn = `<button type="button" onClick={(e) => { e.preventDefault(); setShowForgot(true); }} className="text-btn" style={styles.textBtn}>`;
if (content.includes(targetBtn)) {
  content = content.replace(targetBtn, newBtn);
}

// 3. Inject ForgotModal opening
const targetModals = `<TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />`;
const newModals = `<ForgotModal isOpen={showForgot} onClose={() => setShowForgot(false)} originTab={activeTab} />\n      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />`;
if (!content.includes("<ForgotModal")) {
  content = content.replace(targetModals, newModals);
}

// 4. Append ForgotModal definition before export
const forgotModalComp = `
// COMPONENTE DE RECUPERACIÓN DE CONTRASEÑA
const ForgotModal = ({ isOpen, onClose, originTab }) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success

  // Resetea el estado si se de-selecciona
  React.useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setEmail('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('loading');
    
    setTimeout(() => {
      // Simulación de generacion de token seguro (crypto.randomBytes simulado en JS)
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const tokens = JSON.parse(localStorage.getItem('centinela_reset_tokens') || '[]');
      tokens.push({
        email,
        token,
        expires: Date.now() + 15 * 60 * 1000, // 15 mins
        used: false
      });
      localStorage.setItem('centinela_reset_tokens', JSON.stringify(tokens));

      // SIMULACIÓN DE RECIBO DE CORREO POR CONSOLA (Para demostración)
      console.log(\`%c[SIMULACIÓN EMAIL]%c Haz clic en el enlace para restablecer tu contraseña: http://\${window.location.host}/reset-password?token=\${token}\`, "color: #00a8ff; font-weight: bold;", "color: inherit;");
      
      // Aviso visual temporal (solo para modo de demostración visual local, quitando seguridad estricta al demo local)
      alert(\`SIMULACIÓN DE CORREO ENVIADO:\\nEmail: \${email}\\nEnlace: http://\${window.location.host}/reset-password?token=\${token}\`);

      setStatus('success');
    }, 1500);
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div className="glass fade-up" style={{ ...modalStyles.modal, maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', background: 'rgba(0, 168, 255, 0.1)', borderRadius: '10px' }}>
              <Lock size={20} color="#00a8ff" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '2px', fontWeight: '900', color: 'white' }}>RECUPERACIÓN</h2>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={20} /></button>
        </div>
        <div style={{ padding: '35px' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: 'bold' }}>
                Si el email es correcto, recibirás instrucciones en tu bandeja de entrada.
              </div>
              {originTab === 'empresa' && (
                 <div style={{ marginTop: '20px', padding: '15px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: '1.5' }}>
                   * Si tu cuenta pertenece a una empresa corporativa y continuas sin poder acceder, contacta a tu supervisor o administrador de sistema asignado.
                 </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '25px', lineHeight: '1.5' }}>
                Si el email está registrado, recibirás un enlace seguro para restablecer tu contraseña. Es válido por 15 minutos.
              </p>
              <div style={{ position: 'relative', marginBottom: '30px' }}>
                <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 168, 255, 0.4)' }}><User size={18} /></div>
                <input
                  type="email"
                  required
                  placeholder="EMAIL DE USUARIO"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '18px 15px 18px 52px', background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white',
                    outline: 'none', fontSize: '1rem', transition: 'all 0.3s'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(0, 168, 255, 0.6)'; e.target.style.background = 'rgba(0,0,0,0.6)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }}
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', padding: '18px', borderRadius: '16px', background: 'linear-gradient(135deg, #00a8ff 0%, #0072ff 100%)',
                  color: 'white', border: 'none', fontWeight: '900', letterSpacing: '2px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', opacity: status === 'loading' ? 0.7 : 1, transition: 'opacity 0.3s'
                }}
              >
                {status === 'loading' ? <Loader2 size={20} className="animate-spin" /> : 'ENVIAR ENLACE'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
`;

if (!content.includes("COMPONENTE DE RECUPERACIÓN DE CONTRASEÑA")) {
  content = content.replace("export default LoginPage;", forgotModalComp + "\nexport default LoginPage;");
}

fs.writeFileSync(path, content, 'utf8');
console.log("LoginPage updated with Forgot Password flow!");
