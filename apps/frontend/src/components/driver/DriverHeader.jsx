import { useNavigate } from 'react-router-dom';
import { CalendarDays, LogOut } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { BUSINESS_TIME_ZONE } from '../../utils/businessDate';
import BrandLogo from '../BrandLogo';

export default function DriverHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const todayLabel = new Intl.DateTimeFormat('id-ID', {
      timeZone: BUSINESS_TIME_ZONE,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="rounded-2xl bg-sidebar p-5 text-white sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo className="w-20" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-100">Daily Check · Driver</p>
            <h1 className="text-xl font-bold text-white truncate">{user?.name || 'Driver'}</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="min-h-11 rounded-lg border border-blue-200/50 px-3 text-white hover:bg-white/10 inline-flex gap-2 items-center justify-center transition-colors flex-shrink-0"
          aria-label="Logout dari akun driver"
        >
          <LogOut size={19} aria-hidden="true" />
          <span className="hidden text-sm font-medium sm:inline">Keluar</span>
        </button>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-white/15 pt-4 text-sm text-blue-100">
        <CalendarDays size={17} className="flex-shrink-0" aria-hidden="true" />
        <span>{todayLabel}</span>
      </div>
    </header>
  );
}
