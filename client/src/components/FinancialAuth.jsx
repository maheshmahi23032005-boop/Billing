import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';

export default function FinancialAuth({ children }) {
  const { user } = useAuth();
  const { success, error: notifyError } = useNotify();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  if (user?.role !== 'financial') {
    return null;
  }

  if (isAuthenticated) {
    return children;
  }

  async function handleFinancialAuth(e) {
    e.preventDefault();
    setAuthError('');
    setAuthenticating(true);

    try {
      const validCredentials = {
        email: 'financial@demo.local',
        password: 'finance123',
      };

      if (email === validCredentials.email && password === validCredentials.password) {
        setIsAuthenticated(true);
        success('Financial access granted. You can now process payments.', {
          title: 'Authentication successful',
          duration: 4000,
        });
      } else {
        throw new Error('Invalid financial credentials');
      }
    } catch (err) {
      const errorMessage = err.message || 'Authentication failed';
      setAuthError(errorMessage);
      notifyError(`Financial authentication failed: ${errorMessage}`, {
        title: 'Access denied',
        duration: 5000,
      });
    } finally {
      setAuthenticating(false);
    }
  }

  return (
    <div className="layout-shell">
      <div className="layout-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="card auth-card" style={{ maxWidth: '520px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2>Finance access required</h2>
            <p className="muted">Enter your financial credentials to continue with payment processing.</p>
          </div>

          <form onSubmit={handleFinancialAuth}>
            <label className="auth-field">
              Financial email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="financial@demo.local"
              />
            </label>

            <label className="auth-field">
              Financial password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="Enter your password"
              />
            </label>

            {authError ? <div className="form-error">{authError}</div> : null}

            <button type="submit" className="btn btn-primary" disabled={authenticating} style={{ width: '100%', padding: '1rem' }}>
              {authenticating ? 'Authenticating...' : 'Authenticate access'}
            </button>
          </form>

          <div className="auth-info-box" style={{ marginTop: '2rem' }}>
            <strong>Demo credentials</strong>
            <div>financial@demo.local</div>
            <div>finance123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
