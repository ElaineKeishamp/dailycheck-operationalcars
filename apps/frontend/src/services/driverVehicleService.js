import apiClient from '../api/client';

function normalizeVehicle(vehicle) {
  if (!vehicle || typeof vehicle !== 'object') return null;

  const normalized = {
    vehicle_id: vehicle.vehicle_id,
    plate_number: vehicle.plate_number,
    brand: vehicle.brand,
    model: vehicle.model,
    status: vehicle.status,
  };

  if (!normalized.vehicle_id || !normalized.plate_number) return null;
  return normalized;
}

export async function getActiveVehicles({ signal } = {}) {
  const response = await apiClient.get('/vehicles', { signal });
  const rawVehicles = Array.isArray(response.data?.vehicles) ? response.data.vehicles : [];

  return rawVehicles
    .map(normalizeVehicle)
    .filter((vehicle) => vehicle && vehicle.status === 'active');
}
