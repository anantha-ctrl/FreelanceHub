import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import { authAPI } from '../../utils/api';
import { Button, Input } from '../../components/common/UI';
import Logo from '../../components/common/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      if (res.data.success) {
        setSubmitted(true);
        if (res.data.resetUrl) {
          setResetUrl(res.data.resetUrl);
        }
      }
    } catch (err) {
      // Error is caught and shown by global interceptor / UI toast
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

        {!submitted ? (
          <>
            <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-primary)' }}>Forgot Password</h1>
            <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>Enter your email address to receive a password reset link.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email Address" type="email" placeholder="your@email.com" required
                value={email} onChange={e => setEmail(e.target.value)}
                autoCapitalize="none" autoCorrect="off" spellCheck="false"/>

              <Button type="submit" loading={loading} className="w-full justify-center py-2.5 text-base mt-2">
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              ✉️
            </div>
            <h2 className="font-display font-bold text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Check your inbox</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              If an account exists for {email}, a password reset link has been generated.
            </p>
            
            {resetUrl && (
              <div className="text-left rounded-xl p-3.5 text-xs mb-6 space-y-2" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)' }}>
                <span className="font-semibold text-purple-400">Development Mock Link:</span>
                <p style={{ color: 'var(--text-secondary)' }}>
                  You can click the link below to set your new password directly:
                </p>
                <a href={resetUrl} className="block mt-2 font-medium underline text-blue-400 hover:text-blue-300" style={{ wordBreak: 'break-all' }}>
                  {resetUrl}
                </a>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-center mt-6" style={{ color: 'var(--text-muted)' }}>
          <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-text-primary" style={{ color: 'var(--text-secondary)' }}>
            <FiArrowLeft size={14} /> Back to Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
