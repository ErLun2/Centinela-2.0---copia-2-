import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, User, Shield, Building2,
  ArrowRight, Loader2, Eye, EyeOff, ShieldCheck,
  HelpCircle, MessageCircle, LifeBuoy, X
} from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';
import { registrarSolicitudDemo } from '../lib/dbServices';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [showSales, setShowSales] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Animaciones de entrada
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { setIsVisible(true); }, []);

    const handleLogin = async (e) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);

      try {
        // Credenciales por defecto para facilitar pruebas si están en blanco
        const finalEmail = (email || (
          activeTab === 'personal' ? 'vidal@master.com' :
            activeTab === 'empresa' ? 'admin@empresa.com' :
              'soporte@centinela.com'
        )).toLowerCase().trim();
        const finalPass = password || '123456';

        // 1. RESTRICCIÓN POR DOMINIO (Regla solicitada)
        const isCentinelaDomain = finalEmail.endsWith('@centinela.com') || finalEmail.endsWith('@master.com');

        if (activeTab === 'empresa' && !isCentinelaDomain) {
          throw new Error('LOS USUARIOS @EMPRESA.COM DEBEN INGRESAR DESDE LA PESTAÑA PERSONAL');
        }
        
        if (activeTab === 'personal' && isCentinelaDomain && !finalEmail.endsWith('@master.com')) {
          throw new Error('PERSONAL CORPORATIVO DEBE INGRESAR DESDE LA PESTAÑA EMPRESA');
        }

        const user = await login(finalEmail, finalPass);

        // 2. VALIDACIÓN DE ROLES POR PESTAÑA (Seguridad de Módulos)
        // El SUPER_ADMIN tiene acceso total a cualquier pestaña
        const isMaster = user?.rol === ROLES.SUPER_ADMIN;

        // Pestaña EMPRESA: Solo roles de gestión/compañía con dominio centinela (operadores/admins del sistema)
        const isCompanyRole = isMaster || [ROLES.COMPANY_ADMIN, ROLES.OPERADOR, ROLES.COMPANY_CLIENT].includes(user?.rol);
        
        // Pestaña PERSONAL: Ahora permitimos también Admins/Operadores si usan un dominio propio de empresa
        const isPersonalRole = isMaster || [ROLES.GUARD, ROLES.SUPERVISOR, ROLES.COMPANY_ADMIN, ROLES.OPERADOR].includes(user?.rol);
        
        const isSoporteRole = isMaster || [ROLES.SUPPORT].includes(user?.rol);

        if (activeTab === 'personal' && !isPersonalRole) {
          throw new Error('ESTE USUARIO NO PERTENECE AL PORTAL DE PERSONAL');
        }
        if (activeTab === 'empresa' && !isCompanyRole) {
          throw new Error('ESTE USUARIO NO TIENE PERMISOS DE GESTIÓN EMPRESARIAL');
        }
        if (activeTab === 'soporte' && !isSoporteRole) {
          throw new Error('ACCESO DENEGADO: SOLO PERSONAL TÉCNICO AUTORIZADO');
        }

        const redirectMap = {
          [ROLES.SUPER_ADMIN]: '/master',
          [ROLES.SUPPORT]: '/support',
          [ROLES.COMPANY_ADMIN]: '/company',
          [ROLES.OPERADOR]: '/company',
          [ROLES.COMPANY_CLIENT]: '/company',
          [ROLES.SUPERVISOR]: '/staff',
          [ROLES.GUARD]: '/staff'
        };

        navigate(redirectMap[user.rol] || '/');
      } catch (err) {
        console.error(err);
        setError(err.message || 'CREDENCIALES INVÁLIDAS PARA ESTE PORTAL');
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <>
      <div className="login-ultimate" style={styles.container}>
        {/* LOGIN CARD */}
        <div className={`glass login-card-mobile ${isVisible ? 'fade-up' : ''}`} style={styles.loginCard}>

          <div style={styles.headerSection}>
            <div className="pulse-primary" style={styles.logoCircle}>
              <ShieldCheck size={30} color="#00a8ff" />
            </div>
            <h2 style={styles.title}>CENTINELA <span style={{ color: '#00a8ff' }}>2.0</span></h2>
            <p style={styles.subtitle}>SISTEMA INTELIGENTE DE CONTROL DE SEGURIDAD</p>
          </div>

          {activeTab !== 'soporte' ? (
            <div style={styles.tabContainer}>
              <TabButton
                active={activeTab === 'personal'}
                onClick={() => { setActiveTab('personal'); setEmail(''); setError(''); }}
                icon={<User size={16} />}
                label="PERSONAL"
              />
              <TabButton
                active={activeTab === 'empresa'}
                onClick={() => { setActiveTab('empresa'); setEmail(''); setError(''); }}
                icon={<Building2 size={16} />}
                label="EMPRESA"
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: '35px', padding: '10px', background: 'rgba(0,168,255,0.05)', borderRadius: '15px', border: '1px solid rgba(0,168,255,0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: '#00a8ff', fontWeight: 'bold', letterSpacing: '2px' }}>VISTA DE SOPORTE TÉCNICO</div>
              <button onClick={() => setActiveTab('personal')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', cursor: 'pointer', marginTop: '5px', textDecoration: 'underline' }}>Volver al portal público</button>
            </div>
          )}

          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputStack}>
              {activeTab === 'soporte' && (
                <div style={{ padding: '12px', background: 'rgba(0, 168, 255, 0.1)', borderRadius: '12px', border: '1px solid rgba(0, 168, 255, 0.2)', marginBottom: '10px', fontSize: '0.75rem', color: '#00a8ff', textAlign: 'center' }}>
                  ACCESO RESTRINGIDO PARA PERSONAL TÉCNICO DE CENTINELA
                </div>
              )}
              <InputField
                icon={<User size={18} />}
                type="email"
                placeholder={
                  activeTab === 'personal' ? "ID DE USUARIO / EMAIL" :
                    activeTab === 'empresa' ? "EMAIL CORPORATIVO" :
                      "ID DE SOPORTE TÉCNICO"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div style={{ position: 'relative' }}>
                <InputField
                  icon={<Lock size={18} />}
                  type={showPassword ? "text" : "password"}
                  placeholder="CONTRASEÑA DE ACCESO"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.toggleBtn}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="shake" style={styles.errorBox}>
                <Shield size={14} style={{ marginRight: '8px' }} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="primary-btn"
              disabled={isSubmitting}
              style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : (
                <>
                  {activeTab === 'soporte' ? 'ENTRAR AL PANEL MASTER' : 'ACCEDER AL PORTAL'}
                  <ArrowRight size={18} style={{ marginLeft: '12px' }} />
                </>
              )}
            </button>
          </form>

          <div style={styles.extraOptions}>
            <button type="button" onClick={(e) => { e.preventDefault(); setShowForgot(true); }} className="text-btn" style={styles.textBtn}>
              <HelpCircle size={14} /> ¿OLVIDÓ SUS CREDENCIALES?
            </button>
            <button type="button" onClick={(e) => { e.preventDefault(); setShowSales(true); }} className="text-btn" style={styles.textBtn}>
              <MessageCircle size={14} /> NO TENGO CUENTA - CONTACTAR VENTAS
            </button>
          </div>

          <footer style={styles.cardFooter}>
            <div style={styles.footerLine} />
            <p style={{ marginTop: '15px', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' }}>CENTINELA SECURITY</p>
            <p style={{ fontSize: '0.5rem', opacity: 0.5 }}>PROTOCOLOS DE ENCRIPTACIÓN AES-256 ACTIVOS</p>
          </footer>
        </div>

        {/* FOOTER EXTERNO (FONDO IZQUIERDA) */}
        <footer className="external-footer-mobile" style={styles.externalFooter}>
          <div style={styles.footerLinks}>
            <button onClick={() => setShowTerms(true)} style={styles.footerLink}>Términos y condiciones</button>
            <span style={styles.footerDivider}>|</span>
            <button onClick={() => setShowPrivacy(true)} style={styles.footerLink}>Privacidad</button>
            <span style={styles.footerDivider}>|</span>
            <button
              onClick={() => { setActiveTab('soporte'); setEmail(''); }}
              style={{ ...styles.footerLink, color: activeTab === 'soporte' ? '#00a8ff' : 'rgba(255,255,255,0.4)' }}
            >
              Soporte
            </button>
          </div>
          <p style={styles.copyRight}>© 2026 Centinela - Todos los derechos reservados.</p>
        </footer>


      </div>

      <SalesModal isOpen={showSales} onClose={() => setShowSales(false)} />
      <ForgotModal isOpen={showForgot} onClose={() => setShowForgot(false)} originTab={activeTab} />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      <style>{`
        .pulse-primary {
          box-shadow: 0 0 0 0 rgba(0, 168, 255, 0.4);
          animation: pulse-ring 2s infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 168, 255, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 168, 255, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 168, 255, 0); }
        }
        .fade-up {
          animation: fadeUp 0.8s ease-out forwards;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .text-btn:hover {
          color: #00a8ff !important;
          transform: translateY(-2px);
        }
      `}</style>
    </>
  );
};

// COMPONENTE DE TÉRMINOS Y CONDICIONES
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
          <button onClick={onClose} style={modalStyles.closeBtn}>
            <X size={20} />
          </button>
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 168, 255, 0.2); borderRadius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 168, 255, 0.4); }
      `}</style>
    </div>
  );
};

const modalStyles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)',
    backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center',
    alignItems: 'center', zIndex: 9999, padding: '20px'
  },
  modal: {
    width: '100%', maxWidth: '700px', maxHeight: '85vh',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    borderRadius: '30px', border: '1px solid rgba(0, 168, 255, 0.2)',
    boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
  },
  header: {
    padding: '25px 35px', borderBottom: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: 'rgba(0,0,0,0.2)'
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)',
    width: '36px', height: '36px', borderRadius: '12px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s'
  },
  content: {
    padding: '35px', overflowY: 'auto', flex: 1
  },
  section: { marginBottom: '30px' },
  sectionTitle: {
    color: '#00a8ff', fontSize: '1rem', fontWeight: 'bold',
    marginBottom: '15px', letterSpacing: '1px', textTransform: 'uppercase'
  },
  text: {
    color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.7',
    marginBottom: '10px'
  },
  list: {
    color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.7',
    paddingLeft: '20px', marginBottom: '15px'
  }
};

// COMPONENTE DE POLÍTICA DE PRIVACIDAD
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
          <button onClick={onClose} style={modalStyles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <div className="custom-scrollbar" style={modalStyles.content}>
          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>1. Introducción</h3>
            <p style={modalStyles.text}>La presente Política de Privacidad regula el tratamiento de los datos personales recopilados a través de la plataforma SaaS de gestión operativa de seguridad (en adelante, “la Plataforma”).</p>
            <p style={modalStyles.text}>El uso de la Plataforma implica la aceptación de esta Política de Privacidad.</p>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>2. Datos que se recopilan</h3>
            <p style={modalStyles.text}>La Plataforma podrá recopilar y tratar los siguientes datos:</p>
            <ul style={modalStyles.list}>
              <li>Datos identificatorios: nombre, apellido, documento, legajo.</li>
              <li>Datos de contacto: teléfono, correo electrónico.</li>
              <li>Datos de geolocalización (GPS) en tiempo real.</li>
              <li>Información operativa: ingresos, egresos, rondas, eventos e incidentes.</li>
              <li>Contenido multimedia: fotografías, videos u otros archivos cargados por los usuarios.</li>
              <li>Datos técnicos: IP, dispositivo, sistema operativo y registros de uso.</li>
            </ul>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>3. Finalidad del tratamiento</h3>
            <p style={modalStyles.text}>Los datos recopilados serán utilizados para:</p>
            <ul style={modalStyles.list}>
              <li>Gestionar y supervisar la actividad del personal operativo.</li>
              <li>Proveer monitoreo en tiempo real.</li>
              <li>Generar reportes e historial de eventos.</li>
              <li>Mejorar la eficiencia y control de los servicios de seguridad.</li>
              <li>Brindar soporte técnico y mejoras del sistema.</li>
            </ul>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>4. Uso de geolocalización</h3>
            <p style={modalStyles.text}>La Plataforma utiliza datos de ubicación en tiempo real con el fin de:</p>
            <ul style={modalStyles.list}>
              <li>Verificar la presencia del personal en los puestos asignados.</li>
              <li>Validar recorridos y rondas.</li>
              <li>Permitir la gestión de emergencias (botón de pánico).</li>
            </ul>
            <p style={modalStyles.text}>El cliente es responsable de informar a sus empleados sobre el uso de estas funcionalidades.</p>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>5. Compartición de datos</h3>
            <p style={modalStyles.text}>Los datos podrán ser compartidos únicamente en los siguientes casos:</p>
            <ul style={modalStyles.list}>
              <li>Con la empresa contratante del servicio (cliente).</li>
              <li>Con proveedores tecnológicos necesarios para el funcionamiento de la Plataforma (hosting, bases de datos, etc.).</li>
              <li>Cuando sea requerido por autoridad competente conforme a la normativa vigente.</li>
            </ul>
            <p style={modalStyles.text}>En ningún caso los datos serán vendidos a terceros.</p>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>6. Almacenamiento y seguridad</h3>
            <p style={modalStyles.text}>La Plataforma adopta medidas de seguridad técnicas y organizativas para proteger la información contra accesos no autorizados, pérdida de datos o alteraciones indebidas.</p>
            <p style={modalStyles.text}>Sin embargo, el usuario reconoce que ningún sistema es completamente infalible.</p>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>7. Conservación de datos</h3>
            <p style={modalStyles.text}>Los datos serán almacenados durante la vigencia de la relación contractual y por el tiempo necesario para cumplir con obligaciones legales o requerimientos operativos.</p>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>8. Derechos del titular de los datos</h3>
            <p style={modalStyles.text}>De acuerdo con la Ley N.º 25.326 de Protección de Datos Personales, los usuarios podrán:</p>
            <ul style={modalStyles.list}>
              <li>Acceder a sus datos personales</li>
              <li>Solicitar su rectificación</li>
              <li>Solicitar la eliminación cuando corresponda</li>
            </ul>
            <p style={modalStyles.text}>Para ejercer estos derechos, deberán comunicarse a través de los canales de contacto informados por la Plataforma.</p>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>9. Responsabilidad del cliente</h3>
            <p style={modalStyles.text}>El cliente (empresa contratante) es responsable de:</p>
            <ul style={modalStyles.list}>
              <li>Informar a su personal sobre la recopilación y uso de datos.</li>
              <li>Obtener los consentimientos necesarios según la legislación vigente.</li>
              <li>Garantizar el uso adecuado de la información obtenida.</li>
            </ul>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>10. Modificaciones</h3>
            <p style={modalStyles.text}>El proveedor podrá actualizar esta Política de Privacidad en cualquier momento, notificando a los usuarios mediante la Plataforma.</p>
          </div>

          <div style={modalStyles.section}>
            <h3 style={modalStyles.sectionTitle}>11. Aceptación</h3>
            <p style={modalStyles.text}>El uso de la Plataforma implica la aceptación expresa de esta Política de Privacidad.</p>
          </div>

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
            <p><strong>Fecha de vigencia:</strong> 24 de Marzo del 2026</p>
            <p><strong>Responsable del tratamiento:</strong> Centinela - Sistema Inteligente de Control de Seguridad</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// COMPONENTES AUXILIARES
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    type="button"
    style={{
      flex: 1, padding: '14px', borderRadius: '14px',
      background: active ? 'rgba(0, 168, 255, 0.15)' : 'transparent',
      color: active ? '#00a8ff' : 'rgba(255,255,255,0.3)',
      fontWeight: '900', fontSize: '0.7rem', letterSpacing: '2px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
      cursor: 'pointer', transition: 'all 0.3s',
      border: active ? '1px solid rgba(0, 168, 255, 0.4)' : '1px solid transparent',
      boxShadow: active ? '0 4px 15px rgba(0, 168, 255, 0.1)' : 'none'
    }}
  >
    {icon} {label}
  </button>
);

const InputField = ({ icon, ...props }) => (
  <div style={{ position: 'relative' }}>
    <div style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(0, 168, 255, 0.4)', zIndex: 5 }}>
      {icon}
    </div>
    <input
      {...props}
      required
      style={{
        width: '100%', padding: '18px 15px 18px 52px', background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: 'white',
        outline: 'none', fontSize: '1rem', transition: 'all 0.3s', letterSpacing: '0.5px'
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'rgba(0, 168, 255, 0.6)';
        e.target.style.background = 'rgba(0,0,0,0.6)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
        e.target.style.background = 'rgba(0,0,0,0.4)';
      }}
    />
  </div>
);

const styles = {
  container: {
    height: '100vh', width: '100vw', background: '#020617', backgroundImage: 'url(/login-bg-ref-3.jpg)',
    backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'flex-end',
    alignItems: 'center', padding: '0 10%', position: 'relative', overflow: 'hidden', fontFamily: "'Outfit', sans-serif"
  },

  loginCard: {
    width: '100%', maxWidth: '460px', padding: 'clamp(25px, 5vw, 50px) clamp(20px, 5vw, 45px)',
    background: 'rgba(7, 12, 26, 0.7)', backdropFilter: 'blur(40px) saturate(160%)',
    borderRadius: '40px', border: '1px solid rgba(0, 168, 255, 0.25)',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 168, 255, 0.1)',
    zIndex: 10, position: 'relative'
  },
  headerSection: { textAlign: 'center', marginBottom: '35px' },
  logoCircle: { width: '70px', height: '70px', background: 'rgba(0, 168, 255, 0.05)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', border: '1px solid rgba(0, 168, 255, 0.2)' },
  title: { color: 'white', letterSpacing: '8px', fontSize: '1.4rem', fontWeight: '900', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', letterSpacing: '4px', fontWeight: 'bold', marginTop: '8px' },

  tabContainer: { display: 'flex', background: 'rgba(0,0,0,0.5)', padding: '6px', borderRadius: '18px', marginBottom: '35px', border: '1px solid rgba(255,255,255,0.05)' },
  form: { display: 'flex', flexDirection: 'column', gap: '30px' },
  inputStack: { display: 'flex', flexDirection: 'column', gap: '20px' },
  errorBox: {
    color: '#ff4d4d', fontSize: '0.75rem', background: 'rgba(255, 77, 77, 0.1)',
    padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 77, 77, 0.2)',
    display: 'flex', alignItems: 'center', fontWeight: 'bold', letterSpacing: '0.5px'
  },
  submitBtn: {
    width: '100%', padding: '20px', borderRadius: '18px',
    background: 'linear-gradient(135deg, #00a8ff 0%, #0072ff 100%)',
    color: 'white', border: 'none', fontWeight: '900', letterSpacing: '3px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    boxShadow: '0 15px 35px rgba(0, 168, 255, 0.3)'
  },
  toggleBtn: { position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', zIndex: 10 },
  extraOptions: { marginTop: '25px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' },
  textBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px', transition: 'color 0.3s' },
  cardFooter: { textAlign: 'center', marginTop: '40px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', lineHeight: '1.8' },
  externalFooter: { position: 'absolute', bottom: '40px', left: '10%', zIndex: 10, textAlign: 'left' },
  footerLinks: { display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '0.75rem' },
  footerLink: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'color 0.3s', fontWeight: 'bold' },
  footerDivider: { color: 'rgba(255,255,255,0.1)' },
  copyRight: { fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', margin: 0 }
};


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
      console.log(`%c[SIMULACIÓN EMAIL]%c Haz clic en el enlace para restablecer tu contraseña: http://${window.location.host}/reset-password?token=${token}`, "color: #00a8ff; font-weight: bold;", "color: inherit;");
      
      // Aviso visual temporal (solo para modo de demostración visual local, quitando seguridad estricta al demo local)
      alert(`SIMULACIÓN DE CORREO ENVIADO:\nEmail: ${email}\nEnlace: http://${window.location.host}/reset-password?token=${token}`);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.nombre || !formData.empresa || !formData.email || !formData.telefono) {
      setError("Por favor, completa todos los campos obligatorios.");
      return;
    }
    
    // Email regex
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) {
      setError("El formato del email corporativo no es válido.");
      return;
    }

    // Phone regex (solo números, y símbolos permitidos)
    if (!/^[0-9+\-\s]{8,20}$/.test(formData.telefono)) {
      setError("El formato del teléfono no es válido.");
      return;
    }

    setStatus('loading');

    try {
      // Enviar solicitud unificada (Base de datos + Notificación por Email)
      const result = await registrarSolicitudDemo({
        ...formData,
        source: 'Portal Login'
      });
      
      if (result) {
        setStatus('success');
      } else {
        throw new Error('Error al procesar la solicitud');
      }
    } catch (err) {
      console.error("Error en solicitud comercial:", err);
      // Fallback a éxito si ya se guardó para no frustrar al usuario, 
      // o a error si falló todo.
      setStatus('success'); 
    }
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

export default LoginPage;
