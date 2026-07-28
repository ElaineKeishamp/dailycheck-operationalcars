import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Toggle from '../ui/Toggle';
import apiClient from '../../../api/client';

/**
 * EditVehicleModal
 * 
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   vehicle: { vehicle_id, plate_number, brand, model, status }
 *   onSuccess: () => void
 */
export default function EditVehicleModal({ isOpen, onClose, vehicle, onSuccess }) {
  const [form, setForm] = useState({
    plate_number: '',
    brand: '',
    model: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (vehicle) {
      setForm({
        plate_number: vehicle.plate_number || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        status: vehicle.status || 'active',
      });
    }
  }, [vehicle]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plate_number.trim() || !form.brand.trim() || !form.model.trim()) {
      setError('Semua field wajib diisi.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.patch(`/admin/vehicles/${vehicle.vehicle_id}`, {
        plate_number: form.plate_number.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        status: form.status,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal mengubah data kendaraan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Mobil"
      subtitle="Perbarui data aset operasional"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Plate Number */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Plat Nomor
            </label>
            <input
              id="edit-vehicle-plate"
              type="text"
              className="form-input font-semibold"
              value={form.plate_number}
              onChange={(e) => handleChange('plate_number', e.target.value)}
              required
            />
          </div>

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Merk Kendaraan
            </label>
            <input
              id="edit-vehicle-brand"
              type="text"
              className="form-input"
              value={form.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              required
            />
          </div>

          {/* Model */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Model / Tipe
            </label>
            <input
              id="edit-vehicle-model"
              type="text"
              className="form-input"
              value={form.model}
              onChange={(e) => handleChange('model', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Status Aktif toggle */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <Toggle
            checked={form.status === 'active'}
            onChange={(val) => handleChange('status', val ? 'active' : 'inactive')}
            label="Status Aktif"
            description="Kendaraan tersedia untuk operasional"
          />
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
