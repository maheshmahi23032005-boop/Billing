import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import AdminInsights from '../components/AdminInsights';
import EmployeeReimbursements from '../components/EmployeeReimbursements';
import ReviewReimbursements from '../components/ReviewReimbursements';
import ReviewerStatusDashboard from '../components/ReviewerStatusDashboard';
import FinancialDashboard from '../components/FinancialDashboard';
import FinancialAuth from '../components/FinancialAuth';
import { useAuth } from '../context/AuthContext';

// Handle backward compatibility for old 'admin' role
const getRolePath = (role) => {
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

const paths = {
  manager: getRolePath('manager'),
  employee: getRolePath('employee'),
  reviewer: getRolePath('reviewer'),
  financial: getRolePath('financial'),
};

const roleIcons = {
  manager: '',
  employee: '',
  reviewer: '',
  financial: ''
};

const roleColors = {
  manager: 'var(--gradient-primary)',
  employee: 'var(--gradient-success)',
  reviewer: 'var(--gradient-secondary)',
  financial: 'var(--gradient-accent)'
};

export default function RoleDashboard({ role }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  // For manager role, we don't need to load API data
  // The components will handle their own data loading
  useEffect(() => {
    // Only load API data for non-manager roles
    if (role !== 'manager') {
      let cancelled = false;
      (async () => {
        try {
          const res = await api.get(paths[role]);
          if (!cancelled) setData(res.data);
        } catch (err) {
          if (!cancelled) setError(err.response?.data?.error || 'Failed to load dashboard');
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [role]);

  if (error) {
    return (
      <div className="layout-shell">
        <header className="top-bar">
          <Link to="/" className="top-bar-link">
            Home
          </Link>
          <span className="top-bar-user">
            {user?.name} · {user?.role}
          </span>
          <button type="button" onClick={logout} className="btn btn-ghost top-bar-logout">
            Log out
          </button>
        </header>
        <main className="layout-main">
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Error loading dashboard</h2>
            <p className="form-error">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary" 
              style={{ marginTop: '1rem' }}
            >
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!data && role !== 'manager') {
    return (
      <div className="layout-shell">
        <header className="top-bar">
          <Link to="/" className="top-bar-link">
            Home
          </Link>
          <span className="top-bar-user">
            {user?.name} · {user?.role}
          </span>
          <button type="button" onClick={logout} className="btn btn-ghost top-bar-logout">
            Log out
          </button>
        </header>
        <main className="layout-main">
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Loading your workspace...</h2>
            <p className="muted">Preparing your personalized dashboard</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="layout-shell">
      <header className="top-bar">
        <Link to="/" className="top-bar-link">
          Home
        </Link>
        <span className="top-bar-user">
          {user?.name} · {user?.role}
        </span>
        <button type="button" onClick={logout} className="btn btn-ghost top-bar-logout">
          Log out
        </button>
      </header>
      
      <main className="layout-main">
        {/* For non-manager roles, show summary and loading */}
        {role !== 'manager' && (
          <>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              marginBottom: '2rem' 
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                background: roleColors[role],
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '24px',
                boxShadow: 'var(--shadow)'
              }}>
                {roleIcons[role]}
              </div>
              <div>
                <h1 className="page-title" style={{ margin: 0 }}>
                  {role.charAt(0).toUpperCase() + role.slice(1)} Dashboard
                </h1>
                <p className="lead" style={{ margin: '0.5rem 0 0' }}>
                  {role === 'employee' && 'Submit and track your reimbursement requests'}
                  {role === 'reviewer' && 'View status of all reimbursements and payments'}
                  {role === 'financial' && 'Process payments for approved requests'}
                </p>
              </div>
            </div>

            <div className="summary-grid">
              {Object.entries(data?.summary || {}).map(([k, v]) => (
                <div key={k} className="summary-card">
                  <div className="summary-card-label">
                    {k.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="summary-card-value">{v}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Manager role specific header */}
        {role === 'manager' && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '2rem' 
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: roleColors[role],
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              boxShadow: 'var(--shadow)'
            }}>
              {roleIcons[role]}
            </div>
            <div>
              <h1 className="page-title" style={{ margin: 0 }}>
                Manager Dashboard
              </h1>
              <p className="lead" style={{ margin: '0.5rem 0 0' }}>
                Manage team reimbursements and approve/reject requests
              </p>
            </div>
          </div>
        )}

        {/* Role-specific components */}
        {role === 'manager' && (
          <>
            <AdminInsights />
            <ReviewReimbursements />
          </>
        )}
        {role === 'employee' && <EmployeeReimbursements />}
        {role === 'reviewer' && <ReviewerStatusDashboard />}
        {role === 'financial' && (
            <FinancialAuth>
              <FinancialDashboard />
            </FinancialAuth>
          )}
      </main>
    </div>
  );
}
