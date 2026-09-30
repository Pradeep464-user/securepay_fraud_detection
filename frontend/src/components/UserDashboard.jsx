import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ShieldCheck,
  LogOut,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import SendMoneyModal from './SendMoneyModal';
import TransactionDetailsModal from './TransactionDetailsModal';

export default function UserDashboard({ token, user, onLogout }) {
  const [currentUser, setCurrentUser] = useState(user);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Fetch updated profile & transactions
  const loadData = async () => {
    try {
      setRefreshing(true);
      // 1. Fetch user balance & details
      const userRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user) setCurrentUser(userData.user);
      }

      // 2. Fetch my transactions
      const txRes = await fetch('/api/transactions/my-transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Polling for status updates
    return () => clearInterval(interval);
  }, [token]);

  const handleTransactionDone = (newBal) => {
    if (typeof newBal === 'number') {
      setCurrentUser(prev => ({ ...prev, balance: newBal }));
    }
    loadData();
  };

  const filteredTransactions = transactions.filter(tx => {
    if (statusFilter === 'ALL') return true;
    return tx.status === statusFilter;
  });

  const sentTransactions = transactions.filter(tx => tx.sender?._id === currentUser._id || tx.sender === currentUser._id);
  const receivedTransactions = transactions.filter(tx => tx.receiver?._id === currentUser._id || tx.receiver === currentUser._id);
  const reviewCount = transactions.filter(tx => tx.status === 'UNDER_REVIEW').length;

  return (
    <div className="app-container">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon" style={{ width: '36px', height: '36px' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>SecurePay</span>
              <span style={{ fontSize: '0.7rem', color: '#93c5fd', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Portal</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#f3f4f6' }}>{currentUser.name}</div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Acc: <span style={{ color: '#60a5fa' }}>{currentUser.accountNumber || 'SP-ACCOUNT'}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            title="Sign Out"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {/* Top Metric Cards */}
        <div className="stats-grid">
          {/* Balance Card */}
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.15)'
          }}>
            <div className="stat-header">
              <span>Available Account Balance</span>
              <button
                onClick={loadData}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Refresh"
              >
                <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
              </button>
            </div>
            <div className="stat-value" style={{ color: '#34d399' }}>
              ₹{currentUser.balance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>FDIC-Insured Virtual Wallet</span>
              <button
                onClick={() => setShowSendModal(true)}
                className="btn-primary"
                style={{ width: 'auto', padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
              >
                <Send size={14} /> Send Money
              </button>
            </div>
          </div>

          {/* Activity Cards */}
          <div className="stat-card">
            <div className="stat-header">
              <span>Total Transactions Sent</span>
              <ArrowUpRight size={18} color="#f87171" />
            </div>
            <div className="stat-value">
              {sentTransactions.length}
            </div>
            <div className="stat-footer">Outbound Transfers</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Total Received</span>
              <ArrowDownLeft size={18} color="#34d399" />
            </div>
            <div className="stat-value">
              {receivedTransactions.length}
            </div>
            <div className="stat-footer">Inbound Credits</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span>Security Holds</span>
              <Clock size={18} color={reviewCount > 0 ? '#fbbf24' : 'var(--text-muted)'} />
            </div>
            <div className="stat-value" style={{ color: reviewCount > 0 ? '#fbbf24' : '#fff' }}>
              {reviewCount}
            </div>
            <div className="stat-footer">Under Security Review</div>
          </div>
        </div>

        {/* Transactions Table Card */}
        <div className="content-card">
          <div className="card-title-bar">
            <div className="card-title">
              <FileText size={20} color="#60a5fa" />
              Recent Account Transactions
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {['ALL', 'COMPLETED', 'MONITORED', 'UNDER_REVIEW', 'FRAUD'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`btn-secondary ${statusFilter === st ? 'active' : ''}`}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.35rem 0.65rem',
                    background: statusFilter === st ? 'rgba(37, 99, 235, 0.25)' : 'rgba(255,255,255,0.05)',
                    borderColor: statusFilter === st ? '#3b82f6' : 'var(--border-color)'
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading transactions...
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No transactions match the selected filter.
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tx ID</th>
                    <th>Date / Time</th>
                    <th>Type & Counterparty</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => {
                    const isSender = (tx.sender?._id || tx.sender) === currentUser._id;
                    const counterparty = isSender
                      ? tx.receiver?.name || tx.receiverEmail
                      : tx.sender?.name || tx.senderEmail;

                    return (
                      <tr key={tx._id || tx.transactionId}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#93c5fd' }}>
                          {tx.transactionId}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {isSender ? (
                              <ArrowUpRight size={16} color="#f87171" />
                            ) : (
                              <ArrowDownLeft size={16} color="#34d399" />
                            )}
                            <div>
                              <span style={{ fontWeight: '600', color: '#e2e8f0', fontSize: '0.85rem' }}>
                                {isSender ? `To: ${counterparty}` : `From: ${counterparty}`}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                                {isSender ? 'Transfer Sent' : 'Transfer Received'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: '700',
                          fontSize: '0.95rem',
                          color: isSender ? '#fca5a5' : '#86efac'
                        }}>
                          {isSender ? `-₹${tx.amount.toLocaleString('en-IN')}` : `+₹${tx.amount.toLocaleString('en-IN')}`}
                        </td>
                        <td>
                          <span className={`badge badge-${tx.status?.toLowerCase()}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setSelectedTx(tx)}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          >
                            <FileText size={14} /> Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Send Money Modal */}
      {showSendModal && (
        <SendMoneyModal
          userBalance={currentUser.balance}
          token={token}
          onClose={() => setShowSendModal(false)}
          onTransactionComplete={handleTransactionDone}
        />
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <TransactionDetailsModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
