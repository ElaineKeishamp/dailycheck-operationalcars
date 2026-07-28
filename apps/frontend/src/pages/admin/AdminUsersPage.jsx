import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Edit2,
  KeyRound,
  AlertTriangle,
  UsersIcon,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../../api/client';
import Avatar from '../../components/admin/ui/Avatar';
import { RoleBadge, StatusBadge } from '../../components/admin/ui/Badge';
import Toggle from '../../components/admin/ui/Toggle';
import { SkeletonTable } from '../../components/admin/ui/Skeleton';
import AddUserModal from '../../components/admin/modals/AddUserModal';
import EditUserModal from '../../components/admin/modals/EditUserModal';
import TemporaryPasswordModal from '../../components/admin/modals/TemporaryPasswordModal';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [tempPassword, setTempPassword] = useState(null); // { password, name, mode }
  const [resettingId, setResettingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Toggle user active/inactive
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    setTogglingId(user.users_id);
    try {
      await apiClient.patch(`/admin/users/${user.users_id}`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) =>
          u.users_id === user.users_id ? { ...u, status: newStatus } : u
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah status user.');
    } finally {
      setTogglingId(null);
    }
  };

  // Reset password
  const handleResetPassword = async (user) => {
    if (!window.confirm(`Reset password ${user.name}? Password sementara baru akan dibuat.`)) return;
    setResettingId(user.users_id);
    try {
      const res = await apiClient.patch(`/admin/users/${user.users_id}/reset-password`);
      setTempPassword({ password: res.data.temporary_password, name: user.name, mode: 'reset' });
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal reset password.');
    } finally {
      setResettingId(null);
    }
  };

  // After add user success
  const handleAddSuccess = (password) => {
    setAddOpen(false);
    setTempPassword({ password, name: '', mode: 'create' });
    fetchUsers();
  };

  // Filtered users
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div />
        <button
          id="btn-add-user"
          onClick={() => setAddOpen(true)}
          className="btn-primary"
        >
          <UserPlus size={16} />
          Tambah User
        </button>
      </div>

      {/* Table card */}
      <div className="admin-card overflow-hidden">
        {/* Search + filter bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="form-input pl-9 py-2 w-64"
              placeholder="Cari nama, email atau NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select py-2 w-36"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="driver">Driver</option>
          </select>

          <select
            className="form-select py-2 w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="p-5 flex items-center gap-3 bg-red-50 border-b border-red-100">
            <AlertTriangle size={18} className="text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={fetchUsers} className="ml-auto btn-secondary text-xs py-1 px-2">
              <RefreshCw size={13} /> Coba Lagi
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="th-cell">User</th>
                <th className="th-cell">Role</th>
                <th className="th-cell">Terdaftar</th>
                <th className="th-cell">Status</th>
                <th className="th-cell text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <UsersIcon size={36} className="text-slate-300" />
                      <p className="text-slate-500 font-medium">
                        {users.length === 0 ? 'Belum ada user terdaftar' : 'Tidak ada user sesuai filter'}
                      </p>
                      {users.length === 0 && (
                        <button onClick={() => setAddOpen(true)} className="btn-primary text-sm">
                          <UserPlus size={15} /> Tambah User Pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.users_id} className="hover:bg-slate-50/50 transition-colors">
                    {/* User info */}
                    <td className="td-cell">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="md" />
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{user.name}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                          {user.must_change_password && (
                            <span className="text-xs text-amber-600 font-medium">
                              ⚠ Harus ganti password
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="td-cell">
                      <RoleBadge role={user.role} isShared={user.is_shared_account} />
                    </td>

                    {/* Created at */}
                    <td className="td-cell text-slate-500">
                      {formatDate(user.created_at)}
                    </td>

                    {/* Status toggle */}
                    <td className="td-cell">
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={user.status === 'active'}
                          onChange={() => handleToggleStatus(user)}
                          disabled={togglingId === user.users_id}
                        />
                        <StatusBadge status={user.status} />
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="td-cell">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit */}
                        <button
                          onClick={() => setEditUser(user)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Reset password */}
                        <button
                          onClick={() => handleResetPassword(user)}
                          disabled={resettingId === user.users_id}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Reset password"
                        >
                          {resettingId === user.users_id ? (
                            <span className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <KeyRound size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Record count */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Menampilkan {filtered.length} dari {users.length} user
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={handleAddSuccess}
      />

      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onSuccess={fetchUsers}
      />

      <TemporaryPasswordModal
        isOpen={!!tempPassword}
        onClose={() => setTempPassword(null)}
        password={tempPassword?.password}
        userName={tempPassword?.name}
        mode={tempPassword?.mode}
      />
    </div>
  );
}
