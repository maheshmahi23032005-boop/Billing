import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useNotify } from '../context/NotificationContext';

export default function ReviewerStatusDashboard() {
  const { info } = useNotify();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/reimbursement/all', {
        params: { 
          page, 
          limit, 
          status: statusFilter || undefined, 
          q: search || undefined 
        },
      });
      setItems(data.reimbursements || []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reimbursements');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchDraft]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'var(--warning)';
      case 'Approved': return 'var(--success)';
      case 'Paid': return 'var(--primary)';
      case 'Rejected': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return '';
      case 'Approved': return '';
      case 'Paid': return '';
      case 'Rejected': return '';
      default: return '';
    }
  };

  return (
    <section className="panel">
      <h2 className="section-title">Reimbursement status dashboard</h2>
      <p className="lead">View the status of all reimbursement requests and payment processing</p>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-label">Pending Manager Review</div>
          <div className="summary-card-value">
            {items.filter(r => r.status === 'Pending').length}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Approved for Payment</div>
          <div className="summary-card-value">
            {items.filter(r => r.status === 'Approved').length}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Payments Completed</div>
          <div className="summary-card-value">
            {items.filter(r => r.status === 'Paid').length}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Total Amount Processed</div>
          <div className="summary-card-value">
            ${items
              .filter(r => r.status === 'Paid')
              .reduce((sum, r) => sum + Number(r.amount || 0), 0)
              .toFixed(2)}
          </div>
        </div>
      </div>

      <div className="list-toolbar">
        <label className="inline-label">
          Status
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="input"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending manager review</option>
            <option value="Approved">Approved for payment</option>
            <option value="Paid">Payment completed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </label>
        <label className="inline-label flex-grow">
          Search
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="input"
            placeholder="Search by employee, category, or description"
          />
        </label>
      </div>

      {loading ? (
        <p>Loading reimbursement status…</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : items.length === 0 ? (
        <p className="muted">No reimbursement requests found.</p>
      ) : (
        <>
          <ul className="request-list">
            {items.map((r) => (
              <li key={r.id} className="request-card" data-reimbursement-id={r.id}>
                <div className="muted small">
                  #{r.id} · {r.submittedBy?.name || '—'} ({r.submittedBy?.email || '—'})
                </div>
                <div className="request-card-head">
                  <strong>${Number(r.amount).toFixed(2)}</strong>
                  <span className="muted">{r.category}</span>
                  <span 
                    className="badge" 
                    style={{ 
                      background: getStatusColor(r.status),
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    {getStatusIcon(r.status)} {r.status}
                  </span>
                </div>
                <div className="muted small">
                  {formatDate(r.date)}
                  {r.description ? ` · ${r.description}` : null}
                </div>
                <div className="tax-mini">
                  Tax: ${Number(r.taxBreakdown?.taxAmount ?? 0).toFixed(2)} · Total: $
                  {Number(r.taxBreakdown?.totalAmount ?? r.amount).toFixed(2)}
                </div>
                
                {/* Status Timeline */}
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.75rem', 
                  background: 'var(--surface-elevated)', 
                  borderRadius: 'var(--radius)',
                  fontSize: '0.85rem'
                }}>
                  <strong>Process timeline</strong>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ 
                      color: r.status !== 'Rejected' ? 'var(--success)' : 'var(--text-muted)',
                      fontWeight: r.status !== 'Rejected' ? '600' : '400'
                    }}>
                      Submitted by {r.submittedBy?.name || 'Employee'}
                    </div>
                    {r.status !== 'Pending' && (
                      <div style={{ 
                        color: r.status === 'Rejected' ? 'var(--danger)' : 'var(--success)',
                        fontWeight: '600'
                      }}>
                        Manager {r.status === 'Rejected' ? 'rejected' : 'approved'}
                        {r.comment && `: "${r.comment}"`}
                      </div>
                    )}
                    {r.status === 'Paid' && (
                      <div style={{ color: 'var(--success)', fontWeight: '600' }}>
                        Payment processed by the financial team
                      </div>
                    )}
                    {r.status === 'Approved' && (
                      <div style={{ color: 'var(--info)', fontWeight: '600' }}>
                        Awaiting financial processing
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="pager">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="muted">
              Page {page} / {totalPages} ({total} items)
            </span>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}
