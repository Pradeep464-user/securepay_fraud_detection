import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  DollarSign,
  Activity,
  Users,
  Search,
  RefreshCw,
  LogOut,
  ArrowRight,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import AdminInvestigationModal from './AdminInvestigationModal';

export default function AdminDashboard({ token, adminUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('suspicious');
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [investigatingTxId, setInvestigatingTxId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAllAdminData = async () => {
    try {
      setRefreshing(true);
      // 1. Metrics
      const mRes = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics);
      }

      // 2. Transactions
      const tRes = await fetch('/api/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTransactions(tData.transactions || []);
      }

      // 3. Fraud Alerts
      const aRes = await fetch('/api/admin/alerts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (aRes.ok) {
        const aData = await aRes.json();
        setAlerts(aData.alerts || []);
      }

      // 4. Users
      const uRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.users || []);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
    const interval = setInterval(loadAllAdminData, 8000);
    return () => clearInterval(interval);
  }, [token]);

  // Suspicious transactions (under review or high risk)
  const suspiciousTxs = transactions.filter(
    (tx) => tx.status === 'UNDER_REVIEW' || tx.riskLevel === 'HIGH' || tx.riskLevel === 'MEDIUM'
  );

  const displayedTransactions = (activeTab === 'suspicious' ? suspiciousTxs : transactions).filter(
    (tx) =>
      tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.senderEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.receiverEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* Admin Navbar */}
      <header className="navbar" style={{ borderBottomColor: 'rgba(239, 68, 68, 0.25)' }}>
        <div className="nav-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', width: '36px', height: '36px' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>SecurePay Analyst</span>
              <span style={{ fontSize: '0.7rem', color: '#f87171', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Fraud Risk Management Console
              </span>
            </div>
          </div>

          <nav className="nav-links">
            <button
              onClick={() => setActiveTab('suspicious')}
              className={`nav-btn ${activeTab === 'suspicious' ? 'active' : ''}`}
            >
              <AlertTriangle size={15} color={activeTab === 'suspicious' ? '#f87171' : 'var(--text-muted)'} />
              Suspicious Queue ({suspiciousTxs.length})
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`nav-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            >
              <ShieldAlert size={15} />
              Fraud Alerts ({alerts.filter(a => a.status === 'OPEN').length})
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`nav-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            >
              <FileText size={15} />
              All Transactions ({transactions.length})
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            >
              <Users size={15} />
              User Ledger ({users.length})
            </button>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button
            onClick={loadAllAdminData}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            title="Refresh All"
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
          </button>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#f3f4f6' }}>{adminUser.name}</div>
            <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: '700' }}>SECURITY ANALYST</div>
          </div>

          <button
            onClick={onLogout}
            className="btn-secondary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="main-content">
        {/* Metric Cards */}
        <div className="stats-grid">
          <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
            <div className="stat-header">
              <span>Open Fraud Alerts</span>
              <AlertTriangle size={18} color="#ef4444" />
            </div>
            <div className="stat-value" style={{ color: '#ef4444' }}>
              {metrics?.alerts?.open ?? 0}
            </div>
            <div className="stat-footer">Requires Analyst Review</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div className="stat-header">
              <span>Transactions Under Review</span>
              <Clock size={18} color="#f59e0b" />
            </div>
            <div className="stat-value" style={{ color: '#fbbf24' }}>
              {metrics?.statusBreakdown?.underReview ?? 0}
            </div>
            <div className="stat-footer">Funds Held in Escrow</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div className="stat-header">
              <span>Total Transactions</span>
              <Activity size={18} color="#3b82f6" />
            </div>
            <div className="stat-value">
              {metrics?.totalTransactions ?? 0}
            </div>
            <div className="stat-footer">{metrics?.statusBreakdown?.completed ?? 0} Completed / {metrics?.statusBreakdown?.fraud ?? 0} Fraud</div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
            <div className="stat-header">
              <span>Settled Volume</span>
              <DollarSign size={18} color="#10b981" />
            </div>
            <div className="stat-value" style={{ color: '#34d399' }}>
              ₹{metrics?.totalVolume?.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? 0}
            </div>
            <div className="stat-footer">Processed Clean Volume</div>
          </div>
        </div>

        {/* Tab 1 & 3: Transactions Table (Suspicious or All) */}
        {(activeTab === 'suspicious' || activeTab === 'transactions') && (
          <div className="content-card">
            <div className="card-title-bar">
              <div className="card-title">
                {activeTab === 'suspicious' ? (
                  <>
                    <AlertTriangle size={20} color="#f87171" />
                    Suspicious Transaction Review Queue
                  </>
                ) : (
                  <>
                    <FileText size={20} color="#60a5fa" />
                    System Transaction Ledger
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search TxID or Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', width: '220px' }}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
            ) : displayedTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No transactions in this queue.
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tx ID</th>
                      <th>Sender</th>
                      <th>Receiver</th>
                      <th>Amount</th>
                      <th>Risk Score</th>
                      <th>Risk Tier</th>
                      <th>Status</th>
                      <th>Decision</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTransactions.map((tx) => (
                      <tr key={tx._id} style={{ background: tx.status === 'UNDER_REVIEW' ? 'rgba(245, 158, 11, 0.05)' : 'transparent' }}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#93c5fd' }}>
                          {tx.transactionId}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{tx.sender?.name || tx.senderEmail}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.senderEmail}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{tx.receiver?.name || tx.receiverEmail}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.receiverEmail}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.95rem', color: '#fff' }}>
                          ₹{tx.amount?.toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: '800',
                            color: tx.riskScore >= 70 ? '#f87171' : tx.riskScore >= 40 ? '#fbbf24' : '#34d399'
                          }}>
                            {tx.riskScore}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/100</span>
                        </td>
                        <td>
                          <span className={`badge badge-${tx.riskLevel?.toLowerCase()}`}>
                            {tx.riskLevel}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${tx.status?.toLowerCase()}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {tx.adminDecision?.decision !== 'NONE' ? tx.adminDecision?.decision : 'PENDING'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setInvestigatingTxId(tx._id)}
                            className="btn-secondary"
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.35rem 0.65rem',
                              background: tx.status === 'UNDER_REVIEW' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.06)',
                              borderColor: tx.status === 'UNDER_REVIEW' ? '#ef4444' : 'var(--border-color)',
                              color: tx.status === 'UNDER_REVIEW' ? '#fca5a5' : '#fff'
                            }}
                          >
                            <Eye size={14} /> Investigate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Fraud Alerts Queue */}
        {activeTab === 'alerts' && (
          <div className="content-card">
            <div className="card-title-bar">
              <div className="card-title">
                <ShieldAlert size={20} color="#f87171" />
                Fraud Alerts Registry
              </div>
            </div>

            {alerts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No active fraud alerts.
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Alert ID</th>
                      <th>Created</th>
                      <th>Sender Account</th>
                      <th>Risk Score</th>
                      <th>Evaluation Findings</th>
                      <th>Alert Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((al) => (
                      <tr key={al._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#f87171' }}>
                          {al.alertId}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(al.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{al.sender?.name || 'User'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{al.sender?.email}</div>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: '#f87171' }}>
                            {al.riskScore} / 100
                          </span>
                        </td>
                        <td style={{ maxWidth: '350px' }}>
                          <ul style={{ listStyle: 'none', padding: 0 }}>
                            {al.reasons?.slice(0, 2).map((r, idx) => (
                              <li key={idx} style={{ fontSize: '0.75rem', color: '#e2e8f0', marginBottom: '2px' }}>
                                • {r}
                              </li>
                            ))}
                            {al.reasons?.length > 2 && (
                              <li style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                +{al.reasons.length - 2} more rule triggers
                              </li>
                            )}
                          </ul>
                        </td>
                        <td>
                          <span className={`badge ${al.status === 'OPEN' ? 'badge-fraud' : al.status === 'INVESTIGATING' ? 'badge-high' : 'badge-completed'}`}>
                            {al.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => setInvestigatingTxId(al.transaction?._id || al.transaction)}
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          >
                            <Eye size={14} /> Open Case
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: User Ledger */}
        {activeTab === 'users' && (
          <div className="content-card">
            <div className="card-title-bar">
              <div className="card-title">
                <Users size={20} color="#60a5fa" />
                Registered User Directory
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Number</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Available Balance</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#60a5fa' }}>
                        {u.accountNumber}
                      </td>
                      <td style={{ fontWeight: '600' }}>{u.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-high' : 'badge-low'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#34d399' }}>
                        ₹{u.balance?.toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Investigation Modal */}
      {investigatingTxId && (
        <AdminInvestigationModal
          transactionId={investigatingTxId}
          token={token}
          onClose={() => setInvestigatingTxId(null)}
          onDecisionMade={() => loadAllAdminData()}
        />
      )}
    </div>
  );
}
