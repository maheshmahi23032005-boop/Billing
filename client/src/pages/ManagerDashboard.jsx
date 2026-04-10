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
        <section className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
            Manager dashboard
          </h1>
          <p className="lead">
            Review, approve, and manage reimbursements for your team with clarity.
          </p>
        </section>

        <AdminInsights />
        <ReviewReimbursements />
      </main>
    </div>
  );
}
