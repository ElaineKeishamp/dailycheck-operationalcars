export function canStartDriverChecking({
  selectedVehicleId,
  selectedVehicle,
  isSharedAccount,
  actualDriverName,
  locationStatus,
  coordinates,
  vehiclesLoading,
  vehiclesError,
}) {
  if (vehiclesLoading || vehiclesError) return false;
  if (!selectedVehicleId || !selectedVehicle) return false;
  if (locationStatus !== 'granted' || !coordinates) return false;
  if (!Number.isFinite(coordinates.latitude) || !Number.isFinite(coordinates.longitude)) return false;
  if (isSharedAccount && !actualDriverName.trim()) return false;

  return true;
}
