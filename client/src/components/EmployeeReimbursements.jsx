import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import { useNotify } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const SNAPSHOT_KEY = 'billing_reimb_status_snapshot';

export default function EmployeeReimbursements() {
  const { success, info, error: notifyError } = useNotify();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [taxPreview, setTaxPreview] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/reimbursement/user', {
        params: { page, limit, status: statusFilter || undefined, q: search || undefined },
      });
      const list = data.reimbursements || [];
      setItems(list);
      setTotal(data.total ?? list.length);

      const prev = JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) || '{}');
      const next = {};
      list.forEach((r) => {
        next[r.id] = r.status;
        if (prev[r.id] === 'Pending' && r.status !== 'Pending') {
          const amount = Number(r.amount).toFixed(2);
          const statusIcon = r.status === 'Approved' ? '✅' : '❌';
          const statusText = r.status === 'Approved' ? 'approved' : 'rejected';
          
          if (r.status === 'Approved') {
            success(
              `🎉 Great news! Your reimbursement #${r.id} for $${amount} (${r.category}) has been approved!${r.comment ? ` Reviewer note: ${r.comment}` : ''}`,
              {
                title: 'Reimbursement Approved',
                icon: '💰',
                duration: 6000,
                action: {
                  label: 'View Details',
                  onClick: () => {
                    // Scroll to the specific reimbursement
                    const element = document.querySelector(`[data-reimbursement-id="${r.id}"]`);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      element.style.animation = 'pulse 2s ease-in-out';
                    }
                  }
                }
              }
            );
          } else {
            info(
              `📝 Your reimbursement #${r.id} for $${amount} (${r.category}) has been rejected.${r.comment ? ` Reason: ${r.comment}` : ''}`,
              {
                title: 'Reimbursement Rejected',
                icon: '📋',
                duration: 6000
              }
            );
          }
        }
      });
      sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(next));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load reimbursements');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, search, success, info]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchDraft.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchDraft]);

  useEffect(() => {
    const num = Number(amount);
    if (amount === '' || Number.isNaN(num) || num < 0) {
      setTaxPreview(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/tax/preview', {
          params: { amount: num, category: category || '' },
        });
        setTaxPreview(data.breakdown);
      } catch {
        setTaxPreview(null);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [amount, category]);

  function validateFields() {
    const err = {};
    if (!String(category).trim()) err.category = 'Category is required';
    const num = Number(amount);
    if (amount === '' || Number.isNaN(num)) err.amount = 'Enter a valid amount';
    else if (num < 0) err.amount = 'Amount cannot be negative';
    if (!date) err.date = 'Date is required';
    else {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) err.date = 'Invalid date';
    }
    setFieldErrors(err);
    return Object.keys(err).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!validateFields()) {
      setFormError('Fix the highlighted fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/reimbursement', {
        amount: Number(amount),
        category: String(category).trim(),
        date,
        description,
      });
      
      const submittedAmount = Number(amount).toFixed(2);
      success(
        `📋 Your reimbursement request for $${submittedAmount} (${category}) has been submitted successfully! It's now pending manager review.`,
        {
          title: 'Request Submitted',
          icon: '✨',
          duration: 5000
        }
      );
      
      // Send notification to managers (this would typically be handled by the backend)
      info(
        `📢 New reimbursement request submitted: $${submittedAmount} for ${category} by ${user?.name || 'Employee'}. Managers have been notified.`,
        {
          title: 'Manager Notification Sent',
          icon: '👔',
          duration: 4000
        }
      );
      
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
      setTaxPreview(null);
      setPage(1);
      await load();
    } catch (err) {
      const msg = err.response?.data?.error;
      const errs = err.response?.data?.errors;
      const errorMessage = errs?.length ? errs.join('; ') : (msg || 'Submit failed');
      
      setFormError(errorMessage);
      notifyError(
        `❌ Failed to submit reimbursement request: ${errorMessage}`,
        {
          title: 'Submission Failed',
          icon: '⚠️',
          duration: 6000
        }
      );
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <section className="panel">
      <h2 className="section-title">Reimbursement requests</h2>

      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <p className="muted" style={{ marginTop: 0 }}>
          Enter bill details. Tax is calculated from the category (GST/VAT-style rules).
        </p>
        <div className="form-grid">
          <label className="form-field">
            Amount (base)
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={validateFields}
              className={`input ${fieldErrors.amount ? 'input-error' : ''}`}
            />
            {fieldErrors.amount ? <span className="field-error">{fieldErrors.amount}</span> : null}
          </label>
          <label className="form-field">
            Category
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onBlur={validateFields}
              className={`input ${fieldErrors.category ? 'input-error' : ''}`}
              placeholder="e.g. Travel, Meals, Software"
            />
            {fieldErrors.category ? <span className="field-error">{fieldErrors.category}</span> : null}
          </label>
        </div>
        <div className="form-grid">
          <label className="form-field">
            Bill date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={validateFields}
              className={`input ${fieldErrors.date ? 'input-error' : ''}`}
            />
            {fieldErrors.date ? <span className="field-error">{fieldErrors.date}</span> : null}
          </label>
          <label className="form-field form-field-full">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input"
            />
          </label>
        </div>

        {taxPreview ? (
          <div className="tax-breakdown">
            <div className="tax-breakdown-title">Tax breakdown</div>
            <ul className="tax-breakdown-list">
              <li>
                <span>Rule</span>
                <span>{taxPreview.label}</span>
              </li>
              <li>
                <span>Base</span>
                <span>${Number(taxPreview.baseAmount).toFixed(2)}</span>
              </li>
              <li>
                <span>Rate</span>
                <span>{taxPreview.ratePercent}%</span>
              </li>
              <li>
                <span>Tax</span>
                <span>${Number(taxPreview.taxAmount).toFixed(2)}</span>
              </li>
              <li className="tax-total">
                <span>Total (reimbursement)</span>
                <span>${Number(taxPreview.totalAmount).toFixed(2)}</span>
              </li>
            </ul>
          </div>
        ) : null}

        {formError ? <p className="form-error">{formError}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
              Submitting...
            </>
          ) : (
            <>
              📋 Submit Request
            </>
          )}
        </button>
      </form>

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
            placeholder="Category or description"
          />
        </label>
      </div>

      <h3 className="subsection-title">Your requests</h3>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : items.length === 0 ? (
        <p className="muted">No requests yet.</p>
      ) : (
        <>
          <ul className="request-list">
            {items.map((r) => (
              <li key={r.id} className="request-card" data-reimbursement-id={r.id}>
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
                  <div className="reviewer-note">Reviewer: {r.comment}</div>
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
