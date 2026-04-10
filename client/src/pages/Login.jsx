import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getRolePath = (role) => {
  switch (role) {
    case 'admin':
    case 'manager':
      return '/dashboard/manager';
    case 'employee':
      return '/dashboard/employee';
    case 'reviewer':
      return '/dashboard/reviewer';
    case 'financial':
      return '/dashboard/financial';
    default:
      return '/dashboard/employee';
  }
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email.trim(), password);
      const dashboardPath = location.state?.from?.pathname || getRolePath(user.role);
      navigate(dashboardPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo">BB</div>
          <div className="auth-brand-copy">
            <h1>Balfour Beatty</h1>
            <p className="muted">Access your corporate billing workspace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              placeholder="Enter your password"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" disabled={submitting} className="auth-submit btn btn-primary">
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          New to the system?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Create an account
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
