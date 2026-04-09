import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminInsights from '../components/AdminInsights';
import ReviewReimbursements from '../components/ReviewReimbursements';

export default function ManagerDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="layout-shell">
      <header className="top-bar">
        <Link to="/" className="top-bar-link">
          Home
        </Link>
        <span className="top-bar-user">
          {user?.name} · Manager
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
            background: 'var(--gradient-primary)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            boxShadow: 'var(--shadow)'
          }}>
            Manager
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

        {/* Manager-specific components */}
        <AdminInsights />
        <ReviewReimbursements />
      </main>
    </div>
  );
}
