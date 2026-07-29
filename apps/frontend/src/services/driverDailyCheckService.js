import apiClient from '../api/client';

export const MALFORMED_DAILY_CHECK_RESPONSE = 'MALFORMED_DAILY_CHECK_RESPONSE';
export const MALFORMED_DAILY_CHECK_SUBMIT_RESPONSE = 'MALFORMED_DAILY_CHECK_SUBMIT_RESPONSE';

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

function normalizeMissingPart(part) {
  if (typeof part === 'string') {
    return {
      part_type: part,
      part_index: null,
      checklist_id: part,
    };
  }

  if (!part || typeof part !== 'object') return null;

  return {
    part_type: part.part_type || '',
    part_index: part.part_index ?? null,
    checklist_id: part.checklist_id || (part.part_type === 'ban' ? `ban_${part.part_index}` : part.part_type),
  };
}

function createMalformedSubmitError() {
  const error = new Error(MALFORMED_DAILY_CHECK_SUBMIT_RESPONSE);
  error.code = MALFORMED_DAILY_CHECK_SUBMIT_RESPONSE;
  return error;
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

export async function submitDailyCheck({ dailyCheckId, signal }) {
  if (!dailyCheckId) {
    throw createMalformedSubmitError();
  }

  try {
    const response = await apiClient.post(`/daily-checks/${dailyCheckId}/submit`, undefined, { signal });
    const dailyCheck = normalizeDailyCheck(response.data?.daily_check);

    if (dailyCheck.status !== 'submitted') {
      throw createMalformedSubmitError();
    }

    return dailyCheck;
  } catch (error) {
    const conflictDailyCheck = error.response?.data?.daily_check;
    if (error.response?.status === 409 && conflictDailyCheck) {
      try {
        const normalizedConflict = normalizeDailyCheck(conflictDailyCheck);
        if (normalizedConflict.status === 'submitted') {
          error.submittedDailyCheck = normalizedConflict;
        }
      } catch {
        // Keep the original submit error when the conflict payload is malformed.
      }
    }

    const missingParts = error.response?.data?.missing_parts;
    if (Array.isArray(missingParts)) {
      error.normalizedMissingParts = missingParts.map(normalizeMissingPart).filter(Boolean);
    }
    throw error;
  }
}
