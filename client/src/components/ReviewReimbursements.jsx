import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useNotify } from '../context/NotificationContext';

export default function ReviewReimbursements() {
  const { success, error: notifyError, info } = useNotify();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comments, setComments] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/reimbursement/all', {
        params: { page, limit, status: statusFilter || undefined, q: search || undefined },
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

  function setComment(id, value) {
    setComments((c) => ({ ...c, [id]: value }));
  }

  async function act(id, action) {
    setBusyId(id);
    setError('');
    try {
      const comment = comments[id] ?? '';
      const item = items.find(item => item.id === id);
      const amount = item ? Number(item.amount).toFixed(2) : '0.00';
      const category = item?.category || 'Unknown';
      
      await api.put(`/reimbursement/${id}/${action}`, { comment });
      
      if (action === 'approve') {
        success(
          `✅ Reimbursement #${id} for $${amount} (${category}) has been approved!`,
          {
            title: 'Request Approved',
            icon: '🎉',
            duration: 5000
          }
        );
      } else {
        info(
          `❌ Reimbursement #${id} for $${amount} (${category}) has been rejected.${comment ? ` Reason: ${comment}` : ''}`,
          {
            title: 'Request Rejected',
            icon: '📝',
            duration: 5000
          }
        );
      }
      
      await load();
    } catch (err) {
      const errorMessage = err.response?.data?.error || `Failed to ${action} request`;
      setError(errorMessage);
      notifyError(
        `Failed to ${action} reimbursement #${id}: ${errorMessage}`,
        {
          title: 'Action Failed',
          icon: '⚠️',
          duration: 6000
        }
      );
    } finally {
      setBusyId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="panel">
      <h2 className="section-title">Review queue</h2>

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
        <p className="muted">No matching requests.</p>
      ) : (
        <>
          <ul className="request-list">
            {items.map((r) => (
              <li key={r.id} className="request-card">
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
                  Tax ${Number(r.taxBreakdown?.taxAmount ?? 0).toFixed(2)} · Total $
                  {Number(r.taxBreakdown?.totalAmount ?? r.amount).toFixed(2)} · {r.taxBreakdown?.label}
                </div>
                {r.status !== 'Pending' && r.comment ? (
                  <div className="reviewer-note">
                    <strong>Comment:</strong> {r.comment}
                  </div>
                ) : null}
                {r.status === 'Pending' ? (
                  <div className="review-actions">
                    <div style={{ 
                      background: 'var(--info-light)', 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius)', 
                      marginBottom: '1rem',
                      border: '1px solid var(--info)',
                      fontSize: '0.9rem'
                    }}>
                      📋 <strong>Manager Review Required:</strong> This request is pending your approval. Once approved, it will move to financial processing.
                    </div>
                    <label className="form-field form-field-full">
                      Review comment (optional)
                      <textarea
                        value={comments[r.id] ?? ''}
                        onChange={(e) => setComment(r.id, e.target.value)}
                        rows={2}
                        className="input"
                        placeholder="Add any notes for the financial team..."
                      />
                    </label>
                    <div className="btn-row">
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, 'approve')}
                        className="btn btn-success"
                      >
                        {busyId === r.id ? (
                          <>
                            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                            Processing...
                          </>
                        ) : (
                          <>
                            ✅ Approve for Payment
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => act(r.id, 'reject')}
                        className="btn btn-danger"
                      >
                        {busyId === r.id ? (
                          <>
                            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                            Processing...
                          </>
                        ) : (
                          <>
                            ❌ Reject Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : r.status === 'Approved' ? (
                  <div className="reviewer-note" style={{ 
                    background: 'var(--success-light)', 
                    borderColor: 'var(--success)',
                    color: 'var(--success-hover)'
                  }}>
                    <strong>✅ Approved for Payment</strong>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                      This request has been approved and is now ready for financial processing. The financial team will handle the payment.
                    </p>
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
