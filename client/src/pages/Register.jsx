import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'employee', label: 'Employee', description: 'Submit reimbursement requests' },
  { value: 'reviewer', label: 'Reviewer', description: 'View status of reimbursements and payments' },
  { value: 'manager', label: 'Manager', description: 'Approve or reject team reimbursement requests' },
  { value: 'financial', label: 'Financial', description: 'Process payments for approved requests' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Create an account</h1>
          <p className="muted">Start using the billing portal in seconds</p>
        </div>

        <form onSubmit={handleSubmit}>
          <label className="auth-field">
            Full name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </label>
          <label className="auth-field">
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="name@company.com"
            />
          </label>
          <label className="auth-field">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Create a strong password"
            />
          </label>
          <label className="auth-field">
            Select role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {ROLES.find((r) => r.value === role)?.description}
            </div>
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" disabled={submitting} className="auth-submit btn btn-primary">
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Sign in
          </Link>
        </p>

        <div className="auth-info-box">
          <strong>Demo accounts</strong>
          <div>manager@demo.local / password123</div>
          <div>employee@demo.local / password123</div>
          <div>reviewer@demo.local / password123</div>
          <div>financial@demo.local / finance123</div>
        </div>
      </div>
    </div>
  );
}
