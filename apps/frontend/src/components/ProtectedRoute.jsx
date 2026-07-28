import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Spinner shown while auth is being restored from localStorage
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * ProtectedRoute: requires the user to be authenticated.
 * Redirects to /login if not logged in.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

/**
 * AdminRoute: requires the user to be authenticated AND have role 'admin'.
 * Redirects to /login if not authenticated, or /access-denied if not admin.
 */
export function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/access-denied" replace />;

  return children;
}

export default ProtectedRoute;
