import { useState } from 'react';
import Modal from '../ui/Modal';
import apiClient from '../../../api/client';

const INITIAL_FORM = {
  plate_number: '',
  brand: '',
  model: '',
};

/**
 * AddVehicleModal
 * 
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   onSuccess: () => void
 */
export default function AddVehicleModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      await apiClient.post('/admin/vehicles', {
        plate_number: form.plate_number.trim().toUpperCase(),
        brand: form.brand.trim(),
        model: form.model.trim(),
      });
      setForm(INITIAL_FORM);
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Gagal menambah kendaraan.';
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
      title="Tambah Mobil Baru"
      subtitle="Daftarkan kendaraan operasional baru."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Plate number */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Plat Nomor
          </label>
          <input
            id="add-vehicle-plate"
            type="text"
            className="form-input"
            placeholder="B 1234 CD"
            value={form.plate_number}
            onChange={(e) => handleChange('plate_number', e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Merk Kendaraan
          </label>
          <input
            id="add-vehicle-brand"
            type="text"
            className="form-input"
            placeholder="Toyota, Honda, Mitsubishi..."
            value={form.brand}
            onChange={(e) => handleChange('brand', e.target.value)}
            required
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Model / Tipe
          </label>
          <input
            id="add-vehicle-model"
            type="text"
            className="form-input"
            placeholder="Avanza 1.5 G, Xpander Ultimate..."
            value={form.model}
            onChange={(e) => handleChange('model', e.target.value)}
            required
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
            onClick={handleClose}
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
              'Tambah Kendaraan'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
