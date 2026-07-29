import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Car, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/useAuth';
import { getAuthenticatedHomePath } from '../utils/authRoutes';

const INITIAL_FORM = {
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [visibleFields, setVisibleFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const passwordsDoNotMatch = form.confirmPassword && form.newPassword !== form.confirmPassword;

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
    setFieldErrors((current) => ({ ...current, [field]: null, confirmPassword: null }));
  };

  const toggleVisible = (field) => {
    setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError('Semua field wajib diisi.');
      return false;
    }

    if (form.newPassword.length < 6) {
      nextErrors.newPassword = 'Password baru minimal 6 karakter.';
    }

    if (form.newPassword !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Konfirmasi password baru tidak sama.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        old_password: form.oldPassword,
        new_password: form.newPassword,
      });

      const updatedUser = { ...user, must_change_password: false };
      updateUser({ must_change_password: false });
      navigate(getAuthenticatedHomePath(updatedUser), { replace: true });
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        setError('Password lama atau password sementara salah.');
      } else if (status === 400) {
        setError(err.response?.data?.error || err.response?.data?.message || 'Password baru minimal 6 karakter.');
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = ({ id, label, field }) => {
    const isVisible = Boolean(visibleFields[field]);

    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
        <div className="relative">
          <input
            id={id}
            type={isVisible ? 'text' : 'password'}
            className="form-input pr-10"
            value={form[field]}
            onChange={(e) => handleChange(field, e.target.value)}
            autoComplete={field === 'oldPassword' ? 'current-password' : 'new-password'}
            required
          />
          <button
            type="button"
            onClick={() => toggleVisible(field)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={isVisible ? `Sembunyikan ${label}` : `Tampilkan ${label}`}
          >
            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {fieldErrors[field] && (
          <p className="mt-1.5 text-xs text-red-600">{fieldErrors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-900/50">
            <Car size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Daily Check</h1>
          <p className="text-blue-300 text-sm mt-1">Operational Cars</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-primary flex items-center justify-center">
              <LockKeyhole size={19} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Ganti Password</h2>
              <p className="text-sm text-slate-500">Buat password baru untuk melanjutkan</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {renderPasswordField({
              id: 'old-password',
              label: 'Password Lama atau Password Sementara',
              field: 'oldPassword',
            })}

            {renderPasswordField({
              id: 'new-password',
              label: 'Password Baru',
              field: 'newPassword',
            })}

            {renderPasswordField({
              id: 'confirm-password',
              label: 'Konfirmasi Password Baru',
              field: 'confirmPassword',
            })}

            {passwordsDoNotMatch && !fieldErrors.confirmPassword && (
              <p className="text-xs text-red-600">Konfirmasi password baru tidak sama.</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover active:scale-[0.98] transition-all duration-200 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </span>
              ) : (
                'Simpan Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
