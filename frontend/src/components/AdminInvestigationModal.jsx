import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  History,
  TrendingUp,
  Activity,
  DollarSign
} from 'lucide-react';

export default function AdminInvestigationModal({ transactionId, token, onClose, onDecisionMade }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/transactions/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Failed to load investigation details');
        }
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (transactionId) {
      loadDetails();
    }
  }, [transactionId, token]);

  const handleDecision = async (decisionType) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/transactions/${transactionId}/decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision: decisionType,
          notes: decisionNotes.trim() || `Analyst action: ${decisionType}`
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to execute decision');
      }

      if (onDecisionMade) {
        onDecisionMade(json.transaction);
      }
      onClose();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem' }}>
          <div style={{ color: 'var(--text-muted)' }}>Loading transaction telemetry & behavioral profile...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="alert-box alert-danger">{error || 'Investigation details not available'}</div>
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const { transaction, alert: fraudAlert, behavioralProfile } = data;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', width: '36px', height: '36px' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>
                Fraud Investigation Console
              </h2>
              <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                Target Transaction: {transaction.transactionId}
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Highlight Banner */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-mono)' }}>
              ₹{transaction.amount?.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Score</span>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: transaction.riskScore >= 70 ? '#f87171' : transaction.riskScore >= 40 ? '#fbbf24' : '#34d399', fontFamily: 'var(--font-mono)' }}>
              {transaction.riskScore} / 100
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Risk Tier</span>
            <div>
              <span className={`badge badge-${transaction.riskLevel?.toLowerCase()}`}>
                {transaction.riskLevel}
              </span>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Status</span>
            <div>
              <span className={`badge badge-${transaction.status?.toLowerCase()}`}>
                {transaction.status}
              </span>
            </div>
          </div>
        </div>

        {/* Sender Behavioral Baseline Profile */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <History size={16} /> Sender Behavioral Profile & Deviation Baseline
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Historical Avg Amount</span>
              <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                ₹{behavioralProfile.averageAmount?.toLocaleString('en-IN')}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Historical Tx Count</span>
              <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#fff' }}>
                {behavioralProfile.totalTransactions} transfers
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Past High-Risk Flags</span>
              <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: behavioralProfile.flaggedTransactions > 0 ? '#f87171' : '#34d399' }}>
                {behavioralProfile.flaggedTransactions} flagged
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Current User Balance</span>
              <div style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                ₹{transaction.sender?.balance?.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Rule Breakdown Breakdown */}
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
            Rule Scoring Distribution
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Amount Score (45% wt)</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: transaction.breakdown?.amountScore > 30 ? '#f87171' : '#fff' }}>
                {transaction.breakdown?.amountScore || 0} / 100
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Velocity Score (35% wt)</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: transaction.breakdown?.frequencyScore > 30 ? '#f87171' : '#fff' }}>
                {transaction.breakdown?.frequencyScore || 0} / 100
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Timing Score (20% wt)</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: transaction.breakdown?.timingScore > 30 ? '#f87171' : '#fff' }}>
                {transaction.breakdown?.timingScore || 0} / 100
              </div>
            </div>
          </div>

          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600' }}>
            Triggered Rules & Automated Reason Codes:
          </span>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
            {transaction.breakdown?.reasons?.map((r, i) => (
              <li key={i} style={{ fontSize: '0.8rem', color: '#fca5a5', padding: '0.35rem 0.6rem', background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid #ef4444', marginBottom: '0.35rem', borderRadius: '0 4px 4px 0' }}>
                • {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Analyst Decision Actions */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '0.5rem' }}>
            Analyst Decision Action
          </h3>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Investigation Notes / Justification</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="e.g., Client confirmed identity via phone, verified legitimate corporate wire."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleDecision('APPROVE')}
              disabled={submitting}
              className="btn-success"
              style={{ flex: 1 }}
            >
              <CheckCircle2 size={16} /> Approve (Clear & Settle)
            </button>

            <button
              onClick={() => handleDecision('FLAG_FRAUD')}
              disabled={submitting}
              className="btn-danger"
              style={{ flex: 1 }}
            >
              <XCircle size={16} /> Flag as Fraud (Refund Sender)
            </button>

            <button
              onClick={() => handleDecision('KEEP_UNDER_REVIEW')}
              disabled={submitting}
              className="btn-warning"
              style={{ flex: 1 }}
            >
              <Clock size={16} /> Keep Under Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
