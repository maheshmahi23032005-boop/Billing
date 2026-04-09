import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useNotify } from '../context/NotificationContext';

export default function FinancialDashboard() {
  const { success, error: notifyError, info } = useNotify();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('Approved');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [processingPayment, setProcessingPayment] = useState(null);

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

  async function processPayment(id) {
    setProcessingPayment(id);
    setError('');
    try {
      const item = items.find(item => item.id === id);
      const amount = item ? Number(item.amount).toFixed(2) : '0.00';
      const category = item?.category || 'Unknown';
      
      await api.put(`/reimbursement/${id}/payment`, {});
      
      success(
        `💸 Payment of $${amount} for ${category} (Request #${id}) has been processed successfully!`,
        {
          title: 'Payment Processed',
          icon: '💰',
          duration: 5000
        }
      );
      
      await load();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to process payment';
      setError(errorMessage);
      notifyError(
        `❌ Failed to process payment for request #${id}: ${errorMessage}`,
        {
          title: 'Payment Failed',
          icon: '⚠️',
          duration: 6000
        }
      );
    } finally {
      setProcessingPayment(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="panel">
      <h2 className="section-title">💰 Financial Payment Processing</h2>
      <p className="lead">Process payments for manager-approved reimbursements</p>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-card-label">Pending Payments</div>
          <div className="summary-card-value">
            {items.filter(r => r.status === 'Approved').length}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Total Amount</div>
          <div className="summary-card-value">
            ${items
              .filter(r => r.status === 'Approved')
              .reduce((sum, r) => sum + Number(r.amount || 0), 0)
              .toFixed(2)}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-card-label">Processed Today</div>
          <div className="summary-card-value">0</div>
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
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Paid">Paid</option>
            <option value="Rejected">Rejected</option>
          </select>
        </label>
        <label className="inline-label flex-grow">
          Search
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            className="input"
            placeholder="Category, description, or submitter"
          />
        </label>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : items.length === 0 ? (
        <p className="muted">No matching requests found.</p>
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
                  <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                </div>
                <div className="muted small">
                  {formatDate(r.date)}
                  {r.description ? ` · ${r.description}` : null}
                </div>
                <div className="tax-mini">
                  Tax: ${Number(r.taxBreakdown?.taxAmount ?? 0).toFixed(2)} · Total: $
                  {Number(r.taxBreakdown?.totalAmount ?? r.amount).toFixed(2)}
                </div>
                {r.comment ? (
                  <div className="reviewer-note">
                    <strong>Manager Comment:</strong> {r.comment}
                  </div>
                ) : null}
                {r.status === 'Approved' ? (
                  <div className="review-actions">
                    <div className="btn-row">
                      <button
                        type="button"
                        disabled={processingPayment === r.id}
                        onClick={() => processPayment(r.id)}
                        className="btn btn-primary"
                        style={{
                          background: 'var(--gradient-accent)',
                          border: 'none'
                        }}
                      >
                        {processingPayment === r.id ? (
                          <>
                            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                            Processing...
                          </>
                        ) : (
                          <>
                            💸 Process Payment
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : r.status === 'Paid' ? (
                  <div className="reviewer-note" style={{ background: 'var(--success-light)', borderColor: 'var(--success)' }}>
                    <strong>✅ Payment Processed</strong> - Funds have been transferred
                  </div>
                ) : null}
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
