import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import apiClient from '../api/client';
import { useAuth } from '../context/useAuth';
import { getAuthenticatedHomePath } from '../utils/authRoutes';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });
      const { token, user } = res.data;

      if (!['admin', 'driver'].includes(user?.role)) {
        setError('Akses tidak tersedia untuk akun ini.');
        return;
      }

      login(user, token);

      if (user.must_change_password) {
        navigate('/change-password', { replace: true });
        return;
      }

      navigate(getAuthenticatedHomePath(user), { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError('Email atau password salah');
      } else if (status === 403) {
        setError('Akun Anda telah dinonaktifkan. Hubungi admin.');
      } else {
        setError(err.response?.data?.error || 'Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Selamat datang</h1>
          <p className="text-sm leading-6 text-slate-500 mb-8">Masuk dengan akun Anda untuk melanjutkan.</p>

          <form onSubmit={handleSubmit} className="space-y-4">            {error && (
              <div
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="nama@perusahaan.co.id"
                autoComplete="username"
                value={form.email}
                onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setError(null); }}
                required
                autoFocus
              />
            </div>            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setError(null); }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:text-primary"
                  aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary-hover">
                Lupa Password?
              </Link>
            </div>            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Masuk...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
          <p className="mt-8 text-xs text-slate-500">© 2026 Lintasarta · Daily Check Operational Cars</p>
    </AuthShell>
  );
}
