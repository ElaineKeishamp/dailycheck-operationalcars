import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Car,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import BrandLogo from '../BrandLogo';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/reports', label: 'Laporan Harian', icon: FileText },
  { to: '/admin/users', label: 'Manajemen User', icon: Users },
  { to: '/admin/vehicles', label: 'Manajemen Mobil', icon: Car },
];

export default function AdminSidebar({ className = '', onNavigate }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onNavigate?.();
    logout();
    navigate('/login');
  };

  return (
    <aside className={`fixed left-0 top-0 z-50 h-screen w-[min(86vw,220px)] flex-col bg-sidebar select-none ${className}`}>
      <div className="px-5 py-8 border-b border-white/15">
        <BrandLogo className="w-28" />
        <p className="mt-2 text-sm font-semibold text-white">Lintasarta</p>
        <p className="mt-1 text-xs text-blue-100">Operational Cars</p>
      </div>      <nav aria-label="Menu utama admin" className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={18} className="flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
