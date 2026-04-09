import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import RoleDashboard from './pages/RoleDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import FinancialDashboardPage from './pages/FinancialDashboardPage';
import ReviewerDashboard from './pages/ReviewerDashboard';

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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Home />} />
      <Route
        path="/dashboard/manager"
        element={
          <ProtectedRoute roles={['manager', 'admin']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/employee"
        element={
          <ProtectedRoute roles={['employee']}>
            <RoleDashboard role="employee" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/reviewer"
        element={
          <ProtectedRoute roles={['reviewer']}>
            <ReviewerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/financial"
        element={
          <ProtectedRoute roles={['financial']}>
            <FinancialDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
