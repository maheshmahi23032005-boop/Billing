import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FinancialDashboard from '../components/FinancialDashboard';
import FinancialAuth from '../components/FinancialAuth';

export default function FinancialDashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="layout-shell">
      <header className="top-bar">
        <Link to="/" className="top-bar-link">
          Home
        </Link>
        <span className="top-bar-user">
          {user?.name} · Financial
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
            background: 'var(--gradient-accent)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            boxShadow: 'var(--shadow)'
          }}>
            Financial
          </div>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              Financial Dashboard
            </h1>
            <p className="lead" style={{ margin: '0.5rem 0 0' }}>
              Process payments for approved requests
            </p>
          </div>
        </div>

        {/* Financial-specific component with authentication */}
        <FinancialAuth>
          <FinancialDashboard />
        </FinancialAuth>
      </main>
    </div>
  );
}
