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

  // If user is not financial, don't render anything
  if (user?.role !== 'financial') {
    return null;
  }

  // If already authenticated, show the children
  if (isAuthenticated) {
    return children;
  }

  async function handleFinancialAuth(e) {
    e.preventDefault();
    setAuthError('');
    setAuthenticating(true);

    try {
      // Simulate financial authentication (in production, this would be a secure API call)
      const validCredentials = {
        email: 'financial@demo.local',
        password: 'finance123'
      };

      if (email === validCredentials.email && password === validCredentials.password) {
        setIsAuthenticated(true);
        success(
          '🔐 Financial access granted. You can now process payments.',
          {
            title: 'Authentication Successful',
            icon: '💰',
            duration: 4000
          }
        );
      } else {
        throw new Error('Invalid financial credentials');
      }
    } catch (err) {
      const errorMessage = err.message || 'Authentication failed';
      setAuthError(errorMessage);
      notifyError(
        `❌ Financial authentication failed: ${errorMessage}`,
        {
          title: 'Access Denied',
          icon: '🔒',
          duration: 5000
        }
      );
    } finally {
      setAuthenticating(false);
    }
  }

  return (
    <div className="layout-shell">
      <div className="layout-main" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '80vh'
      }}>
        <div className="card" style={{ 
          maxWidth: '500px', 
          width: '100%',
          textAlign: 'center',
          padding: '3rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--gradient-accent)',
            borderRadius: '50%',
            margin: '0 auto 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '36px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            🔐
          </div>
          
          <h2 style={{ margin: '0 0 1rem', color: 'var(--text-primary)' }}>
            Financial Access Required
          </h2>
          
          <p style={{ 
            margin: '0 0 2rem', 
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            For security reasons, financial team members must authenticate with their financial credentials to access payment processing features.
          </p>

          <form onSubmit={handleFinancialAuth}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-field">
                📧 Financial Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                  placeholder="Enter your financial email"
                  style={{ textAlign: 'center' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-field">
                🔒 Financial Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="Enter your financial password"
                  style={{ textAlign: 'center' }}
                />
              </label>
            </div>

            {authError ? (
              <div className="form-error" style={{ marginBottom: '1rem' }}>
                {authError}
              </div>
            ) : null}

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={authenticating}
              style={{
                width: '100%',
                background: 'var(--gradient-accent)',
                border: 'none',
                padding: '1rem',
                fontSize: '1.1rem'
              }}
            >
              {authenticating ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                  Authenticating...
                </>
              ) : (
                <>
                  🔐 Authenticate Financial Access
                </>
              )}
            </button>
          </form>

          <div style={{ 
            marginTop: '2rem', 
            padding: '1rem', 
            background: 'var(--surface-elevated)', 
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-light)'
          }}>
            <strong>Demo Financial Credentials:</strong><br/>
            📧 financial@demo.local<br/>
            🔒 finance123
          </div>
        </div>
      </div>
    </div>
  );
}
