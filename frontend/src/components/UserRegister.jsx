import React, { useState } from 'react';
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { API_BASE } from '../config/api';

export default function UserRegister({ onRegisterSuccess, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [initialBalance, setInitialBalance] = useState(5000);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          initialBalance: Number(initialBalance)
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      onRegisterSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div className="login-card" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}>
            <UserPlus size={24} />
          </div>
          <div>
            <h1 className="brand-title" style={{ fontSize: '1.4rem' }}>Open Account</h1>
            <p className="brand-subtitle">Join SecurePay Digital Banking</p>
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
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Maya Lin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="maya@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password (Min 6 chars)</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Test Balance (₹ INR)</label>
            <input
              type="number"
              className="form-input"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              min="0"
              step="100"
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              Credited immediately for demonstration and risk testing.
            </small>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '1.25rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            {loading ? 'Registering...' : 'Complete Registration'}
            <CheckCircle2 size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
