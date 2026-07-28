import { useNavigate } from 'react-router-dom';
import { Car, LogOut } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function DriverDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card-md border border-slate-100 p-7 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 text-primary rounded-2xl mb-4">
          <Car size={28} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Driver</h1>
        <p className="text-sm text-slate-500 mt-2">
          Halo, {user?.name || 'Driver'}. Fondasi autentikasi Driver Dashboard sudah siap.
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="btn-secondary justify-center mt-6 w-full py-2.5"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  );
}
