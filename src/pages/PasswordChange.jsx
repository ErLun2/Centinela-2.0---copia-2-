import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, ShieldAlert, Loader2, KeyRound, ShieldCheck, X } from 'lucide-react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwords.new.length < 10) {
      setError('La contraseña debe tener al menos 10 caracteres.');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate validation / saving
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
        const dest = redirectMap[user.rol] || '/';
        navigate(dest, { replace: true });
      }, 2000);
    } catch (err) {
      setError('Error al actualizar la contraseña. Reintente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundImage: 'url(/login-bg-ref-2.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.8)', zIndex: 1 }}></div>

      <div className="glass fade-in" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '50px 40px',
        border: '1px solid rgba(0, 168, 255, 0.3)',
        background: 'rgba(7, 12, 26, 0.6)',
        backdropFilter: 'blur(30px) saturate(150%)',
        borderRadius: '24px',
        zIndex: 10,
        textAlign: 'center'
      }}>
        {isSuccess ? (
          <div className="fade-down" style={{ padding: '20px 0' }}>
            <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '20px' }}>
              <CheckCircle size={48} color="#10b981" />
            </div>
            <h2 style={{ color: 'white', letterSpacing: '2px', marginBottom: '10px' }}>¡ACCESO ASEGURADO!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Contraseña actualizada. Redirigiendo al panel operativo...</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'inline-flex', padding: '15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', marginBottom: '20px' }}>
              <ShieldAlert size={32} color="#ef4444" />
            </div>
            
            <h2 style={{ color: 'white', letterSpacing: '4px', marginBottom: '10px', fontSize: '1.4rem' }}>SEGURIDAD OBLIGATORIA</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '0.9rem' }}>
              Detectamos que es tu primer inicio de sesión. Por seguridad, debes actualizar tu contraseña provisional.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <KeyRound size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input 
                  type="password" 
                  placeholder="Nueva Contraseña (Min. 10)" 
                  required
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                  style={inputStyle}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input 
                  type="password" 
                  placeholder="Confirmar Contraseña" 
                  required
                  value={passwords.confirm}
                  onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                  style={inputStyle}
                />
              </div>

              {/* Aceptación de Términos y Privacidad */}
              <div style={acceptanceContainerStyle}>
                <div style={checkboxWrapperStyle}>
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={acceptedTerms} 
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    style={checkboxStyle}
                  />
                  <label htmlFor="terms" style={labelStyle}>
                    Acepto los <button type="button" onClick={() => setShowTerms(true)} style={linkBtnStyle}>Términos y Condiciones</button>
                  </label>
                </div>
                
                <div style={checkboxWrapperStyle}>
                  <input 
                    type="checkbox" 
                    id="privacy" 
                    checked={acceptedPrivacy} 
                    onChange={e => setAcceptedPrivacy(e.target.checked)}
                    style={checkboxStyle}
                  />
                  <label htmlFor="privacy" style={labelStyle}>
                    Acepto la <button type="button" onClick={() => setShowPrivacy(true)} style={linkBtnStyle}>Política de Privacidad</button>
                  </label>
                </div>
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px' }}>{error}</div>}

              <button 
                type="submit" 
                disabled={isSaving || !acceptedTerms || !acceptedPrivacy} 
                style={{ ...buttonStyle, opacity: (isSaving || !acceptedTerms || !acceptedPrivacy) ? 0.5 : 1 }}
              >
                {isSaving ? <Loader2 className="animate-spin" /> : 'ACTUALIZAR Y ENTRAR'}
              </button>
            </form>
          </>
        )}
      </div>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
};

// ESTILOS ADICIONALES
const acceptanceContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  textAlign: 'left',
  marginBottom: '10px',
  padding: '10px',
  background: 'rgba(0,0,0,0.2)',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.05)'
};

const checkboxWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer'
};

const checkboxStyle = {
  width: '18px',
  height: '18px',
  cursor: 'pointer',
  accentColor: '#00a8ff'
};

const labelStyle = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '0.8rem',
  cursor: 'pointer'
};

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#38bdf8',
  textDecoration: 'underline',
  padding: 0,
  fontSize: '0.8rem',
  cursor: 'pointer',
  fontWeight: 'bold'
};

// MODALES (RECOMPARTIDOS)
const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div className="glass fade-up" style={modalStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', background: 'rgba(0, 168, 255, 0.1)', borderRadius: '10px' }}>
              <ShieldCheck size={20} color="#00a8ff" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '2px', fontWeight: '900', color: 'white' }}>TÉRMINOS Y CONDICIONES</h2>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={20} /></button>
        </div>
        <div className="custom-scrollbar" style={modalStyles.content}>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>1. Objeto del Servicio</h3>
            <p style={modalStyles.text}>La plataforma brindada por el proveedor constituye un sistema SaaS (Software as a Service) orientado a la gestión operativa de servicios de seguridad, permitiendo el monitoreo, control y registro de actividades del personal mediante herramientas digitales.</p>
            <p style={modalStyles.text}>El sistema está diseñado para proporcionar <strong>facilidades, automatización, rapidez y control operativo</strong>, optimizando la gestión de recursos humanos y eventos en tiempo real.</p>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>2. Alcance y Limitaciones del Servicio</h3>
            <p style={modalStyles.text}>La plataforma provee herramientas tecnológicas que facilitan la supervisión y control del personal.</p>
            <p style={modalStyles.text}>Sin perjuicio de ello, el cliente reconoce y acepta que:</p>
            <ul style={modalStyles.list}>
              <li>El sistema <strong>no garantiza el cumplimiento de tareas por parte del factor humano</strong>.</li>
              <li>El correcto funcionamiento operativo depende del uso adecuado de la plataforma por parte de los usuarios.</li>
              <li>La plataforma actúa como herramienta de apoyo, no como sustituto del control humano ni de la supervisión organizacional.</li>
            </ul>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>3. Condiciones de Uso</h3>
            <p style={modalStyles.text}>El cliente se compromete a:</p>
            <ul style={modalStyles.list}>
              <li>Utilizar la plataforma conforme a los procedimientos establecidos.</li>
              <li>Respetar los mecanismos operativos definidos dentro del sistema.</li>
              <li>Capacitar a su personal en el uso correcto de la aplicación.</li>
            </ul>
            <p style={modalStyles.text}>El uso inadecuado, incorrecto o incompleto de la plataforma podrá afectar los resultados esperados, sin que ello implique responsabilidad del proveedor.</p>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>4. Licencia de Uso</h3>
            <p style={modalStyles.text}>El servicio se otorga bajo un modelo de licencia de uso mensual, no exclusiva e intransferible, limitada a la cantidad de usuarios y funcionalidades contratadas.</p>
            <p style={modalStyles.text}>El cliente no adquiere propiedad sobre el software, sino únicamente el derecho de uso durante la vigencia del contrato.</p>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>5. Facturación y Pagos</h3>
            <p style={modalStyles.text}>El servicio será facturado de forma periódica según el plan contratado.</p>
            <p style={modalStyles.text}>Las facturas deberán abonarse dentro del plazo establecido en cada comprobante.</p>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>6. Mora y Suspensión del Servicio</h3>
            <p style={modalStyles.text}>En caso de incumplimiento en el pago:</p>
            <ul style={modalStyles.list}>
              <li>A los <strong>10 días corridos desde la fecha de vencimiento</strong>, se notificará al cliente sobre la situación de mora.</li>
              <li>Se otorgará un plazo adicional de <strong>5 días hábiles</strong> para regularizar el pago.</li>
              <li>En caso de persistir el incumplimiento, el servicio podrá ser <strong>suspendido total o parcialmente</strong>.</li>
            </ul>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>7. Baja del Servicio y Penalidades</h3>
            <p style={modalStyles.text}>Si el incumplimiento de pago supera los <strong>25 días corridos desde la fecha de vencimiento</strong>:</p>
            <ul style={modalStyles.list}>
              <li>El servicio podrá ser dado de baja de forma definitiva.</li>
              <li>El proveedor podrá reclamar los <strong>importes adeudados y penalidades correspondientes</strong>, incluyendo el total restante del contrato vigente.</li>
            </ul>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>8. Soporte y Actualizaciones</h3>
            <p style={modalStyles.text}>El servicio incluye soporte técnico y actualizaciones dentro del alcance del plan contratado.</p>
            <p style={modalStyles.text}>El proveedor se reserva el derecho de realizar mejoras, modificaciones o actualizaciones en la plataforma con el objetivo de optimizar su funcionamiento.</p>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>9. Responsabilidad</h3>
            <p style={modalStyles.text}>El cliente acepta que:</p>
            <ul style={modalStyles.list}>
              <li>El sistema es una herramienta tecnológica de apoyo a la gestión operativa.</li>
              <li>El proveedor no será responsable por fallas derivadas del uso indebido del sistema, errores humanos, fallas de conectividad o situaciones externas al control del servicio.</li>
            </ul>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>10. Aceptación</h3>
            <p style={modalStyles.text}>El uso de la plataforma implica la aceptación plena de los presentes Términos y Condiciones.</p>
          </div>
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            <p><strong>Fecha de vigencia:</strong> 24 de Marzo del 2026</p>
            <p><strong>Proveedor:</strong> Centinela - Sistema Inteligente de Control de Seguridad</p>
          </div>
        </div>
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); } .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 168, 255, 0.2); borderRadius: 10px; }`}</style>
    </div>
  );
};

const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div className="glass fade-up" style={modalStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '10px' }}>
              <Lock size={20} color="#38bdf8" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '2px', fontWeight: '900', color: 'white' }}>POLÍTICA DE PRIVACIDAD</h2>
          </div>
          <button onClick={onClose} style={modalStyles.closeBtn}><X size={20} /></button>
        </div>
        <div className="custom-scrollbar" style={modalStyles.content}>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>1. Introducción</h3>
            <p style={modalStyles.text}>La presente Política de Privacidad regula el tratamiento de los datos personales recopilados a través de la plataforma SaaS de gestión operativa de seguridad.</p>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>2. Datos que se recopilan</h3>
            <ul style={modalStyles.list}>
              <li>Datos identificatorios y de contacto.</li>
              <li>Datos de geolocalización (GPS) en tiempo real.</li>
              <li>Información operativa y contenido multimedia.</li>
            </ul>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>3. Finalidad del tratamiento</h3>
            <p style={modalStyles.text}>Gestionar la actividad operativa, proveer monitoreo en tiempo real y mejorar la eficiencia del servicio.</p>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>4. Uso de geolocalización</h3>
            <p style={modalStyles.text}>Verificar presencia en puestos, validar rondas y gestión de emergencias.</p>
          </div>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>5. Compartición de datos</h3>
            <p style={modalStyles.text}>Solo con el cliente contratante y proveedores técnicos necesarios. No se venden datos a terceros.</p>
          </div>
          {/* Versión resumida para ahorrar espacio en este archivo, o versión completa si prefieres */}
          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            <p><strong>Vigencia:</strong> 24 de Marzo del 2026</p>
            <p><strong>Responsable:</strong> Centinela Security</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '20px' },
  modal: { width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '30px', border: '1px solid rgba(0, 168, 255, 0.2)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' },
  header: { padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' },
  closeBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  content: { padding: '30px', overflowY: 'auto', flex: 1 },
  section: { marginBottom: '20px' },
  sectionTitle: { color: '#00a8ff', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' },
  text: { color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '8px' },
  list: { color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', lineHeight: '1.6', paddingLeft: '20px' }
};

const inputStyle = {
  width: '100%',
  padding: '15px 15px 15px 45px',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  color: 'white',
  outline: 'none',
  fontSize: '0.9rem'
};

const buttonStyle = {
  padding: '18px',
  borderRadius: '14px',
  background: 'linear-gradient(135deg, #00d2ff 0%, #00a8ff 100%)',
  color: '#070c1a',
  border: 'none',
  fontWeight: '900',
  letterSpacing: '2px',
  cursor: 'pointer',
  boxShadow: '0 10px 30px rgba(0, 168, 255, 0.3)'
};

export default PasswordChange;
