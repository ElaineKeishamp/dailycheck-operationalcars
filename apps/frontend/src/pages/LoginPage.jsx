import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Car, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/50">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Daily Check</h1>
          <p className="text-blue-300 text-sm mt-1">Operational Cars</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-7">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Selamat Datang</h2>
          <p className="text-sm text-slate-500 mb-6">Masuk untuk melanjutkan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="admin@lintasarta.co.id"
                value={form.email}
                onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setError(null); }}
                required
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); setError(null); }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
            </div>

            {/* Submit */}
            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 disabled:opacity-70 mt-1"
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
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Lintasarta — Daily Check Operational Cars
        </p>
      </div>
    </div>
  );
}
