import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createDailyCheck,
  getActiveDailyCheck,
  MALFORMED_DAILY_CHECK_RESPONSE,
  MALFORMED_DAILY_CHECK_SUBMIT_RESPONSE,
  submitDailyCheck as submitDailyCheckRequest,
} from '../services/driverDailyCheckService';

const ERROR_MESSAGES = {
  invalid: 'Data checking belum lengkap atau tidak valid.',
  notFound: 'Kendaraan tidak ditemukan atau sudah tidak aktif.',
  conflict: 'Kendaraan ini sudah melakukan checking hari ini.',
  generic: 'Gagal memulai sesi checking. Silakan coba lagi.',
  malformed: 'Respons sesi checking tidak valid. Silakan coba lagi.',
  activeLookup: 'Gagal memeriksa sesi checking sebelumnya.',
  submitInvalid: 'Laporan belum dapat dikirim karena foto wajib belum lengkap.',
  submitForbidden: 'Anda tidak memiliki akses untuk mengirim laporan ini.',
  submitNotFound: 'Sesi checking tidak ditemukan.',
  submitConflict: 'Laporan checking ini sudah pernah dikirim.',
  submitGeneric: 'Gagal mengirim laporan. Silakan coba lagi.',
  submitMalformed: 'Respons pengiriman laporan tidak valid. Silakan coba lagi.',
};

function getSafeBackendMessage(error) {
  const message = error.response?.data?.error || error.response?.data?.message;
  return typeof message === 'string' && message.length < 160 ? message : null;
}

function mapDailyCheckError(error) {
  if (error.code === MALFORMED_DAILY_CHECK_RESPONSE) {
    return { status: 'error', message: ERROR_MESSAGES.malformed };
  }

  const responseStatus = error.response?.status;

  if (responseStatus === 400) {
    return { status: 'error', message: getSafeBackendMessage(error) || ERROR_MESSAGES.invalid };
  }

  if (responseStatus === 404) {
    return { status: 'error', message: ERROR_MESSAGES.notFound };
  }

  if (responseStatus === 409) {
    return { status: 'conflict', message: ERROR_MESSAGES.conflict };
  }

  return { status: 'error', message: ERROR_MESSAGES.generic };
}

function mapSubmitError(error) {
  if (error.code === MALFORMED_DAILY_CHECK_SUBMIT_RESPONSE) {
    return ERROR_MESSAGES.submitMalformed;
  }

  const responseStatus = error.response?.status;
  if (responseStatus === 400) return ERROR_MESSAGES.submitInvalid;
  if (responseStatus === 403) return ERROR_MESSAGES.submitForbidden;
  if (responseStatus === 404) return ERROR_MESSAGES.submitNotFound;
  if (responseStatus === 409) return ERROR_MESSAGES.submitConflict;
  return ERROR_MESSAGES.submitGeneric;
}

export function useDailyCheckSession() {
  const [dailyCheck, setDailyCheck] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [missingParts, setMissingParts] = useState([]);
  const statusRef = useRef('idle');
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const updateStatus = useCallback((nextStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setMissingParts([]);
    if (statusRef.current === 'error' || statusRef.current === 'conflict') {
      updateStatus(dailyCheck ? 'active' : 'idle');
    }
  }, [dailyCheck, updateStatus]);

  const startDailyCheck = useCallback(async (preparedData) => {
    if (statusRef.current === 'starting') return null;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    updateStatus('starting');
    setError(null);
    setMessage(null);
    setMissingParts([]);

    try {
      let activeDailyCheck = null;

      try {
        activeDailyCheck = await getActiveDailyCheck({
          vehicleId: preparedData.vehicleId,
          signal: controller.signal,
        });
      } catch (lookupError) {
        if (lookupError.name === 'CanceledError' || lookupError.name === 'AbortError') return null;
        setError(ERROR_MESSAGES.activeLookup);
      }

      if (activeDailyCheck) {
        if (!isMountedRef.current) return null;

        setDailyCheck(activeDailyCheck);
        updateStatus('active');
        setError(null);
        setMessage('Sesi checking sebelumnya dilanjutkan.');
        return activeDailyCheck;
      }

      const createdDailyCheck = await createDailyCheck({
        ...preparedData,
        signal: controller.signal,
      });

      if (!isMountedRef.current) return null;

      setDailyCheck(createdDailyCheck);
      updateStatus('active');
      setError(null);
      setMessage(null);
      return createdDailyCheck;
    } catch (err) {
      if (!isMountedRef.current || err.name === 'CanceledError' || err.name === 'AbortError') return null;

      if (err.response?.status === 409) {
        try {
          const activeDailyCheck = await getActiveDailyCheck({
            vehicleId: preparedData.vehicleId,
            signal: controller.signal,
          });

          if (activeDailyCheck) {
            setDailyCheck(activeDailyCheck);
            updateStatus('active');
            setError(null);
            setMessage('Sesi checking sebelumnya dilanjutkan.');
            return activeDailyCheck;
          }
        } catch (lookupError) {
          if (lookupError.name === 'CanceledError' || lookupError.name === 'AbortError') return null;
        }
      }

      const mappedError = mapDailyCheckError(err);
      setDailyCheck(null);
      updateStatus(mappedError.status);
      setError(mappedError.message);
      setMessage(null);
      return null;
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [updateStatus]);

  const submitDailyCheck = useCallback(async ({ dailyCheckId }) => {
    if (!dailyCheckId || statusRef.current === 'submitting' || statusRef.current === 'completed') {
      return null;
    }

    const submittingDailyCheckId = dailyCheckId;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    updateStatus('submitting');
    setError(null);
    setMessage(null);
    setMissingParts([]);

    try {
      const submittedDailyCheck = await submitDailyCheckRequest({
        dailyCheckId: submittingDailyCheckId,
        signal: controller.signal,
      });

      if (!isMountedRef.current || submittedDailyCheck.daily_id !== submittingDailyCheckId) {
        return null;
      }

      setDailyCheck(submittedDailyCheck);
      updateStatus('completed');
      setError(null);
      setMessage('Laporan checking berhasil dikirim.');
      setMissingParts([]);
      return submittedDailyCheck;
    } catch (err) {
      if (!isMountedRef.current || err.name === 'CanceledError' || err.name === 'AbortError') return null;

      setMissingParts(err.normalizedMissingParts || []);
      setError(mapSubmitError(err));
      updateStatus(err.response?.status === 409 ? 'conflict' : 'active');
      return null;
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [updateStatus]);

  return {
    dailyCheck,
    status,
    error,
    message,
    missingParts,
    startDailyCheck,
    submitDailyCheck,
    clearError,
  };
}
