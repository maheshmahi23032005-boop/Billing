import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Handle backward compatibility for old 'admin' role
const normalizeRole = (role) => {
  if (role === 'admin') return 'manager';
  return role;
};

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedRole = normalizeRole(user.role);
  if (roles && !roles.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
