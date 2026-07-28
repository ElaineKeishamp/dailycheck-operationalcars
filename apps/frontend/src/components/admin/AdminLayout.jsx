import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

// Map routes to page titles
const PAGE_TITLES = {
  '/admin/dashboard': { title: 'Dashboard', subtitle: null },
  '/admin/reports': { title: 'Laporan Harian', subtitle: null },
  '/admin/users': { title: 'Manajemen User', subtitle: null },
  '/admin/vehicles': { title: 'Manajemen Mobil', subtitle: null },
  '/admin/profile': { title: 'Profil Admin', subtitle: null },
};

function getPageMeta(pathname) {
  // Check exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // Check prefix for nested routes (e.g. /admin/reports/:id)
  for (const [key, value] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key)) return value;
  }
  return { title: 'Admin', subtitle: null };
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { title, subtitle } = getPageMeta(pathname);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Fixed sidebar */}
      <AdminSidebar />

      {/* Main content area — offset by sidebar width */}
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
        <AdminHeader title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
