import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, AlertTriangle, Car, RefreshCw } from 'lucide-react';
import apiClient from '../../api/client';
import { StatusBadge } from '../../components/admin/ui/Badge';
import Toggle from '../../components/admin/ui/Toggle';
import { SkeletonTable } from '../../components/admin/ui/Skeleton';
import AddVehicleModal from '../../components/admin/modals/AddVehicleModal';
import EditVehicleModal from '../../components/admin/modals/EditVehicleModal';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/vehicles');
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat data kendaraan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Toggle active/inactive
  const handleToggleStatus = async (vehicle) => {
    const newStatus = vehicle.status === 'active' ? 'inactive' : 'active';
    setTogglingId(vehicle.vehicle_id);
    try {
      await apiClient.patch(`/admin/vehicles/${vehicle.vehicle_id}`, { status: newStatus });
      setVehicles((prev) =>
        prev.map((v) =>
          v.vehicle_id === vehicle.vehicle_id ? { ...v, status: newStatus } : v
        )
      );
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengubah status kendaraan.');
    } finally {
      setTogglingId(null);
    }
  };

  // Filtered list
  const filtered = vehicles.filter((v) => {
    if (!statusFilter) return true;
    return v.status === statusFilter;
  });

  return (
    <div className="min-w-0 space-y-5 animate-fade-in">
      {/* Header actions */}
      <div className="flex items-center justify-end">
        <div />
        <button
          id="btn-add-vehicle"
          onClick={() => setAddOpen(true)}
          className="btn-primary"
        >
          <Plus size={16} />
          Tambah Mobil
        </button>
      </div>

      {/* Table card */}
      <div className="admin-card overflow-hidden">
        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm text-slate-500">Filter:</span>
            <select
              className="form-select py-2 sm:w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
          <span className="text-sm text-slate-400 sm:ml-auto">
            {!loading && `${filtered.length} kendaraan`}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="p-5 flex items-center gap-3 bg-red-50 border-b border-red-100">
            <AlertTriangle size={18} className="text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={fetchVehicles} className="btn-secondary ml-auto px-2 py-1 text-xs">
              <RefreshCw size={13} /> Coba Lagi
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-[780px] w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="th-cell">Plat Nomor</th>
                <th className="th-cell">Merk</th>
                <th className="th-cell">Model / Tipe</th>
                <th className="th-cell">Terdaftar</th>
                <th className="th-cell">Status</th>
                <th className="th-cell text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <SkeletonTable rows={5} cols={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Car size={36} className="text-slate-300" />
                      <p className="text-slate-500 font-medium">
                        {vehicles.length === 0
                          ? 'Belum ada kendaraan terdaftar'
                          : 'Tidak ada kendaraan sesuai filter'}
                      </p>
                      {vehicles.length === 0 && (
                        <button onClick={() => setAddOpen(true)} className="btn-primary text-sm">
                          <Plus size={15} /> Tambah Kendaraan Pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((vehicle) => (
                  <tr key={vehicle.vehicle_id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Plate */}
                    <td className="td-cell">
                      <span className="font-bold text-slate-900 text-sm tracking-wide">
                        {vehicle.plate_number}
                      </span>
                    </td>

                    {/* Brand */}
                    <td className="td-cell font-medium text-slate-700">{vehicle.brand}</td>

                    {/* Model */}
                    <td className="td-cell text-slate-600">{vehicle.model}</td>

                    {/* Registered date */}
                    <td className="td-cell text-slate-500">
                      {formatDate(vehicle.created_at)}
                    </td>

                    {/* Status toggle */}
                    <td className="td-cell">
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={vehicle.status === 'active'}
                          onChange={() => handleToggleStatus(vehicle)}
                          disabled={togglingId === vehicle.vehicle_id}
                        />
                        <StatusBadge status={vehicle.status} />
                      </div>
                    </td>

                    {/* Edit */}
                    <td className="td-cell">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => setEditVehicle(vehicle)}
                          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit kendaraan"
                        >
                          <Edit2 size={15} />
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
              Menampilkan {filtered.length} dari {vehicles.length} kendaraan
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddVehicleModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={fetchVehicles}
      />

      <EditVehicleModal
        isOpen={!!editVehicle}
        onClose={() => setEditVehicle(null)}
        vehicle={editVehicle}
        onSuccess={fetchVehicles}
      />
    </div>
  );
}
