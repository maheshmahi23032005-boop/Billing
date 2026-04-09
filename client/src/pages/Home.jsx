import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="layout-shell">
        <div className="layout-main" style={{ 
          textAlign: 'center', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh'
        }}>
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
            <h2>Loading your workspace...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

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

// Temporary fix: Force manager role if email contains 'manager'
const effectiveRole = user?.role || (user?.email?.includes('manager') ? 'manager' : 'employee');
const dashPath = getRolePath(effectiveRole);

  
  const roleIcons = {
    manager: '👔',
    reviewer: '👁️',
    employee: '👤',
    financial: '💰'
  };

  const roleDescriptions = {
    manager: 'Approve or reject team reimbursement requests',
    reviewer: 'View status of all reimbursements and payment processing',
    employee: 'Submit and track your reimbursement requests',
    financial: 'Process payments for manager-approved requests'
  };

  return (
    <div className="layout-shell">
      <header className="home-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--gradient-primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px'
          }}>
            💼
          </div>
          <strong style={{ fontSize: '1.2rem' }}>Billing Portal</strong>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="top-bar-user">
            <span style={{ marginRight: '0.5rem' }}>{roleIcons[user.role]}</span>
            {user.name} · {user.role}
          </div>
          <button type="button" onClick={logout} className="home-logout">
            🚪 Log out
          </button>
        </div>
      </header>
      
      <main className="home-main">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'var(--gradient-primary)',
            borderRadius: '50%',
            margin: '0 auto 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '36px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {roleIcons[user.role]}
          </div>
          
          <h1 style={{ marginTop: 0, marginBottom: '1rem' }}>
            Welcome back, {user.name}! 👋
          </h1>
          
          <div style={{
            background: 'var(--surface-elevated)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
              Your Role: <span style={{ color: 'var(--primary)' }}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              {roleDescriptions[user.role]}
            </p>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          <div className="summary-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Dashboard</h3>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>
              Access your personalized workspace
            </p>
          </div>
          
          <div className="summary-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💰</div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Reimbursements</h3>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>
              Manage expense requests and payments
            </p>
          </div>
          
          <div className="summary-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📈</div>
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Analytics</h3>
            <p style={{ margin: '0 0 1rem', color: 'var(--text-secondary)' }}>
              View insights and reports
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p className="lead" style={{ marginBottom: '2rem' }}>
            Ready to manage your billing and reimbursements?
          </p>
          <Link to={dashPath} className="home-cta">
            🚀 Open Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
