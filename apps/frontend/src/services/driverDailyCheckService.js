import apiClient from '../api/client';

export const MALFORMED_DAILY_CHECK_RESPONSE = 'MALFORMED_DAILY_CHECK_RESPONSE';

function buildDailyCheckPayload({ vehicleId, actualDriverName, coordinates }) {
  const payload = {
    vehicle_id: vehicleId,
    gps_lat: coordinates.latitude,
    gps_long: coordinates.longitude,
  };

  const trimmedDriverName = actualDriverName?.trim();
  if (trimmedDriverName) {
    payload.actual_driver_name = trimmedDriverName;
  }

  return payload;
}

function normalizeDailyCheck(dailyCheck) {
  if (!dailyCheck || typeof dailyCheck !== 'object' || !dailyCheck.daily_id) {
    const error = new Error(MALFORMED_DAILY_CHECK_RESPONSE);
    error.code = MALFORMED_DAILY_CHECK_RESPONSE;
    throw error;
  }

  return {
    ...dailyCheck,
    daily_id: dailyCheck.daily_id,
    status: dailyCheck.status || 'incomplete',
  };
}

export async function createDailyCheck({
  vehicleId,
  actualDriverName,
  coordinates,
  signal,
}) {
  const response = await apiClient.post(
    '/daily-checks',
    buildDailyCheckPayload({ vehicleId, actualDriverName, coordinates }),
    { signal }
  );

  return normalizeDailyCheck(response.data?.daily_check);
}

export async function getActiveDailyCheck({ vehicleId, signal }) {
  const response = await apiClient.get('/daily-checks/active', {
    params: { vehicle_id: vehicleId },
    signal,
  });

  const dailyCheck = response.data?.daily_check;
  return dailyCheck ? normalizeDailyCheck(dailyCheck) : null;
}
