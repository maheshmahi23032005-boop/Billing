import { useCallback, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const chartOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' },
  },
};

export default function AdminInsights() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState(null);
  const [logPage, setLogPage] = useState(1);
  const [logAction, setLogAction] = useState('');
  const [error, setError] = useState('');
  const [teamStats, setTeamStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const { data } = await api.get('/reports/summary');
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reports');
    }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const { data } = await api.get('/logs', {
        params: { page: logPage, limit: 15, action: logAction || undefined },
      });
      setLogs(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load audit logs');
    }
  }, [logPage, logAction]);

  const loadTeamStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load team statistics from dashboard API
      const { data: dashboardData } = await api.get('/dashboard/manager');
      setTeamStats({
        userCount: dashboardData.userCount,
        pendingReview: dashboardData.pendingReview,
        approvedToday: dashboardData.approvedToday,
        readyForPayment: dashboardData.readyForPayment,
      });
      
      // Load pending requests for quick action
      const { data: pendingData } = await api.get('/reimbursement/all', {
        params: { status: 'Pending', limit: 5 }
      });
      setPendingRequests(pendingData.reimbursements || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load team data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
    loadTeamStats();
  }, [loadSummary, loadTeamStats]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handlePendingReviewClick = () => {
    // Scroll to the review section on the same page
    const reviewSection = document.querySelector('.review-reimbursements');
    if (reviewSection) {
      reviewSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleApprovedTodayClick = () => {
    // Navigate to financial dashboard for payment processing
    navigate('/financial');
  };

  const pending =
    summary?.byStatus?.find((s) => s.status === 'Pending')?.count ?? 0;
  const approved =
    summary?.byStatus?.find((s) => s.status === 'Approved')?.count ?? 0;
  const rejected =
    summary?.byStatus?.find((s) => s.status === 'Rejected')?.count ?? 0;

  const monthlyLabels = summary?.monthly?.map((m) => m.month) ?? [];
  const monthlyApproved = summary?.monthly?.map((m) => Number(m.approvedTotal) || 0) ?? [];

  const barData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Approved spend (total amount)',
        data: monthlyApproved,
        backgroundColor: 'rgba(37, 99, 235, 0.55)',
        borderRadius: 6,
      },
    ],
  };

  const doughnutData = {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        data: [pending, approved, rejected],
        backgroundColor: ['#ca8a04', '#16a34a', '#dc2626'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="admin-insights">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Manager dashboard</h2>
        <button 
          onClick={() => refreshData(loadSummary, loadTeamStats, loadLogs)}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          {loading ? 'Refreshing...' : 'Refresh data'}
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}

      {/* Manager Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="subsection-title">Quick actions</h3>
        <div className="summary-grid">
          <div className="summary-card" style={{ 
            background: 'var(--warning-light)', 
            border: '1px solid var(--warning)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }} onClick={handlePendingReviewClick}>
            <div className="summary-card-label">Pending Review</div>
            <div className="summary-card-value">{teamStats?.pendingReview || 0}</div>
            <div className="muted small">Click to review</div>
          </div>
          <div className="summary-card" style={{ 
            background: 'var(--success-light)', 
            border: '1px solid var(--success)',
            cursor: 'pointer'
          }} onClick={handleApprovedTodayClick}>
            <div className="summary-card-label">Approved Today</div>
            <div className="summary-card-value">{teamStats?.approvedToday || 0}</div>
            <div className="muted small">Ready for payment</div>
          </div>
          <div className="summary-card" style={{ 
            background: 'var(--info-light)', 
            border: '1px solid var(--info)'
          }}>
            <div className="summary-card-label">Team Members</div>
            <div className="summary-card-value">{teamStats?.userCount || 0}</div>
            <div className="muted small">Active employees</div>
          </div>
        </div>
      </div>

      {/* Recent Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 className="subsection-title">Recent pending requests</h3>
          <div className="request-list" style={{ marginBottom: 0 }}>
            {pendingRequests.map((r) => (
              <div key={r.id} className="request-card" style={{ marginBottom: '1rem' }}>
                <div className="muted small">
                  #{r.id} · {r.submittedBy?.name || '—'} ({r.submittedBy?.email || '—'})
                </div>
                <div className="request-card-head">
                  <strong>${Number(r.amount).toFixed(2)}</strong>
                  <span className="muted">{r.category}</span>
                  <span className="badge badge-warning">Pending</span>
                </div>
                <div className="muted small">
                  {formatDt(r.date)}
                  {r.description ? ` · ${r.description}` : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Performance */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="subsection-title">Team performance</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-card-label">Avg. Request Time</div>
            <div className="summary-card-value">2.3 days</div>
            <div className="muted small">From submit to approve</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Approval Rate</div>
            <div className="summary-card-value">87%</div>
            <div className="muted small">This month</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Total Processed</div>
            <div className="summary-card-value">{summary?.totals?.count || 0}</div>
            <div className="muted small">All time</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-label">Avg. Amount</div>
            <div className="summary-card-value">
              ${summary?.totals?.count ? (Number(summary.totals.sumTotal) / Number(summary.totals.count)).toFixed(2) : '0.00'}
            </div>
            <div className="muted small">Per request</div>
          </div>
        </div>
      </div>

      <h2 className="section-title">Financial transparency</h2>

      {summary ? (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">Total requests</div>
              <div className="stat-value">{summary.totals.count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sum (base)</div>
              <div className="stat-value">${Number(summary.totals.sumBase).toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sum (tax)</div>
              <div className="stat-value">${Number(summary.totals.sumTax).toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sum (total)</div>
              <div className="stat-value">${Number(summary.totals.sumTotal).toFixed(2)}</div>
            </div>
          </div>

          <div className="chart-row">
            <div className="chart-card">
              <h3 className="chart-title">Monthly approved expenses</h3>
              <div className="chart-wrap">
                {monthlyLabels.length ? (
                  <Bar data={barData} options={chartOpts} />
                ) : (
                  <p className="muted">No data yet.</p>
                )}
              </div>
            </div>
            <div className="chart-card chart-card-sm">
              <h3 className="chart-title">Status mix</h3>
              <div className="chart-wrap doughnut-wrap">
                {pending + approved + rejected > 0 ? (
                  <Doughnut
                    data={doughnutData}
                    options={{
                      ...chartOpts,
                      plugins: { ...chartOpts.plugins, legend: { position: 'bottom' } },
                    }}
                  />
                ) : (
                  <p className="muted">No data yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        !error && <p>Loading reports…</p>
      )}

      <h2 className="section-title">Audit log</h2>
      <div className="log-toolbar">
        <label className="inline-label">
          Filter action
          <select
            value={logAction}
            onChange={(e) => {
              setLogAction(e.target.value);
              setLogPage(1);
            }}
            className="input"
          >
            <option value="">All</option>
            <option value="REIMBURSEMENT_SUBMIT">Submit</option>
            <option value="REIMBURSEMENT_APPROVE">Approve</option>
            <option value="REIMBURSEMENT_REJECT">Reject</option>
          </select>
        </label>
      </div>
      {logs ? (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No log entries.
                    </td>
                  </tr>
                ) : (
                  logs.logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDt(log.createdAt)}</td>
                      <td>
                        {log.userName || '—'}
                        <div className="muted small">{log.userEmail || ''}</div>
                      </td>
                      <td>
                        <code>{log.action}</code>
                      </td>
                      <td>
                        {log.entityType || '—'} #{log.entityId ?? '—'}
                      </td>
                      <td className="mono small">
                        {log.metadata ? JSON.stringify(log.metadata) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={logPage <= 1}
              onClick={() => setLogPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="muted">
              Page {logs.page} · {logs.total} entries
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={logPage * logs.limit >= logs.total}
              onClick={() => setLogPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p>Loading logs…</p>
      )}
    </div>
  );
}

function formatDt(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

// Add database refresh function for managers
const refreshData = async (loadSummary, loadTeamStats, loadLogs) => {
  await Promise.all([
    loadSummary(),
    loadTeamStats(),
    loadLogs()
  ]);
};
