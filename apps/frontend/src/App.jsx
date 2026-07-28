import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute } from './components/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

// Admin layout + pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminReportDetailPage from './pages/admin/AdminReportDetailPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminVehiclesPage from './pages/admin/AdminVehiclesPage';

// Note: Driver-side pages (/dashboard, /change-password, etc.) will be
// added by a separate developer and merged into this project.
// Stub routes are included below to prevent navigation errors.

function DriverDashboardStub() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-xl font-bold text-slate-700">Driver Dashboard</p>
        <p className="text-slate-500 text-sm mt-1">Halaman driver akan segera tersedia.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Driver stub routes — to be replaced by driver developer */}
          <Route path="/dashboard" element={<DriverDashboardStub />} />
          <Route path="/change-password" element={<DriverDashboardStub />} />

          {/* Admin routes — all protected, require role: admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            {/* Default admin redirect */}
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="reports/:id" element={<AdminReportDetailPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="vehicles" element={<AdminVehiclesPage />} />
          </Route>

          {/* Catch-all: redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
