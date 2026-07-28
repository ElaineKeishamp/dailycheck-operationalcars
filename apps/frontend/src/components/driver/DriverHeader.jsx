import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/useAuth';

export default function DriverHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const todayLabel = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white border border-slate-100 rounded-xl shadow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-blue-100 text-primary flex items-center justify-center flex-shrink-0">
            <UserCircle size={25} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Driver</p>
            <h1 className="text-lg font-bold text-slate-900 truncate">{user?.name || 'Driver'}</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-11 h-11 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 inline-flex items-center justify-center transition-colors flex-shrink-0"
          aria-label="Logout dari akun driver"
        >
          <LogOut size={19} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <CalendarDays size={17} className="text-primary flex-shrink-0" aria-hidden="true" />
        <span>{todayLabel}</span>
      </div>
    </header>
  );
}
