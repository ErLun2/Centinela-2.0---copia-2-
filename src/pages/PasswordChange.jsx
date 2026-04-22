import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, CheckCircle, ShieldAlert, Loader2, 
  KeyRound, ShieldCheck, X, ArrowRight, Shield
} from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';

const PasswordChange = () => {
  const { user, updatePasswordDemo } = useAuth();
  const navigate = useNavigate();
  
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Forzar visualización inmediata sin esperar a animaciones complejas
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.new.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSaving(true);
    try {
      await updatePasswordDemo(passwords.new);
      setIsSuccess(true);
      setTimeout(() => {
        const dest = user?.rol === 'SUPER_ADMIN' ? '/master' : (['GUARD', 'SUPERVISOR'].includes(user?.rol) ? '/staff' : '/company');
        navigate(dest, { replace: true });
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error de actualización. Reintente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isReady) {
    return (
      <div style={{ height: '100vh', width: '100vw', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="animate-spin" color="#00a8ff" />
      </div>
    );
  }

  return (
    <div style={containerStyle} key="pw-change-root">
      <div style={cardStyle} key="pw-card">
        {isSuccess ? (
          <div style={{ padding: '20px 0', textAlign: 'center' }} key="success-view">
            <div style={successCircleStyle}>
              <CheckCircle size={50} color="#10b981" />
            </div>
            <h2 style={titleSuccessStyle}>¡CAMBIO EXITOSO!</h2>
            <p style={subtitleStyle}>Iniciando tu sesión segura...</p>
            <div style={{ height: '4px', width: '100%', background: 'rgba(16, 185, 129, 0.2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#10b981', width: '100%', animation: 'load 2s linear' }}></div>
            </div>
          </div>
        ) : (
          <div key="form-view">
            <div style={iconBadgeStyle}>
              <ShieldAlert size={34} color="#ef4444" />
            </div>
            
            <h2 style={titleStyle}>ACTIVACIÓN DE CUENTA</h2>
            <p style={descriptionStyle}>Establezca su contraseña personal para continuar.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }} autoComplete="off">
              <div style={inputWrapperStyle} key="input-1">
                <span style={{ display: 'inline-flex' }}><KeyRound size={20} style={inputIconStyle} /></span>
                <input 
                  type="password" 
                  placeholder="Nueva Contraseña" 
                  required
                  autoComplete="new-password"
                  spellCheck="false"
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div style={inputWrapperStyle} key="input-2">
                <span style={{ display: 'inline-flex' }}><Lock size={20} style={inputIconStyle} /></span>
                <input 
                  type="password" 
                  placeholder="Confirmar Contraseña" 
                  required
                  autoComplete="new-password"
                  spellCheck="false"
                  value={passwords.confirm}
                  onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div style={legalBoxStyle}>
                <div onClick={() => setAcceptedTerms(!acceptedTerms)} style={checkboxLabelStyle} key="check-1">
                  <div style={{ ...customCheckboxStyle, background: acceptedTerms ? '#00a8ff' : 'rgba(255,255,255,0.05)', borderColor: acceptedTerms ? '#00a8ff' : 'rgba(255,255,255,0.2)' }}>
                    {acceptedTerms && <ShieldCheck size={14} color="#020617" />}
                  </div>
                  <span style={legalTextStyle}>Acepto <button type="button" onClick={(e) => { e.stopPropagation(); setShowTerms(true); }} style={linkStyle}>Términos y condiciones</button></span>
                </div>
                
                <div onClick={() => setAcceptedPrivacy(!acceptedPrivacy)} style={checkboxLabelStyle} key="check-2">
                  <div style={{ ...customCheckboxStyle, background: acceptedPrivacy ? '#00a8ff' : 'rgba(255,255,255,0.05)', borderColor: acceptedPrivacy ? '#00a8ff' : 'rgba(255,255,255,0.2)' }}>
                    {acceptedPrivacy && <Shield size={14} color="#020617" />}
                  </div>
                  <span style={legalTextStyle}>Acepto <button type="button" onClick={(e) => { e.stopPropagation(); setShowPrivacy(true); }} style={linkStyle}>Políticas de privacidad</button></span>
                </div>
              </div>

              {error ? <div style={errorBoxStyle} key="error-msg">{error}</div> : null}

              <button 
                type="submit" 
                key="submit-btn"
                disabled={isSaving || !acceptedTerms || !acceptedPrivacy} 
                style={{ ...submitButtonStyle, opacity: (isSaving || !acceptedTerms || !acceptedPrivacy) ? 0.3 : 1 }}
              >
                {isSaving ? <Loader2 size={24} className="animate-spin" /> : (
                  <span style={{ display: 'flex', alignItems: 'center' }}>ACTIVAR MI CUENTA <ArrowRight size={20} style={{marginLeft: 8}} /></span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {showTerms && <Modal title="Términos de Uso" onClose={() => setShowTerms(false)}>
        <p>El uso de esta plataforma es estrictamente operativo. La geolocalización es obligatoria durante el turno.</p>
      </Modal>}

      {showPrivacy && <Modal title="Privacidad" onClose={() => setShowPrivacy(false)}>
        <p>Sus datos están protegidos. No compartimos información con terceros externos a la operación de seguridad.</p>
      </Modal>}
    </div>
  );
};

const Modal = ({ title, children, onClose }) => (
  <div style={modalOverlayStyle} onClick={onClose}>
    <div style={modalStyle} onClick={e => e.stopPropagation()}>
      <div style={modalHeaderStyle}>
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>{title}</h3>
        <button onClick={onClose} style={modalCloseBtnStyle}><X size={20} /></button>
      </div>
      <div style={{ padding: '20px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>{children}</div>
    </div>
  </div>
);

// ESTILOS EN LINEA (Resistencia Máxima)
const containerStyle = { minHeight: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', padding: '15px', color: 'white', fontFamily: 'sans-serif' };
const cardStyle = { width: '100%', maxWidth: '380px', padding: '30px 20px', borderRadius: '24px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' };
const iconBadgeStyle = { display: 'inline-flex', padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '18px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)', marginLeft: 'auto', marginRight: 'auto' };
const titleStyle = { fontWeight: '900', fontSize: '1.2rem', marginBottom: '8px', textAlign: 'center', letterSpacing: '1px' };
const descriptionStyle = { color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: '25px', textAlign: 'center' };
const inputWrapperStyle = { position: 'relative', marginBottom: '10px' };
const inputIconStyle = { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#00a8ff' };
const inputStyle = { width: '100%', padding: '15px 15px 15px 45px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none' };
const legalBoxStyle = { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' };
const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' };
const customCheckboxStyle = { width: '20px', height: '20px', borderRadius: '5px', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const legalTextStyle = { fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' };
const linkStyle = { background: 'none', border: 'none', color: '#00a8ff', textDecoration: 'underline', padding: 0, fontWeight: 'bold', fontSize: '0.8rem' };
const submitButtonStyle = { padding: '18px', borderRadius: '15px', background: '#00a8ff', color: '#020617', border: 'none', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const errorBoxStyle = { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '10px', fontSize: '0.8rem', marginBottom: '10px', textAlign: 'center' };
const successCircleStyle = { display: 'inline-flex', padding: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '15px' };
const titleSuccessStyle = { fontWeight: '900', marginBottom: '10px', textAlign: 'center' };
const subtitleStyle = { color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' };
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' };
const modalStyle = { width: '100%', maxWidth: '350px', background: '#1e293b', borderRadius: '20px', overflow: 'hidden' };
const modalHeaderStyle = { padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalCloseBtnStyle = { background: 'none', border: 'none', color: 'white', opacity: 0.5 };

export default PasswordChange;
