import React from 'react';
import { X, ShieldAlert, CheckCircle2, Clock, AlertTriangle, UserCheck } from 'lucide-react';

export default function TransactionDetailsModal({ transaction, onClose }) {
  if (!transaction) return null;

  const {
    transactionId,
    amount,
    status,
    riskScore,
    riskLevel,
    breakdown,
    sender,
    receiver,
    adminDecision,
    createdAt
  } = transaction;

  const getRiskClass = (level) => {
    if (level === 'HIGH') return 'high';
    if (level === 'MEDIUM') return 'medium';
    return 'low';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#fff' }}>Transaction Intelligence</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ID: {transactionId}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Amount & Status Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '1.25rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Transfer Amount</span>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fff', fontFamily: 'var(--font-mono)' }}>
              ${amount?.toLocaleString()}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Current Status</span>
            <span className={`badge badge-${status?.toLowerCase()}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Sender & Receiver Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sender</span>
            <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '0.9rem' }}>
              {sender?.name || transaction.senderEmail || 'Sender'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sender?.email || transaction.senderEmail}</div>
            {sender?.accountNumber && (
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{sender.accountNumber}</div>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recipient</span>
            <div style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '0.9rem' }}>
              {receiver?.name || transaction.receiverEmail || 'Recipient'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{receiver?.email || transaction.receiverEmail}</div>
            {receiver?.accountNumber && (
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#34d399' }}>{receiver.accountNumber}</div>
            )}
          </div>
        </div>

        {/* Rule-Based Fraud Detection Analysis */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid var(--border-color)',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="#60a5fa" />
              Rule-Based Fraud Engine Evaluation
            </h3>
            <span className={`badge badge-${riskLevel?.toLowerCase()}`}>
              {riskLevel} RISK ({riskScore}/100)
            </span>
          </div>

          <div className="risk-meter-bar">
            <div
              className={`risk-fill ${getRiskClass(riskLevel)}`}
              style={{ width: `${Math.max(5, riskScore)}%` }}
            />
          </div>

          {/* Breakdown Pills */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.65rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Amount Risk</span>
              <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: breakdown?.amountScore > 30 ? '#f87171' : '#34d399' }}>
                {breakdown?.amountScore || 0} / 100
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.65rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Velocity Risk</span>
              <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: breakdown?.frequencyScore > 30 ? '#f87171' : '#34d399' }}>
                {breakdown?.frequencyScore || 0} / 100
              </span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.65rem', borderRadius: '0.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Timing Risk</span>
              <span style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', color: breakdown?.timingScore > 30 ? '#f87171' : '#34d399' }}>
                {breakdown?.timingScore || 0} / 100
              </span>
            </div>
          </div>

          {/* Triggered Rule Reasons */}
          <div style={{ marginTop: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Evaluation Findings & Triggered Rules:
            </span>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
              {breakdown?.reasons && breakdown.reasons.length > 0 ? (
                breakdown.reasons.map((reason, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: '0.8rem',
                      color: '#cbd5e1',
                      padding: '0.35rem 0.5rem',
                      background: 'rgba(255,255,255,0.02)',
                      borderLeft: '3px solid #60a5fa',
                      marginBottom: '0.35rem',
                      borderRadius: '0 4px 4px 0'
                    }}
                  >
                    • {reason}
                  </li>
                ))
              ) : (
                <li style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Standard transaction within parameters.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Admin Decision Section if present */}
        {adminDecision && adminDecision.decision !== 'NONE' && (
          <div style={{
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            borderRadius: '0.75rem',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <UserCheck size={16} /> Analyst Investigation Decision
            </h4>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>
              <strong>Decision:</strong> {adminDecision.decision}
            </div>
            {adminDecision.notes && (
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                <strong>Analyst Notes:</strong> {adminDecision.notes}
              </div>
            )}
            {adminDecision.decidedAt && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Recorded on {new Date(adminDecision.decidedAt).toLocaleString()}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
