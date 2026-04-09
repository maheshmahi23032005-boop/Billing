import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'employee', label: '👤 Employee', description: 'Submit reimbursement requests' },
  { value: 'reviewer', label: '👁️ Reviewer', description: 'View status of all reimbursements and payments' },
  { value: 'manager', label: '👔 Manager', description: 'Approve/reject team reimbursement requests' },
  { value: 'financial', label: '💰 Financial', description: 'Process payments for approved requests (Secure access required)' },
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
            ✨
          </div>
          <h1>Create Account</h1>
          <p className="muted">Join our billing management system</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <label className="auth-field">
            👤 Full Name
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="Enter your full name"
            />
          </label>
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
              minLength={6}
              autoComplete="new-password"
              placeholder="Create a strong password (min 6 chars)"
            />
          </label>
          <label className="auth-field">
            🎭 Select Role
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '0.75rem 1rem' }}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-secondary)', 
              marginTop: '0.5rem',
              fontStyle: 'italic'
            }}>
              {ROLES.find(r => r.value === role)?.description}
            </div>
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button type="submit" disabled={submitting} className="auth-submit">
            {submitting ? (
              <>
                <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                Creating Account…
              </>
            ) : (
              <>
                🚀 Create Account
              </>
            )}
          </button>
        </form>
        
        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>Sign in here</Link>
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
