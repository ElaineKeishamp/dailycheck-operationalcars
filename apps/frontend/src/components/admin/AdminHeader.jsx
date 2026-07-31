import { Bell, Calendar, Menu } from 'lucide-react';
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

export default function AdminHeader({ title, subtitle, onOpenMenu }) {
  const { user } = useAuth();
  const today = new Date();

  return (
    <header className="min-h-16 flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-3 py-3 sm:px-6">
      {/* Left: Page title + date */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Buka menu admin"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight text-slate-900 sm:text-xl">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-slate-400">{subtitle}</p>
          ) : (
            <p className="truncate text-xs text-slate-400">{formatDate(today)}</p>
          )}
        </div>
      </div>

      {/* Right: Actions + user */}
      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-3">
        <button className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:flex">
          <Calendar size={18} />
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-2.5 border-l border-slate-100 pl-2">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-slate-800">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-400">Super Admin</p>
          </div>
          <Avatar name={user?.name || 'A'} size="md" />
        </div>
      </div>
    </header>
  );
}
