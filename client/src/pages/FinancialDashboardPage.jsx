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
        <section className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
            Financial dashboard
          </h1>
          <p className="lead">
            Handle approved reimbursements, execute payments, and keep financial records current.
          </p>
        </section>

        <FinancialAuth>
          <FinancialDashboard />
        </FinancialAuth>
      </main>
    </div>
  );
}
