import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, ShieldCheck, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenEmail, setTokenEmail] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError("Enlace de recuperación inválido o inexistente.");
      return;
    }
    const tokens = JSON.parse(localStorage.getItem('centinela_reset_tokens') || '[]');
    const matchingToken = tokens.find(t => t.token === token);
    
    if (!matchingToken) {
      setError("El enlace no existe o ya ha sido utilizado.");
      return;
    }
    
    if (Date.now() > matchingToken.expires) {
      setError("El enlace ha expirado (válido por 15 minutos). Por favor solicita uno nuevo.");
      return;
    }
    
    if (matchingToken.used) {
      setError("Este enlace ya ha sido utilizado.");
      return;
    }

    setTokenEmail(matchingToken.email);
  }, [token]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      // Find and update user
      let allUsers = JSON.parse(localStorage.getItem('centinela_users') || '[]');
      let userFound = false;
      
      const updatedUsers = allUsers.map(u => {
        if (u.email && u.email.toLowerCase() === tokenEmail.toLowerCase()) {
          userFound = true;
          return { ...u, password: password };
        }
        return u;
      });

      if (!userFound) {
        // Muestra error genérico para no filtrar si existe o no, pero acá ya validamos el token.
        // As token is already validated, if user doesn't exist it's a structural error, but we handle it.
        setError("Error interno: Usuario no encontrado en los registros.");
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('centinela_users', JSON.stringify(updatedUsers));

      // Mark token as used
      const tokens = JSON.parse(localStorage.getItem('centinela_reset_tokens') || '[]');
      const updatedTokens = tokens.map(t => t.token === token ? { ...t, used: true } : t);
      localStorage.setItem('centinela_reset_tokens', JSON.stringify(updatedTokens));

      setSuccess("¡Tu contraseña ha sido actualizada exitosamente! Ahora puedes iniciar sesión.");
      setIsSubmitting(false);

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }, 1500);
  };

  return (
    <div style={styles.container}>
      <div className="glass fade-up" style={styles.card}>
        <div style={styles.headerSection}>
          <div className="pulse-primary" style={styles.logoCircle}>
            <ShieldCheck size={30} color="#00a8ff" />
          </div>
          <h2 style={styles.title}>RECUPERACIÓN</h2>
          <p style={styles.subtitle}>ACTUALIZAR CONTRASEÑA</p>
        </div>

        {error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...styles.messageBox, background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.2)' }}>
              {error}
            </div>
            <button onClick={() => navigate('/login')} className="text-btn" style={styles.textBtn}>
              <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} /> VOLVER AL LOGIN
            </button>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...styles.messageBox, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              {success}
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
               <Loader2 size={24} className="animate-spin" color="#10b981" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputStack}>
              <div style={{ position: 'relative' }}>
                <InputField
                  icon={<Lock size={18} />}
                  type={showPassword ? "text" : "password"}
                  placeholder="NUEVA CONTRASEÑA"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.toggleBtn}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <InputField
                  icon={<Lock size={18} />}
                  type={showPassword ? "text" : "password"}
                  placeholder="CONFIRMA CONTRASEÑA"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={isSubmitting}
              style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : (
                <>ACTUALIZAR CONTRASEÑA <ArrowRight size={18} style={{ marginLeft: '12px' }} /></>
              )}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .pulse-primary { box-shadow: 0 0 0 0 rgba(0, 168, 255, 0.4); animation: pulse-ring 2s infinite; }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 168, 255, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 168, 255, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 168, 255, 0); }
        }
        .fade-up { animation: fadeUp 0.8s ease-out forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

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
        outline: 'none', fontSize: '1rem', transition: 'all 0.3s', letterSpacing: '0.5px', boxSizing:'border-box'
      }}
      onFocus={(e) => { e.target.style.borderColor = 'rgba(0, 168, 255, 0.6)'; e.target.style.background = 'rgba(0,0,0,0.6)'; }}
      onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'rgba(0,0,0,0.4)'; }}
    />
  </div>
);

const styles = {
  container: {
    height: '100vh', width: '100vw', background: '#020617', backgroundImage: 'url(/login-bg-ref-3.jpg)',
    backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center',
    alignItems: 'center', fontFamily: "'Outfit', sans-serif"
  },
  card: {
    width: '100%', maxWidth: '460px', padding: '50px 45px', background: 'rgba(7, 12, 26, 0.7)',
    backdropFilter: 'blur(40px) saturate(160%)', borderRadius: '40px', border: '1px solid rgba(0, 168, 255, 0.25)',
    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)'
  },
  headerSection: { textAlign: 'center', marginBottom: '35px' },
  logoCircle: { width: '70px', height: '70px', background: 'rgba(0, 168, 255, 0.05)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 20px', border: '1px solid rgba(0, 168, 255, 0.2)' },
  title: { color: 'white', letterSpacing: '8px', fontSize: '1.4rem', fontWeight: '900', margin: 0 },
  subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', letterSpacing: '4px', fontWeight: 'bold', marginTop: '8px' },
  form: { display: 'flex', flexDirection: 'column', gap: '30px' },
  inputStack: { display: 'flex', flexDirection: 'column', gap: '20px' },
  toggleBtn: { position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', zIndex: 10 },
  submitBtn: {
    width: '100%', padding: '20px', borderRadius: '18px', background: 'linear-gradient(135deg, #00a8ff 0%, #0072ff 100%)',
    color: 'white', border: 'none', fontWeight: '900', letterSpacing: '3px', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', transition: 'all 0.4s', boxShadow: '0 15px 35px rgba(0, 168, 255, 0.3)'
  },
  textBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', letterSpacing: '1px', transition: 'color 0.3s', marginTop: '20px' },
  messageBox: { padding: '20px', borderRadius: '16px', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: 'bold' }
};

export default ResetPassword;
