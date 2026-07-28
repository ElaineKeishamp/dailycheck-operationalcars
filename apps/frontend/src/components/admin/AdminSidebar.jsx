import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Car,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/reports', label: 'Laporan Harian', icon: FileText },
  { to: '/admin/users', label: 'Manajemen User', icon: Users },
  { to: '/admin/vehicles', label: 'Manajemen Mobil', icon: Car },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-[220px] bg-sidebar flex flex-col z-40 select-none">
      {/* Logo / Brand */}
      <div className="px-5 py-6 border-b border-white/10">
        {/* Icon */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Car size={16} className="text-white" />
          </div>
          <span className="text-white font-bold text-base leading-tight">
            Lintasarta
          </span>
        </div>
        <div className="pl-10">
          <p className="text-white font-semibold text-sm leading-tight">Daily Check</p>
          <p className="text-slate-400 text-xs">Operational Cars</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <NavLink
          to="/admin/profile"
          className={({ isActive }) =>
            `sidebar-nav-item ${isActive ? 'active' : ''}`
          }
        >
          <UserCircle size={18} className="flex-shrink-0" />
          <span>Profil Admin</span>
        </NavLink>
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
