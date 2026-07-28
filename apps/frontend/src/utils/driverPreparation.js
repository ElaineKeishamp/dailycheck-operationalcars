export function canStartDriverChecking({
  selectedVehicleId,
  isSharedAccount,
  actualDriverName,
  locationStatus,
  coordinates,
  vehiclesLoading,
  vehiclesError,
}) {
  if (vehiclesLoading || vehiclesError) return false;
  if (!selectedVehicleId) return false;
  if (locationStatus !== 'granted' || !coordinates) return false;
  if (isSharedAccount && !actualDriverName.trim()) return false;

  return true;
}
