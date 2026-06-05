import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { authAPI } from '../../utils/api';
import { Button } from '../../components/common/UI';
import Logo from '../../components/common/Logo';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const id = searchParams.get('id');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !id) {
      setError('Invalid or missing parameters in reset link.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await authAPI.resetPassword({
        id,
        token,
        newPassword: form.password
      });

      if (res.data.success) {
        toast.success('Password reset successfully! Please sign in with your new password.');
        navigate('/login');
      } else {
        setError(res.data.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%)', pointerEvents: 'none' }}/>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)', pointerEvents: 'none' }}/>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 36, width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        
        <div className="flex items-center gap-2.5 mb-7">
          <Logo size={36} />
          <span className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>FreelanceHub</span>
        </div>

        <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>Reset Password</h1>
        <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>Enter and confirm your new password below.</p>

        {(!token || !id) && (
          <div className="rounded-xl p-3 text-xs mb-4" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.18)' }}>
            Error: This password reset link is invalid or incomplete.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>New Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="At least 8 characters" required className="input-field pr-10"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
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
              <input type={showConfirmPass ? 'text' : 'password'} placeholder="Repeat password" required className="input-field pr-10"
                value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                autoCapitalize="none" autoCorrect="off" spellCheck="false"/>
              <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showConfirmPass ? <FiEyeOff size={15}/> : <FiEye size={15}/>}
              </button>
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: 'var(--red)' }}>{error}</p>}

          <Button type="submit" loading={loading} disabled={!token || !id} className="w-full justify-center py-2.5 text-base mt-2">
            Reset Password
          </Button>
        </form>

        <p className="text-sm text-center mt-6" style={{ color: 'var(--text-muted)' }}>
          <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-text-primary" style={{ color: 'var(--text-secondary)' }}>
            <FiArrowLeft size={14} /> Back to Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
