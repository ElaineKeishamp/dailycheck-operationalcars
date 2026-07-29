import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, ChangePasswordRoute, DriverRoute, GuestRoute } from './components/ProtectedRoute';
import OfflineNotice from './components/pwa/OfflineNotice';
import PwaInstallPrompt from './components/pwa/PwaInstallPrompt';
import PwaUpdatePrompt from './components/pwa/PwaUpdatePrompt';

// Pages
import LoginPage from './pages/LoginPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DriverDashboardPage from './pages/driver/DriverDashboardPage';

// Admin layout + pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminReportDetailPage from './pages/admin/AdminReportDetailPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminVehiclesPage from './pages/admin/AdminVehiclesPage';

export default function App() {
  return (
    <AuthProvider>
      <OfflineNotice />
      <PwaUpdatePrompt />
      <PwaInstallPrompt />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPasswordPage />
              </GuestRoute>
            }
          />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          <Route
            path="/change-password"
            element={
              <ChangePasswordRoute>
                <ChangePasswordPage />
              </ChangePasswordRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <DriverRoute>
                <DriverDashboardPage />
              </DriverRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="reports/:id" element={<AdminReportDetailPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="vehicles" element={<AdminVehiclesPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
