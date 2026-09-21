import React, { useState } from 'react';
import { ShieldAlert, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onSwitchToUserLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.user.role !== 'admin') {
        throw new Error('Access denied: Account does not possess Administrator privileges.');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail('admin@securepay.com');
    setPassword('Admin@123');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: '#0a0d14'
    }}>
      <div className="login-card" style={{ maxWidth: '440px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%)' }}>
            <ShieldAlert size={26} />
          </div>
          <div>
            <h1 className="brand-title" style={{ fontSize: '1.4rem' }}>Admin Portal</h1>
            <p className="brand-subtitle" style={{ color: '#f87171' }}>Fraud Risk & Compliance</p>
          </div>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@securepay.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Admin Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-danger"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', padding: '0.85rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In as Security Admin'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
          <button
            type="button"
            onClick={handleQuickFillAdmin}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
          >
            Quick Fill Admin Demo
          </button>

          <button
            type="button"
            onClick={onSwitchToUserLogin}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <ArrowLeft size={14} /> Back to User Login
          </button>
        </div>
      </div>
    </div>
  );
}
