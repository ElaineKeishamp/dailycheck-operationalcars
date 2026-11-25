import { Menu } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import Avatar from './ui/Avatar';
import { BUSINESS_TIME_ZONE } from '../../utils/businessDate';

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: BUSINESS_TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(date).toUpperCase();
}

export default function AdminHeader({ title, subtitle, onOpenMenu }) {
  const { user } = useAuth();
  const today = new Date();

  return (
    <header className="min-h-20 flex flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-8">      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label="Buka menu admin"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{title}</h1>
          {subtitle ? (
            <p className="truncate text-xs text-slate-400">{subtitle}</p>
          ) : (
            <p className="truncate text-xs text-slate-400">{formatDate(today)}</p>
          )}
        </div>
      </div>      <div className="flex flex-shrink-0 items-center gap-1 sm:gap-3">
        <div className="flex items-center gap-2.5 border-l border-slate-100 pl-2">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-slate-800">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
          <Avatar name={user?.name || 'A'} size="md" />
        </div>
      </div>
    </header>
  );
}
