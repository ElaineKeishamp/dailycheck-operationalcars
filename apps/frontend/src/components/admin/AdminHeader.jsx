import { Bell, Calendar } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import Avatar from './ui/Avatar';

function formatDate(date) {
  const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const day = DAYS[date.getDay()];
  const d = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day.toUpperCase()}, ${d} ${month.toUpperCase()} ${year}`;
}

export default function AdminHeader({ title, subtitle }) {
  const { user } = useAuth();
  const today = new Date();

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-6 flex items-center justify-between flex-shrink-0">
      {/* Left: Page title + date */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
        {subtitle ? (
          <p className="text-xs text-slate-400">{subtitle}</p>
        ) : (
          <p className="text-xs text-slate-400">{formatDate(today)}</p>
        )}
      </div>

      {/* Right: Actions + user */}
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Calendar size={18} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-400">Super Admin</p>
          </div>
          <Avatar name={user?.name || 'A'} size="md" />
        </div>
      </div>
    </header>
  );
}
