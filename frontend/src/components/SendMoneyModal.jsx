import React, { useState } from 'react';
import { Send, X, AlertCircle, CheckCircle2, ShieldAlert, Sparkles, Clock } from 'lucide-react';

export default function SendMoneyModal({ userBalance, token, onClose, onTransactionComplete }) {
  const [receiver, setReceiver] = useState('alex.smith@example.com');
  const [amount, setAmount] = useState('150');
  const [simulateNight, setSimulateNight] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    const numAmount = Number(amount);
    if (!receiver || !numAmount || numAmount <= 0) {
      setError('Please provide a valid recipient and positive transfer amount.');
      return;
    }

    if (numAmount > userBalance) {
      setError(`Insufficient balance. You have ₹${userBalance.toLocaleString('en-IN')} available.`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverIdentifier: receiver.trim(),
          amount: numAmount,
          customHour: simulateNight ? 3 : null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Transaction could not be processed.');
      }

      setResult(data);
      if (onTransactionComplete) {
        onTransactionComplete(data.newBalance);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Preset Scenarios for College Demo / Verification
  const applyPreset = (presetType) => {
    setError('');
    setResult(null);
    if (presetType === 'normal') {
      setReceiver('alex.smith@example.com');
      setAmount('150');
      setSimulateNight(false);
    } else if (presetType === 'high-amount') {
      setReceiver('alex.smith@example.com');
      setAmount('18000');
      setSimulateNight(false);
    } else if (presetType === 'unusual-night') {
      setReceiver('alex.smith@example.com');
      setAmount('450');
      setSimulateNight(true);
    } else if (presetType === 'high-risk-combined') {
      setReceiver('alex.smith@example.com');
      setAmount('24000');
      setSimulateNight(true);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon" style={{ width: '36px', height: '36px' }}>
              <Send size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>Send Funds</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Available Balance: <strong style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>₹{userBalance?.toLocaleString('en-IN')}</strong>
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Demo Preset Selector */}
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.65rem', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <Sparkles size={14} /> Quick Fraud Engine Test Scenarios:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button type="button" onClick={() => applyPreset('normal')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
              Normal (₹150)
            </button>
            <button type="button" onClick={() => applyPreset('high-amount')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
              High Amount (₹18,000)
            </button>
            <button type="button" onClick={() => applyPreset('unusual-night')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}>
              Night Hours (3 AM)
            </button>
            <button type="button" onClick={() => applyPreset('high-risk-combined')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', color: '#f87171' }}>
              Combined High Risk (₹24,000 + 3 AM)
            </button>
          </div>
        </div>

        {error && (
          <div className="alert-box alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div style={{
            padding: '1rem',
            borderRadius: '0.75rem',
            background: result.transaction.riskLevel === 'HIGH' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${result.transaction.riskLevel === 'HIGH' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {result.transaction.riskLevel === 'HIGH' ? (
                  <ShieldAlert size={20} color="#fbbf24" />
                ) : (
                  <CheckCircle2 size={20} color="#34d399" />
                )}
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>
                  {result.transaction.status === 'UNDER_REVIEW' ? 'Payment Held for Security Verification' : 'Payment Transferred Successfully'}
                </strong>
              </div>
              <span className={`badge badge-${result.transaction.status.toLowerCase()}`}>
                {result.transaction.status}
              </span>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
              {result.transaction.status === 'UNDER_REVIEW' 
                ? 'Your transfer has been received and is currently undergoing standard banking verification. You will be notified once complete.'
                : `Successfully sent ₹${result.transaction.amount?.toLocaleString('en-IN')} to ${result.transaction.receiverEmail || 'recipient'}.`}
            </p>
          </div>
        )}

        <form onSubmit={handleSend}>
          <div className="form-group">
            <label className="form-label">Recipient Email or Account Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. alex.smith@example.com or SP12345678"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Transfer Amount (₹ INR)</label>
            <input
              type="number"
              className="form-input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              step="any"
              required
            />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 0.85rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '0.5rem',
            marginBottom: '1.25rem',
            cursor: 'pointer'
          }} onClick={() => setSimulateNight(!simulateNight)}>
            <input
              type="checkbox"
              id="simulateNight"
              checked={simulateNight}
              onChange={(e) => setSimulateNight(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="simulateNight" style={{ fontSize: '0.85rem', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={15} color="#93c5fd" />
              Simulate high-risk night execution (03:00 AM)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? 'Evaluating Risk & Transferring...' : 'Execute Transfer'}
              <Send size={16} />
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
