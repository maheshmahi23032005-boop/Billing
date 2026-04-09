import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const getRolePath = (role) => {
  if (!role) return '/dashboard/employee';
  switch (role) {
    case 'admin':
      return '/dashboard/manager';
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'var(--gradient-primary)',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            💼
          </div>
          <h1>Welcome Back</h1>
          <p className="muted">Sign in to your billing portal</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <label className="auth-field">
            📧 Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="Enter your email"
            />
          </label>
          <label className="auth-field">
            🔒 Password
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
          <button type="submit" disabled={submitting} className="auth-submit">
            {submitting ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                Signing in…
              </>
            ) : (
              <>
                🚀 Sign in
              </>
            )}
          </button>
        </form>
        
        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600' }}>Create one</Link>
        </p>
        
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'var(--surface-elevated)',
          borderRadius: 'var(--radius)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)'
        }}>
          <strong>Demo Accounts:</strong><br/>
          👔 manager@demo.local / password123<br/>
          👤 employee@demo.local / password123<br/>
          👁️ reviewer@demo.local / password123<br/>
          💰 financial@demo.local / finance123
        </div>
      </div>
    </div>
  );
}
