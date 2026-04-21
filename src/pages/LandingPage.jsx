import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Layout, Users, Smartphone, BarChart3, Lock, Headphones, X, ShieldCheck, 
  MapPin, Clock, QrCode, ShieldAlert, CheckCircle, ArrowRight, MousePointer2, 
  Zap, ChevronRight, Eye, Target, Search, Globe, Activity
} from 'lucide-react';
import { registrarSolicitudDemo } from '../lib/dbServices';

const LandingPage = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="landing-page" style={{ background: '#020617', color: 'white', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navigation */}
      <nav className="glass" style={{ margin: '20px', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: '20px', zIndex: 1000, borderRadius: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div className="firefly-container" style={{ width: '86px', height: '86px' }}>
            <img src="/logo-new.png" alt="Logo" className="logo-isotipo" style={{ height: '72px', width: 'auto' }} />
            <div className="firefly" style={{ '--x': '15px', '--y': '-10px', '--d': '3s' }}></div>
          </div>
          <span className="mobile-hide" style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '2px', color: 'white' }}>CENTINELA</span>
        </div>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <a 
            href="#nosotros" 
            className="mobile-hide"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('nosotros').scrollIntoView({ behavior: 'smooth' });
            }}
            style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}
          >
            Nosotros
          </a>
          <a href="#features" className="mobile-hide" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>Funciones</a>
          <Link to="/login">
            <button className="primary" style={{ padding: '10px 25px', borderRadius: '12px' }}>Ingresar</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '60px 20px', position: 'relative', overflow: 'hidden' }}>
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div className="firefly-container" style={{ width: '260px', height: '260px', marginBottom: '-20px' }}>
                <img src="/logo-new.png" alt="Centinela Emblem" className="logo-isotipo" style={{ height: '202px', width: 'auto' }} />
                <div className="firefly" style={{ '--x': '60px', '--y': '-40px', '--d': '3s' }}></div>
                <div className="firefly" style={{ '--x': '-50px', '--y': '50px', '--d': '4s' }}></div>
            </div>
            <span style={{ fontSize: '1.725rem', fontWeight: '900', letterSpacing: '8px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>CENTINELA</span>
        </div>

        <h1 className="fade-in hero-title" style={{ fontSize: 'clamp(1.75rem, 4.2vw, 3.15rem)', marginBottom: '24px', maxWidth: '1000px', lineHeight: 1.1, animationDelay: '0.1s', fontWeight: '900' }}>
            El Futuro de la <span className="gradient-text" style={{ background: 'linear-gradient(90deg, #00a8ff, #00ffcc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Seguridad Inteligente</span>
        </h1>
        
        <p className="fade-in hero-p" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', maxWidth: '800px', marginBottom: '48px', animationDelay: '0.2s', lineHeight: 1.6, fontWeight: '500' }}>
            Supervisá guardias, recorridos y asistencia desde un solo panel. <br className="mobile-hide" /> Sin planillas. Sin errores. Con evidencia real y trazabilidad absoluta.
        </p>

        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', maxWidth: '1000px', marginBottom: '60px', width: '100%', padding: '0 20px' }}>
            <Bullet text="Asistencia Real" icon={<CheckCircle size={18} />} />
            <Bullet text="GPS 24/7" icon={<MapPin size={18} />} />
            <Bullet text="Rondas QR" icon={<QrCode size={18} />} />
            <Bullet text="Alertas Críticas" icon={<ShieldAlert size={18} />} />
        </div>

        <div className="fade-in" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to="/login">
                <button className="primary" style={{ padding: '18px 45px', fontSize: '1.1rem', borderRadius: '16px', boxShadow: '0 0 30px rgba(0,168,255,0.4)' }}>Comenzar Ahora</button>
            </Link>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>Accedé a tu panel de control</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
                className="secondary" 
                onClick={() => setShowDemo(true)}
                style={{ padding: '18px 45px', fontSize: '1.1rem', borderRadius: '16px', border: '1px solid rgba(0,168,255,0.5)', background: 'rgba(0,168,255,0.1)' }}
            >
                Solicitar Demo
            </button>
            <span style={{ fontSize: '0.75rem', color: '#00a8ff', fontWeight: 'bold' }}>Probá Centinela gratis por 15 días en tu empresa</span>
          </div>
        </div>
        
        <p className="fade-in" style={{ 
            marginTop: '80px', 
            fontSize: '1.1rem', 
            fontWeight: '900', 
            letterSpacing: '5px', 
            color: '#00a8ff', 
            textShadow: '0 0 20px rgba(0, 168, 255, 0.4)',
            animationDelay: '0.6s' 
        }}>
            SIN INSTALACIÓN • ACCESO INMEDIATO • 100% CLOUD
        </p>
      </section>

      {/* DEMO VISUAL (NUEVA) */}
      <section id="demo" className="container" style={{ padding: '100px 20px', background: 'linear-gradient(0deg, #020617 0%, #0f172a 50%, #020617 100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '15px' }}>Así funciona Centinela</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem' }}>Visualizá en tiempo real todo lo que sucede en tu operación</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
            <DemoCard 
                image="/dashboard.png" 
                title="Dashboard Operativo" 
                desc="Gestión centralizada de toda tu operación desde una sola vista." 
            />
            <DemoCard 
                image="/monitoreo.png" 
                title="Monitoreo Táctico" 
                desc="Ubicación real de todos tus guardias y objetivos en un mapa dinámico." 
            />
            <DemoCard 
                image="/gestion-personal.png" 
                title="Gestión de Personal" 
                desc="Control total de asistencias, perfiles y estados de cada integrante del equipo." 
            />
        </div>
      </section>

      {/* PROBLEMAS (NUEVA) */}
      <section style={{ padding: '100px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', textAlign: 'center', marginBottom: '60px' }}>¿Qué problemas resolvemos?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <ProblemItem text="No sabés si el guardia está en su puesto" />
            <ProblemItem text="Falta de control sobre recorridos" />
            <ProblemItem text="Uso de planillas manuales" />
            <ProblemItem text="Demoras en el envío de reportes" />
            <ProblemItem text="Falta de visibilidad en tiempo real" />
        </div>
      </section>

      {/* SOLUCIÓN */}
      <section style={{ padding: '100px 20px', background: 'rgba(0,168,255,0.02)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '60px', alignItems: 'center' }}>
            <div>
                <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '25px', lineHeight: 1.1 }}>Todo el control en una sola plataforma</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '30px' }}>
                    Centinela centraliza la gestión operativa de seguridad, brindando control, trazabilidad y visibilidad total de tus objetivos en tiempo real.
                </p>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ padding: '15px', background: 'rgba(0,168,255,0.1)', borderRadius: '15px', border: '1px solid rgba(0,168,255,0.2)' }}>
                        <BarChart3 size={40} color="#00a8ff" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Trazabilidad Garantizada</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>Reportes automáticos y evidencia digital inalterable.</p>
                    </div>
                </div>
            </div>
            <div className="glass" style={{ borderRadius: '30px', overflow: 'hidden', border: '1px solid rgba(0,168,255,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                <img src="/monitoreo.png" alt="Monitoreo Mapa" style={{ width: '100%', display: 'block' }} />
            </div>
        </div>
      </section>

      {/* FUNCIONALIDADES (REEMPLAZAR ECOSISTEMA) */}
      <section id="features" className="container" style={{ padding: '120px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: '900', marginBottom: '80px' }}>Funcionalidades clave</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
          <FeatureCardSmall 
             image="/monitoreo.png"
             title="Monitoreo en tiempo real" 
             desc="Visualizá todos los objetivos en el mapa operativo dinámico." 
          />
          <FeatureCardSmall 
             image="/gestion-personal.png"
             title="Gestión de personal" 
             desc="Administrá guardias, estados y roles fácilmente desde un panel central." 
          />
          <FeatureCardSmall 
             image="/planificacion.png"
             title="Planificación de turnos" 
             desc="Asigná horarios y objetivos en segundos con nuestro gestor visual." 
          />
          <FeatureCardSmall 
             image="/rondas.png"
             title="Rondas con QR" 
             desc="Verificá recorridos con evidencia real y lectura satelital obligatoria." 
          />
          <FeatureCardSmall 
             image="/reportes.png"
             title="Reportes y novedades" 
             desc="Registrá y consultá eventos, imágenes y videos en tiempo real." 
          />
        </div>
      </section>

      {/* BENEFICIOS */}
      <section style={{ padding: '100px 20px', background: 'linear-gradient(180deg, #020617 0%, #00a8ff08 100%)' }}>
          <div className="container" style={{ maxWidth: '900px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '60px' }}>¿Por qué elegir Centinela?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
                <Benefit text="Control total de la operación" />
                <Benefit text="Reducción de errores operativos" />
                <Benefit text="Información en tiempo real" />
                <Benefit text="Mayor transparencia con clientes" />
                <Benefit text="Escalable para múltiples objetivos" />
            </div>
          </div>
      </section>

      {/* SECCIÓN: NOSOTROS (SOBRE CENTINELA) */}
      <section id="nosotros" style={{ padding: '120px 20px', background: 'linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)' }}>
          <div className="container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            
            {/* 1. HEADER PRINCIPAL */}
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#00a8ff', letterSpacing: '4px', marginBottom: '20px', textTransform: 'uppercase', textShadow: '0 0 20px rgba(0,168,255,0.4)' }}>Sobre Centinela</h2>
                <h3 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '24px', lineHeight: '1.1' }}>Tecnología diseñada para transformar la gestión de seguridad en empresas modernas.</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
                  Centinela es una plataforma creada para digitalizar, automatizar y supervisar operaciones de seguridad en tiempo real. Eliminamos procesos manuales y brindamos control total desde un único panel.
                </p>
            </div>

            {/* 2. BLOQUE PROBLEMA / SOLUCIÓN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '40px', marginBottom: '80px' }}>
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', border: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.02)' }}>
                    <div style={{ color: '#ef4444', marginBottom: '20px' }}><ShieldAlert size={32} /></div>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '15px' }}>El Problema</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', fontSize: '1.05rem' }}>
                      La gestión tradicional de seguridad depende de planillas, controles manuales y reportes poco confiables. Esto genera errores, falta de trazabilidad y pérdida de control operativo.
                    </p>
                </div>
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', border: '1px solid rgba(16,185,129,0.1)', background: 'rgba(16,185,129,0.02)' }}>
                    <div style={{ color: '#10b981', marginBottom: '20px' }}><CheckCircle size={32} /></div>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '15px' }}>Nuestra Solución</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', fontSize: '1.05rem' }}>
                      Centinela centraliza toda la operación en una única plataforma, generando evidencia en tiempo real y permitiendo una supervisión inteligente desde cualquier lugar.
                    </p>
                </div>
            </div>

            {/* 3. MISIÓN Y VISIÓN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '80px' }}>
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#00a8ff', marginBottom: '20px' }}><Target size={32} /></div>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '15px' }}>Misión</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }}>
                      Brindar herramientas digitales que permitan controlar, supervisar y optimizar operaciones de seguridad con precisión, eficiencia y total trazabilidad.
                    </p>
                </div>
                <div className="glass" style={{ padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ color: '#00ffcc', marginBottom: '20px' }}><Globe size={32} /></div>
                    <h4 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '15px' }}>Visión</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }}>
                      Convertirnos en el estándar tecnológico de la industria de seguridad en Latinoamérica, impulsando la transformación digital del sector.
                    </p>
                </div>
            </div>

            {/* 4. VALORES */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '100px' }}>
                <ValueItem icon={<Search />} title="Transparencia" text="Cada acción queda registrada y es auditable." />
                <ValueItem icon={<ShieldCheck />} title="Confiabilidad" text="Plataforma estable diseñada para operar 24/7." />
                <ValueItem icon={<Zap />} title="Innovación" text="Evolución constante basada en tecnología real." />
                <ValueItem icon={<MousePointer2 />} title="Control" text="Información clara para decisiones rápidas." />
            </div>

            {/* 5. DIFERENCIAL */}
            <div className="glass fade-up" style={{ 
                padding: '60px', 
                borderRadius: '32px', 
                border: '1px solid rgba(0,168,255,0.3)', 
                background: 'radial-gradient(circle at top right, rgba(0,168,255,0.1), transparent), rgba(255,255,255,0.01)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                textAlign: 'center'
            }}>
                <h4 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '25px' }}>¿Qué nos diferencia?</h4>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', lineHeight: '1.8', maxWidth: '850px', margin: '0 auto' }}>
                  A diferencia de soluciones tradicionales, Centinela no solo registra información: la transforma en control operativo real. Nuestra plataforma permite supervisar en tiempo real, generar evidencia automática y reducir errores humanos al mínimo.
                </p>
            </div>

          </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ padding: '100px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '40px' }}>Empezá a gestionar tu operación con control total.</h2>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setShowDemo(true)}
                  className="primary" 
                  style={{ padding: '20px 60px', fontSize: '1.2rem', borderRadius: '18px', boxShadow: '0 0 30px rgba(0,168,255,0.4)', background: 'linear-gradient(90deg, #00a8ff, #00d2ff)' }}
                >
                  Solicitar Demo
                </button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '60px 20px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="footer-links" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', fontSize: '0.9rem' }}>
          <button onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Términos y Condiciones</button>
          <button onClick={() => setShowPrivacy(true)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Privacidad</button>
          <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Soporte Técnico</Link>
        </div>
        <p>© 2026 Centinela Security - Todos los derechos reservados.</p>
        <p style={{ marginTop: '10px', fontSize: '1.02rem', opacity: 0.7 }}>Contacto: info@centinela-security.com</p>
      </footer>

      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <DemoModal isOpen={showDemo} onClose={() => setShowDemo(false)} />
    </div>
  );
};

const Bullet = ({ text, icon }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ color: '#00ffcc' }}>{icon}</div>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>{text}</span>
    </div>
);

const DemoCard = ({ image, title, desc }) => (
    <div className="glass" style={{ borderRadius: '25px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', transition: '0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
        <div style={{ height: '220px', background: '#000', overflow: 'hidden' }}>
            <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
        </div>
        <div style={{ padding: '25px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>{title}</h3>
            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{desc}</p>
        </div>
    </div>
);

const ProblemItem = ({ text }) => (
    <div className="glass" style={{ padding: '25px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '50%', display: 'flex' }}><X size={18} /></div>
        <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}>{text}</span>
    </div>
);

const FeatureCardSmall = ({ image, title, desc }) => (
    <div className="glass" style={{ padding: '20px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ height: '180px', borderRadius: '15px', overflow: 'hidden', marginBottom: '20px' }}>
            <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>{title}</h4>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{desc}</p>
    </div>
);

const Benefit = ({ text }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        <div style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '50%' }}><CheckCircle size={24} /></div>
        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', lineHeight: 1.4 }}>{text}</span>
    </div>
);

const ValueItem = ({ icon, title, text }) => (
  <div className="glass" style={{ padding: '30px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ color: '#00a8ff', marginBottom: '15px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
    <h5 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>{title}</h5>
    <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>{text}</p>
  </div>
);

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
             <h3 style={modalStyles.sectionTitle}>1. Aceptación de los Términos</h3>
             <p style={modalStyles.text}>Al acceder y utilizar la plataforma Centinela ("el Servicio"), usted acepta estar sujeto a estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={modalStyles.sectionTitle}>2. Descripción del Servicio</h3>
             <p style={modalStyles.text}>Centinela es una solución SaaS (Software as a Service) diseñada para la gestión operativa, supervisión y control de personal de seguridad en tiempo real. El servicio incluye monitoreo GPS, gestión de rondas QR, reportes de novedades y paneles analíticos.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={modalStyles.sectionTitle}>3. Responsabilidad del Usuario</h3>
             <p style={modalStyles.text}>El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta. Se compromete a utilizar el servicio de manera lícita y profesional.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={modalStyles.sectionTitle}>4. Propiedad Intelectual</h3>
             <p style={modalStyles.text}>Todos los derechos de propiedad intelectual sobre el software, diseño, logotipos y algoritmos de Centinela son propiedad exclusiva de Centinela Security. Queda prohibida la reproducción o distribución no autorizada.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={modalStyles.sectionTitle}>5. Modificaciones del Servicio</h3>
             <p style={modalStyles.text}>Nos reservamos el derecho de actualizar, modificar o discontinuar cualquier aspecto del servicio en cualquier momento. Los cambios sustanciales serán notificados a los administradores.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={modalStyles.sectionTitle}>6. Pagos y Suscripciones</h3>
             <p style={modalStyles.text}>El acceso al servicio está sujeto al pago puntual del plan seleccionado. El incumplimiento en el pago resultará en la suspensión temporal de la plataforma hasta la regularización del mismo.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={modalStyles.sectionTitle}>7. Cancelación y Terminación</h3>
             <p style={modalStyles.text}>El cliente puede cancelar su suscripción en cualquier momento. Centinela se reserva el derecho de terminar el servicio por uso indebido o violación de las normas de seguridad del software.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={modalStyles.sectionTitle}>8. Limitación de Responsabilidad</h3>
             <p style={modalStyles.text}>Centinela provee herramientas de gestión, pero no es responsable por fallas externas de conectividad, hardware del usuario o decisiones operativas tomadas basadas en los reportes del sistema.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={modalStyles.sectionTitle}>9. Indemnización</h3>
             <p style={modalStyles.text}>El usuario acepta defender e indemnizar a Centinela ante cualquier reclamación derivada de su uso negligente o ilegal del software o de la violación de estos términos.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={modalStyles.sectionTitle}>10. Ley Aplicable y Jurisdicción</h3>
             <p style={modalStyles.text}>Estos términos se rigen por las leyes vigentes del país de operación principal de Centinela Security. Cualquier disputa se resolverá ante los tribunales competentes de dicha jurisdicción.</p>
           </div>
           <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <button onClick={onClose} className="primary" style={{ padding: '10px 30px', borderRadius: '10px' }}>Entendido</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const DemoModal = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    telefono: '',
    email: '',
    guardias: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      // Enviar solicitud a través del servicio centralizado (Base de datos + Email)
      const result = await registrarSolicitudDemo(formData);

      if (result) {
        setStatus('success');
        setFormData({ nombre: '', empresa: '', telefono: '', email: '', guardias: '' });
        setTimeout(() => onClose(), 3000);
      } else {
        throw new Error('Error al enviar la solicitud');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al procesar la solicitud');
      setStatus('error');
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div className="glass fade-up" style={{ ...modalStyles.modal, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={modalStyles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '8px', background: 'rgba(0, 168, 255, 0.1)', borderRadius: '10px' }}>
                  <ShieldCheck size={20} color="#00a8ff" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'white' }}>Solicitar Demo Personalizada</h2>
                </div>
            </div>
            <button onClick={onClose} style={modalStyles.closeBtn}><X size={20} /></button>
        </div>
        
        <div style={modalStyles.content}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ color: '#10b981', marginBottom: '20px' }}><CheckCircle size={60} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>¡Solicitud enviada!</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>Solicitud enviada correctamente. Nos pondremos en contacto en breve para coordinar tu demo.</p>
            </div>
          ) : (
            <>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '30px', lineHeight: 1.5 }}>
                Coordiná una demostración guiada de Centinela y descubrí cómo optimizar tu operación de seguridad.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <InputGroup label="Nombre" value={formData.nombre} onChange={val => setFormData({...formData, nombre: val})} required />
                  <InputGroup label="Empresa" value={formData.empresa} onChange={val => setFormData({...formData, empresa: val})} required />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <InputGroup label="Teléfono" type="tel" value={formData.telefono} onChange={val => setFormData({...formData, telefono: val})} required />
                  <InputGroup label="Email" type="email" value={formData.email} onChange={val => setFormData({...formData, email: val})} required />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>Cantidad de guardias</label>
                  <select 
                    required
                    value={formData.guardias}
                    onChange={e => setFormData({...formData, guardias: e.target.value})}
                    style={{ ...inputStyles, cursor: 'pointer', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
                  >
                    <option value="" disabled style={{ background: '#0f172a', color: 'white' }}>Seleccionar opción...</option>
                    <option value="50" style={{ background: '#0f172a', color: 'white' }}>50</option>
                    <option value="100" style={{ background: '#0f172a', color: 'white' }}>100</option>
                    <option value="150" style={{ background: '#0f172a', color: 'white' }}>150</option>
                    <option value="+200" style={{ background: '#0f172a', color: 'white' }}>+200</option>
                  </select>
                </div>

                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <button 
                    type="submit" 
                    className="primary" 
                    disabled={status === 'loading'}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold', boxShadow: '0 0 20px rgba(0,168,255,0.3)' }}
                  >
                    {status === 'loading' ? 'Enviando...' : 'Coordinar Demo'}
                  </button>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '12px', fontWeight: '500' }}>
                    Respuesta en menos de 24hs
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const InputGroup = ({ label, type = "text", value, onChange, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)' }}>{label}</label>
    <input 
      type={type}
      required={required}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={inputStyles}
      placeholder={label}
    />
  </div>
);

const inputStyles = {
  background: 'rgba(2, 6, 23, 0.8)', // Fondo más opaco para evitar transparencias extrañas
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  padding: '12px 15px',
  color: 'white',
  fontSize: '0.9rem',
  outline: 'none',
  transition: '0.3s'
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
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>1. Recopilación de Información</h3>
             <p style={modalStyles.text}>Recopilamos información necesaria para la prestación del servicio, incluyendo datos de geolocalización en tiempo real (GPS) mientras la aplicación de personal está en uso, registros de actividad y evidencia operativa.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>2. Uso de los Datos</h3>
             <p style={modalStyles.text}>Los datos se utilizan para: supervisión de seguridad, generación de reportes automáticos, auditoría de cumplimiento y mejora de la seguridad operativa de nuestros clientes.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>3. Protección de Datos</h3>
             <p style={modalStyles.text}>Implementamos cifrado SSL y medidas de seguridad industrial para proteger la información contra accesos no autorizados y garantizar la integridad de los datos almacenados.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>4. Confidencialidad</h3>
             <p style={modalStyles.text}>Centinela Security no vende ni comercializa datos personales o corporativos a terceros. El acceso está limitado exclusivamente a los usuarios autorizados por la empresa cliente.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>5. Cookies y Seguimiento</h3>
             <p style={modalStyles.text}>Utilizamos cookies técnicas necesarias para mantener la sesión activa y mejorar la experiencia de navegación en nuestros paneles administrativos.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>6. Derechos del Usuario (ARCO)</h3>
             <p style={modalStyles.text}>Los usuarios tienen derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos. Estas solicitudes deben gestionarse a través del administrador de la empresa cliente.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>7. Retención de Datos</h3>
             <p style={modalStyles.text}>Los datos operativos se mantienen durante el tiempo que dure la relación contractual, tras la cual podrán ser eliminados o anonimizados según el plan contratado.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>8. Transferencia de Datos</h3>
             <p style={modalStyles.text}>En caso de utilizar servidores de terceros (Cloud), garantizamos que estos cumplan con normativas internacionales de protección de datos personales.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>9. Menores de Edad</h3>
             <p style={modalStyles.text}>Nuestros servicios están dirigidos exclusivamente a mayores de edad involucrados en actividades profesionales de seguridad privada.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>10. Cambios en la Política</h3>
             <p style={modalStyles.text}>Nos reservamos el derecho de actualizar esta política para reflejar cambios legales o ajustes en la operativa del software.</p>
           </div>
           <div style={modalStyles.section}>
             <h3 style={{ ...modalStyles.sectionTitle, color: '#38bdf8' }}>11. Contacto</h3>
             <p style={modalStyles.text}>Para cualquier consulta relacionada con la privacidad de sus datos, puede contactarnos a través de los canales oficiales de soporte técnico de Centinela.</p>
           </div>
           <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
             <button onClick={onClose} className="secondary" style={{ padding: '10px 30px', borderRadius: '10px', border: '1px solid #38bdf8', color: '#38bdf8' }}>Cerrar</button>
           </div>
        </div>
      </div>
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
    width: '100%', maxWidth: '750px', maxHeight: '85vh',
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
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
  },
  content: {
    padding: '35px', overflowY: 'auto', flex: 1
  },
  section: { marginBottom: '30px' },
  sectionTitle: { color: '#00a8ff', fontSize: '1rem', fontWeight: 'bold', marginBottom: '15px' },
  text: { color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', lineHeight: '1.7' }
};

export default LandingPage;
