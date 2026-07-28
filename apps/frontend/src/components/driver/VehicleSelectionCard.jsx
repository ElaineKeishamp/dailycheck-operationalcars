import { PlayCircle } from 'lucide-react';
import LocationPermissionStatus from './LocationPermissionStatus';

function getVehicleOptionLabel(vehicle) {
  return `${vehicle.plate_number} - ${vehicle.brand} ${vehicle.model}`;
}

export default function VehicleSelectionCard({
  vehicles,
  vehiclesLoading,
  vehiclesError,
  selectedVehicleId,
  onVehicleChange,
  onRetryVehicles,
  locationStatus,
  coordinates,
  locationErrorMessage,
  onRetryLocation,
  isSharedAccount,
  actualDriverName,
  onActualDriverNameChange,
  canStartChecking,
  onPrepareStartChecking,
  preparationMessage,
  sessionStatus,
  sessionError,
  isSessionActive,
}) {
  const hasVehicleError = Boolean(vehiclesError);
  const hasNoVehicles = !vehiclesLoading && !hasVehicleError && vehicles.length === 0;
  const isStarting = sessionStatus === 'starting';
  const selectDisabled = vehiclesLoading || hasVehicleError || hasNoVehicles || isStarting || isSessionActive;
  const preparationLocked = isStarting || isSessionActive;

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
            disabled={selectDisabled}
          >
            {vehiclesLoading && <option value="">Memuat data kendaraan...</option>}
            {hasVehicleError && <option value="">Gagal memuat kendaraan</option>}
            {hasNoVehicles && <option value="">Belum ada kendaraan aktif</option>}
            {!selectDisabled && <option value="">Pilih kendaraan</option>}
            {!selectDisabled && vehicles.map((vehicle) => (
              <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                {getVehicleOptionLabel(vehicle)}
              </option>
            ))}
          </select>
          {vehiclesLoading && (
            <p className="mt-1.5 text-xs text-slate-500" aria-live="polite">Memuat daftar kendaraan aktif...</p>
          )}
          {vehiclesError && (
            <div className="mt-2 rounded-lg border border-red-100 bg-red-50 p-3" role="status" aria-live="polite">
              <p className="text-sm text-red-600">{vehiclesError}</p>
              <button
                type="button"
                onClick={onRetryVehicles}
                className="mt-3 min-h-10 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50"
              >
                Coba Lagi
              </button>
            </div>
          )}
          {hasNoVehicles && (
            <p className="mt-1.5 text-xs text-slate-500" aria-live="polite">Belum ada kendaraan aktif yang tersedia.</p>
          )}
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
              value={actualDriverName}
              onChange={(e) => onActualDriverNameChange(e.target.value)}
              disabled={preparationLocked}
            />
            <p className="mt-1.5 text-xs text-slate-500">Isi nama Anda karena ini akun bersama</p>
          </div>
        )}

        <LocationPermissionStatus
          status={locationStatus}
          coordinates={coordinates}
          errorMessage={locationErrorMessage}
          onRetry={isSessionActive ? undefined : onRetryLocation}
        />

        {preparationMessage && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3" role="status" aria-live="polite">
            <p className="text-sm text-blue-700">{preparationMessage}</p>
          </div>
        )}

        {sessionError && (
          <div
            className={`rounded-lg border p-3 ${
              sessionStatus === 'conflict'
                ? 'border-amber-100 bg-amber-50'
                : 'border-red-100 bg-red-50'
            }`}
            role="status"
            aria-live="polite"
          >
            <p className={`text-sm ${sessionStatus === 'conflict' ? 'text-amber-700' : 'text-red-600'}`}>
              {sessionError}
            </p>
          </div>
        )}

        {!isSessionActive && (
          <button
            type="button"
            disabled={!canStartChecking || isStarting}
            onClick={onPrepareStartChecking}
            className={`w-full min-h-11 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${
              canStartChecking && !isStarting
                ? 'bg-primary text-white hover:bg-primary-hover'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isStarting ? (
              <span className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-500 rounded-full animate-spin" aria-hidden="true" />
            ) : (
              <PlayCircle size={18} aria-hidden="true" />
            )}
            {isStarting ? 'Memulai Checking...' : 'Mulai Checking'}
          </button>
        )}
      </div>
    </section>
  );
}
