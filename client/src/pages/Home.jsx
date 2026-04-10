import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="layout-shell">
        <div className="layout-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Loading your dashboard…</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

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

  const dashPath = getRolePath(user.role);

  const roleDescriptions = {
    manager: 'Manage approval workflows, review requests, and coordinate payouts.',
    reviewer: 'Track reimbursement statuses and financial processing at a glance.',
    employee: 'Submit new expense claims and follow approval progress.',
    financial: 'Review approved requests and execute secure payments.',
  };

  return (
    <div className="layout-shell home-page">
      <header className="home-header">
        <div>
          <div className="eyebrow">Billing platform</div>
          <h1 className="hero-title">Modern reimbursement management for teams</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="top-bar-user">
            <strong style={{ color: 'var(--primary)' }}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</strong>
          </div>
          <button type="button" onClick={logout} className="btn btn-ghost">
            Log out
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Dashboard overview</span>
            <h1 className="hero-title">Your finance workspace is ready</h1>
            <p className="lead">A clean, professional interface for managing reimbursements, approvals, reports, and payments.</p>

            <div className="hero-actions">
              <Link to={dashPath} className="btn btn-primary btn-creative">
                <div className="btn-content">
                  <div className="btn-icon">🚀</div>
                  <div className="btn-text">
                    <span className="btn-main-text">Open dashboard</span>
                    <span className="btn-sub-text">Access your workspace</span>
                  </div>
                </div>
                <div className="btn-glow"></div>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
