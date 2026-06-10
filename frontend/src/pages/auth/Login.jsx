import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiShield, FiSun, FiMoon, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../utils/api';
import { Button, Input } from '../../components/common/UI';
import Logo from '../../components/common/Logo';

// Build a username slug from a full name: lowercase, strip non-alphanumerics.
const slugifyUsername = (name) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);

const AuthCard = ({ children, title, subtitle, wide }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden', padding: '24px 16px' }}>
    <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)', pointerEvents: 'none' }}/>
    <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)', pointerEvents: 'none' }}/>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 36, width: '100%', maxWidth: wide ? 560 : 420, position: 'relative', zIndex: 1 }}>
      <div className="flex items-center gap-2.5 mb-7">
        <Logo size={36} />
        <span className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>Car Hive</span>
      </div>
      <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      {children}
    </motion.div>
  </div>
);

export function Login() {
  const [form, setForm] = useState({ identifier: '', password: '', remember: true });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(form.identifier, form.password);
    setLoading(false);
    if (res.success) {
      if (form.remember) localStorage.setItem('ch_remember', form.identifier);
      else localStorage.removeItem('ch_remember');
      navigate(res.user?.role === 'admin' ? '/admin' : '/dashboard');
    }
  };

  return (
    <AuthCard title="Login" subtitle="Sign in to your Car Hive freelancer account">
      <div className="absolute top-4 right-4">
        <button onClick={toggleTheme} className="btn-ghost p-1.5 rounded-lg">{isDark?<FiSun size={15}/>:<FiMoon size={15}/>}</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Username" placeholder="your username" required autoComplete="username"
          value={form.identifier} onChange={e => setForm(f => ({...f, identifier: e.target.value}))}
          autoCapitalize="none" autoCorrect="off" spellCheck="false"/>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} placeholder="Your password" required className="input-field pr-10"
              value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
              autoCapitalize="none" autoCorrect="off" spellCheck="false"/>
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              {showPass ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.remember} onChange={e => setForm(f => ({...f, remember: e.target.checked}))}/>
            Remember Me
          </label>
          <Link to="/forgot-password" style={{ color: 'var(--neon-light)', fontSize: '11.5px', fontWeight: 500 }}>
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full justify-center py-2.5 text-base mt-2">
          Login
        </Button>

        <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <div className="flex items-center gap-1.5 mb-1"><FiShield size={12} style={{ color: 'var(--purple)' }}/><strong style={{ color: 'var(--purple)' }}>Admin login:</strong></div>
          username: admin / Admin@123456
        </div>
      </form>
      <p className="text-sm text-center mt-5" style={{ color: 'var(--text-muted)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--neon-light)' }}>Register</Link>
      </p>
      <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to home</Link>
      </p>
    </AuthCard>
  );
}

const initialReg = {
  name: '', username: '', dob: '', email: '', mobile: '', address: '',
  password: '', confirmPassword: ''
};

export function Register() {
  const [form, setForm] = useState(initialReg);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Tracks whether the user has manually edited the username (stop auto-sync from name).
  const [usernameTouched, setUsernameTouched] = useState(false);
  // Real-time availability: { state: 'idle'|'checking'|'available'|'taken'|'short', suggestion }
  const [uStatus, setUStatus] = useState({ state: 'idle' });
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Auto-generate username from full name until the user edits it manually.
  const onNameChange = (e) => {
    const name = e.target.value;
    setForm(f => ({ ...f, name, username: usernameTouched ? f.username : slugifyUsername(name) }));
  };

  const onUsernameChange = (e) => {
    setUsernameTouched(true);
    setForm(f => ({ ...f, username: slugifyUsername(e.target.value) }));
  };

  const applySuggestion = () => {
    if (uStatus.suggestion) setForm(f => ({ ...f, username: uStatus.suggestion }));
  };

  // Debounced live username availability check against the database.
  useEffect(() => {
    const u = (form.username || '').trim();
    if (u.length < 3) { setUStatus({ state: u ? 'short' : 'idle' }); return; }
    setUStatus({ state: 'checking' });
    const t = setTimeout(async () => {
      try {
        const res = await authAPI.checkUsername(u);
        if (res.data.available) setUStatus({ state: 'available' });
        else if (res.data.tooShort) setUStatus({ state: 'short' });
        else setUStatus({ state: 'taken', suggestion: res.data.suggestion });
      } catch {
        setUStatus({ state: 'idle' });
      }
    }, 450);
    return () => clearTimeout(t);
  }, [form.username]);

  // Password strength meter (0-4).
  const strength = (() => {
    const p = form.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['var(--red)', 'var(--red)', 'var(--amber)', 'var(--neon)', 'var(--green)'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError('Password must be at least 8 characters and include letters and numbers.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.success) navigate('/login');
  };

  return (
    <AuthCard wide title="Register" subtitle="Create your Car Hive freelancer account">
      <div className="absolute top-4 right-4">
        <button onClick={toggleTheme} className="btn-ghost p-1.5 rounded-lg">{isDark?<FiSun size={15}/>:<FiMoon size={15}/>}</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input label="Full Name" placeholder="Alex Morgan" required value={form.name} onChange={onNameChange}/>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Username</label>
            <div className="relative">
              <input className="input-field pr-9" placeholder="auto-generated from name" required
                value={form.username} onChange={onUsernameChange}
                autoCapitalize="none" autoCorrect="off" spellCheck="false"/>
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {uStatus.state === 'checking' && <FiLoader size={14} className="animate-spin" style={{ color: 'var(--text-muted)' }}/>}
                {uStatus.state === 'available' && <FiCheck size={14} style={{ color: 'var(--green)' }}/>}
                {uStatus.state === 'taken' && <FiX size={14} style={{ color: 'var(--red)' }}/>}
              </span>
            </div>
            {uStatus.state === 'available' && <p className="text-[11px] mt-1" style={{ color: 'var(--green)' }}>Username available</p>}
            {uStatus.state === 'short' && <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>At least 3 characters</p>}
            {uStatus.state === 'taken' && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--red)' }}>
                Username taken{uStatus.suggestion && <>. Try <button type="button" onClick={applySuggestion} className="font-semibold underline" style={{ color: 'var(--neon-light)' }}>{uStatus.suggestion}</button></>}
              </p>
            )}
          </div>
          <Input label="Date of Birth" type="date" value={form.dob} onChange={set('dob')}/>
          <Input label="Mobile Number" type="tel" placeholder="+91 9876 543 210" required value={form.mobile} onChange={set('mobile')}/>
        </div>
        <Input label="Email ID" type="email" placeholder="alex@example.com" required value={form.email} onChange={set('email')}
          autoCapitalize="none" autoCorrect="off" spellCheck="false"/>
        <Input label="Address" placeholder="House no, street, city" value={form.address} onChange={set('address')}/>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" required className="input-field pr-10"
                value={form.password} onChange={set('password')}
                autoCapitalize="none" autoCorrect="off" spellCheck="false"/>
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPass ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'} placeholder="Repeat password" required className="input-field pr-10"
                value={form.confirmPassword} onChange={set('confirmPassword')}
                autoCapitalize="none" autoCorrect="off" spellCheck="false"/>
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showConfirm ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
              </button>
            </div>
          </div>
        </div>

        {form.password && (
          <div>
            <div className="flex gap-1 mb-1">
              {[0,1,2,3].map(i => (
                <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i < strength ? strengthColors[strength] : 'var(--border)' }}/>
              ))}
            </div>
            <p className="text-[11px]" style={{ color: strengthColors[strength] }}>Password strength: {strengthLabels[strength]}</p>
          </div>
        )}

        {form.confirmPassword && form.password !== form.confirmPassword && (
          <p className="text-xs" style={{ color: 'var(--red)' }}>Passwords do not match.</p>
        )}
        {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

        <Button type="submit" loading={loading} className="w-full justify-center py-2.5 text-base mt-1">
          Register Now
        </Button>
      </form>
      <p className="text-sm text-center mt-5" style={{ color: 'var(--text-muted)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--neon-light)' }}>Login</Link>
      </p>
      <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
        <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to home</Link>
      </p>
    </AuthCard>
  );
}

export default Login;
