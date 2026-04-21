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

  // Animación inicial
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { setIsVisible(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.new.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
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
        const redirectMap = {
          [ROLES.SUPER_ADMIN]: '/master',
          [ROLES.SUPPORT]: '/support',
          [ROLES.COMPANY_ADMIN]: '/company',
          [ROLES.COMPANY_CLIENT]: '/company',
          [ROLES.OPERADOR]: '/company',
          [ROLES.SUPERVISOR]: '/staff',
          [ROLES.GUARD]: '/staff'
        };
        const dest = redirectMap[user?.rol] || '/';
        navigate(dest, { replace: true });
      }, 2000);
    } catch (err) {
      setError('Error al actualizar. Intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Fondo con Blur */}
      <div style={overlayStyle}></div>
      
      <div className={`glass ${isVisible ? 'fade-up' : ''}`} style={cardStyle}>
        {isSuccess ? (
          <div style={{ padding: '20px 0' }}>
            <div className="pulse-success" style={successCircleStyle}>
              <CheckCircle size={50} color="#10b981" />
            </div>
            <h2 style={titleSuccessStyle}>¡TODO LISTO!</h2>
            <p style={subtitleStyle}>Tu seguridad ha sido actualizada con éxito. Iniciando misiones...</p>
            <div style={loaderTrackStyle}>
                <div style={loaderProgressStyle}></div>
            </div>
          </div>
        ) : (
          <>
            <div style={iconBadgeStyle}>
              <ShieldAlert size={34} color="#ef4444" />
            </div>
            
            <h2 style={titleStyle}>SEGURIDAD <span style={{ color: '#00a8ff' }}>OBLIGATORIA</span></h2>
            <p style={descriptionStyle}>
              Por protocolo de seguridad, debes actualizar tu clave personal y aceptar los términos de uso.
            </p>

            <form onSubmit={handleSubmit} style={formStyle}>
              <div style={inputGroupStyle}>
                <div style={inputWrapperStyle}>
                  <KeyRound size={20} style={inputIconStyle} />
                  <input 
                    type="password" 
                    placeholder="Nueva Contraseña" 
                    required
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                    style={inputStyle}
                  />
                </div>

                <div style={inputWrapperStyle}>
                  <Lock size={20} style={inputIconStyle} />
                  <input 
                    type="password" 
                    placeholder="Confirmar Contraseña" 
                    required
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Aceptación Legal Táctil */}
              <div style={legalBoxStyle}>
                <div 
                  onClick={() => setAcceptedTerms(!acceptedTerms)}
                  style={{...checkboxLabelStyle, background: acceptedTerms ? 'rgba(0,168,255,0.1)' : 'transparent'}}
                >
                  <div style={{ 
                      ...customCheckboxStyle, 
                      background: acceptedTerms ? '#00a8ff' : 'rgba(255,255,255,0.05)',
                      borderColor: acceptedTerms ? '#00a8ff' : 'rgba(255,255,255,0.2)'
                    }}
                  >
                    {acceptedTerms && <ShieldCheck size={16} color="#020617" />}
                  </div>
                  <span style={legalTextStyle}>
                    Acepto los <button type="button" onClick={(e) => { e.stopPropagation(); setShowTerms(true); }} style={linkStyle}>Términos</button>
                  </span>
                </div>
                
                <div 
                  onClick={() => setAcceptedPrivacy(!acceptedPrivacy)}
                  style={{...checkboxLabelStyle, background: acceptedPrivacy ? 'rgba(0,168,255,0.1)' : 'transparent'}}
                >
                  <div style={{ 
                      ...customCheckboxStyle, 
                      background: acceptedPrivacy ? '#00a8ff' : 'rgba(255,255,255,0.05)',
                      borderColor: acceptedPrivacy ? '#00a8ff' : 'rgba(255,255,255,0.2)'
                    }}
                  >
                    {acceptedPrivacy && <Shield size={16} color="#020617" />}
                  </div>
                  <span style={legalTextStyle}>
                    Acepto la <button type="button" onClick={(e) => { e.stopPropagation(); setShowPrivacy(true); }} style={linkStyle}>Privacidad</button>
                  </span>
                </div>
              </div>

              {error && (
                <div className="shake" style={errorBoxStyle}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isSaving || !acceptedTerms || !acceptedPrivacy} 
                style={{ 
                  ...submitButtonStyle, 
                  opacity: (isSaving || !acceptedTerms || !acceptedPrivacy) ? 0.3 : 1
                }}
              >
                {isSaving ? <Loader2 className="animate-spin" /> : (
                  <>
                    ACTUALIZAR E INGRESAR
                    <ArrowRight size={20} style={{ marginLeft: '12px' }} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      <style>{`
        .glass {
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .fade-up { animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .pulse-success { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); animation: pulse-ring 2s infinite; border-radius: 50%; }
        @keyframes pulse-ring { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        @keyframes load { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  );
};

const containerStyle = { minHeight: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#020617', padding: '15px' };
const overlayStyle = { position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(0, 168, 255, 0.15), transparent 60%)', zIndex: 1 };
const cardStyle = { width: '100%', maxWidth: '400px', padding: '40px 25px', borderRadius: '32px', zIndex: 10, textAlign: 'center' };
const iconBadgeStyle = { display: 'inline-flex', padding: '15px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '20px', marginBottom: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' };
const titleStyle = { color: 'white', fontWeight: '900', fontSize: '1.4rem', marginBottom: '10px', letterSpacing: '1px' };
const descriptionStyle = { color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '30px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
const inputWrapperStyle = { position: 'relative' };
const inputIconStyle = { position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#00a8ff' };
const inputStyle = { width: '100%', padding: '18px 18px 18px 52px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '18px', color: 'white', fontSize: '1rem', outline: 'none' };
const legalBoxStyle = { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' };
const checkboxLabelStyle = { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 15px', borderRadius: '15px', transition: '0.3s' };
const customCheckboxStyle = { width: '22px', height: '22px', borderRadius: '6px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.3s' };
const legalTextStyle = { fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' };
const linkStyle = { background: 'none', border: 'none', color: '#00a8ff', textDecoration: 'underline', padding: 0, fontWeight: 'bold' };
const submitButtonStyle = { marginTop: '10px', padding: '20px', borderRadius: '18px', background: 'linear-gradient(135deg, #00d2ff, #00a8ff)', color: '#020617', border: 'none', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const errorBoxStyle = { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '12px', fontSize: '0.8rem' };
const successCircleStyle = { display: 'inline-flex', padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '20px' };
const titleSuccessStyle = { color: 'white', fontWeight: '900', letterSpacing: '2px', marginBottom: '10px' };
const subtitleStyle = { color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '25px' };
const loaderTrackStyle = { width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' };
const loaderProgressStyle = { width: '100%', height: '100%', background: '#10b981', animation: 'load 2s linear forwards' };

const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div className="glass" style={modalStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
            <ShieldCheck size={24} color="#00a8ff" />
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>TÉRMINOS DE USO</h3>
            <button onClick={onClose} style={modalStyles.closeBtn}><X size={20} /></button>
        </div>
        <div style={modalStyles.content}>
           <p style={modalStyles.text}>El uso de esta plataforma implica la aceptación de los siguientes protocolos operativos:</p>
           <ul style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', paddingLeft: '20px' }}>
              <li>Ubicación en tiempo real durante el turno.</li>
              <li>Prohibición de compartir credenciales.</li>
              <li>Registro fidedigno de novedades.</li>
           </ul>
        </div>
      </div>
    </div>
  );
};

const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div className="glass" style={modalStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
            <Lock size={24} color="#00a8ff" />
            <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>PRIVACIDAD</h3>
            <button onClick={onClose} style={modalStyles.closeBtn}><X size={20} /></button>
        </div>
        <div style={modalStyles.content}>
           <p style={modalStyles.text}>Tus datos están protegidos bajo protocolos de seguridad militar. Centinela 2.0 no comparte información personal con terceros ajenos a la operativa.</p>
        </div>
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '20px' },
  modal: { width: '100%', maxWidth: '400px', borderRadius: '24px' },
  header: { padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '15px' },
  closeBtn: { background: 'none', border: 'none', color: 'white', opacity: 0.5, marginLeft: 'auto' },
  content: { padding: '20px' },
  text: { color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: '1.5' }
};

export default PasswordChange;
