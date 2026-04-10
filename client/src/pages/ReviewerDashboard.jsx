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
        <section className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
            Reviewer dashboard
          </h1>
          <p className="lead">
            Monitor reimbursement workflows and audit payment progress.
          </p>
        </section>

        <ReviewerStatusDashboard />
      </main>
    </div>
  );
}
