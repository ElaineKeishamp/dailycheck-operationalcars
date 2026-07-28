import { PlayCircle } from 'lucide-react';
import { TEMPORARY_VEHICLES } from '../../config/driverVehicles';

export default function VehicleSelectionCard({
  selectedVehicleId,
  onVehicleChange,
  isSharedAccount,
  driverName,
  onDriverNameChange,
}) {
  return (
    <section className="bg-white border border-slate-100 rounded-xl shadow-card p-4">
      <h2 className="text-base font-bold text-slate-900 mb-4">Data Mobil</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="driver-vehicle" className="block text-sm font-medium text-slate-700 mb-1.5">
            Pilih Kendaraan
          </label>
          <select
            id="driver-vehicle"
            className="form-select min-h-11"
            value={selectedVehicleId}
            onChange={(e) => onVehicleChange(e.target.value)}
          >
            {TEMPORARY_VEHICLES.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.plateNumber} - {vehicle.model}
              </option>
            ))}
          </select>
        </div>

        {isSharedAccount && (
          <div>
            <label htmlFor="shared-driver-name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Nama Driver
            </label>
            <input
              id="shared-driver-name"
              type="text"
              className="form-input min-h-11"
              placeholder="Masukkan nama..."
              value={driverName}
              onChange={(e) => onDriverNameChange(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-slate-500">Isi nama Anda karena ini akun bersama</p>
          </div>
        )}

        <button
          type="button"
          disabled
          className="w-full min-h-11 rounded-lg bg-slate-200 text-slate-500 text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <PlayCircle size={18} aria-hidden="true" />
          Mulai Checking
        </button>
        {/* Vehicle session start will be enabled in the vehicle/geolocation phase. */}
      </div>
    </section>
  );
}
