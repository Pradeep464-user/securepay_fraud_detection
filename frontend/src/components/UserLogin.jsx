import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import loginBg from '../assets/login-background.webp';
import { API_BASE } from '../config/api';

export default function UserLogin({ onLoginSuccess, onSwitchToRegister, onSwitchToAdmin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillUser = () => {
    setEmail('alex.smith@example.com');
    setPassword('User@123');
    setError('');
  };

  return (
    <div
      className="login-page-container"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="login-backdrop-overlay" />

      <div className="login-card">
        <div className="brand-header">
          <div className="brand-icon">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 className="brand-title">SecurePay</h1>
            <p className="brand-subtitle">Fintech Payment Portal</p>
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
            <label className="form-label" htmlFor="user-email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="user-email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="user-password">
              Password
            </label>
            <input
              id="user-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '1.25rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Account'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            style={{
              background: 'none',
              border: 'none',
              color: '#60a5fa',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Create Account
          </button>
        </div>

        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleQuickFillUser}
            className="btn-secondary"
            style={{ fontSize: '0.75rem', padding: '0.4rem 0.65rem' }}
          >
            Demo User Fill
          </button>

          <button
            type="button"
            onClick={onSwitchToAdmin}
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
            <Lock size={12} /> Admin Portal
          </button>
        </div>
      </div>
    </div>
  );
}
