import { useEffect, useState } from 'react';
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <AdminSidebar className="hidden lg:flex" />

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu admin"
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <AdminSidebar
            className="flex shadow-2xl"
            onNavigate={() => setMobileSidebarOpen(false)}
          />
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-col lg:ml-[220px]">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          onOpenMenu={() => setMobileSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1 overflow-x-hidden p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
