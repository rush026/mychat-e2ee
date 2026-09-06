import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { FullPageSpinner } from '../ui/Spinner';

/**
 * Protected route wrapper — redirects to login if not authenticated.
 */
export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/chat" replace />;
  }

  return children;
}
