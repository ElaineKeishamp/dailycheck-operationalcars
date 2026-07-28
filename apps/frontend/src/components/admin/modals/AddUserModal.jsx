import { useState } from 'react';
import { Users } from 'lucide-react';
import Modal from '../ui/Modal';
import Toggle from '../ui/Toggle';
import apiClient from '../../../api/client';

const INITIAL_FORM = {
  name: '',
  email: '',
  role: 'driver',
  is_shared_account: false,
};

/**
 * AddUserModal
 * 
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   onSuccess: (temporaryPassword: string) => void
 */
export default function AddUserModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Nama dan email tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/admin/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        is_shared_account: form.is_shared_account,
      });
      setForm(INITIAL_FORM);
      onSuccess(res.data.temporary_password);
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal menambah user. Coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tambah User Baru"
      subtitle="Lengkapi informasi untuk mendaftarkan user."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nama Lengkap
          </label>
          <input
            id="add-user-name"
            type="text"
            className="form-input"
            placeholder="Masukkan nama lengkap user..."
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Perusahaan
          </label>
          <input
            id="add-user-email"
            type="email"
            className="form-input"
            placeholder="example@lintasarta.co.id"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            required
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Role Akses
          </label>
          <select
            id="add-user-role"
            className="form-select"
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
          >
            <option value="driver">Driver Utama</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Shared Account toggle */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <Toggle
            checked={form.is_shared_account}
            onChange={(val) => handleChange('is_shared_account', val)}
            label="Shared Account"
            description="Aktifkan untuk driver pengganti/pool car."
          />
          <div className="flex items-center gap-2 mt-3 -ml-0.5">
            <Users size={16} className="text-slate-400" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn-primary bg-slate-900 hover:bg-slate-800"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : (
              'Simpan User'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
