import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import Modal from '../ui/Modal';
import Toggle from '../ui/Toggle';
import apiClient from '../../../api/client';

/**
 * EditUserModal
 * 
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   user: { users_id, name, email, role, is_shared_account, status }
 *   onSuccess: () => void
 */
export default function EditUserModal({ isOpen, onClose, user, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    role: 'driver',
    is_shared_account: false,
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        role: user.role || 'driver',
        is_shared_account: user.is_shared_account || false,
        status: user.status || 'active',
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Nama tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.patch(`/admin/users/${user.users_id}`, {
        name: form.name.trim(),
        role: form.role,
        is_shared_account: form.is_shared_account,
        status: form.status,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal mengubah data user.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      subtitle="Ubah informasi user."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nama Lengkap
          </label>
          <input
            id="edit-user-name"
            type="text"
            className="form-input"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            type="email"
            className="form-input bg-slate-50 text-slate-500 cursor-not-allowed"
            value={user?.email || ''}
            readOnly
          />
          <p className="text-xs text-slate-400 mt-1">Email tidak dapat diubah.</p>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Role Akses
          </label>
          <select
            id="edit-user-role"
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
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-slate-500" />
          </div>
          <Toggle
            checked={form.is_shared_account}
            onChange={(val) => handleChange('is_shared_account', val)}
            label="Shared Account"
            description="Aktifkan untuk driver pengganti/pool car."
          />
        </div>

        {/* Status toggle */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <Toggle
            checked={form.status === 'active'}
            onChange={(val) => handleChange('status', val ? 'active' : 'inactive')}
            label="Status Aktif"
            description="User dapat login dan menggunakan aplikasi."
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Batal
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : (
              'Simpan Perubahan'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
