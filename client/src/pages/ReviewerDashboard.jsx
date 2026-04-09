import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewerStatusDashboard from '../components/ReviewerStatusDashboard';

export default function ReviewerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="layout-shell">
      <header className="top-bar">
        <Link to="/" className="top-bar-link">
          Home
        </Link>
        <span className="top-bar-user">
          {user?.name} · Reviewer
        </span>
        <button type="button" onClick={logout} className="btn btn-ghost top-bar-logout">
          Log out
        </button>
      </header>
      
      <main className="layout-main">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'var(--gradient-secondary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            boxShadow: 'var(--shadow)'
          }}>
            Reviewer
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              Reviewer Dashboard
            </h1>
            <p className="lead" style={{ margin: '0.5rem 0 0' }}>
              View status of all reimbursements and payments
            </p>
          </div>
        </div>

        {/* Reviewer-specific component */}
        <ReviewerStatusDashboard />
      </main>
    </div>
  );
}
