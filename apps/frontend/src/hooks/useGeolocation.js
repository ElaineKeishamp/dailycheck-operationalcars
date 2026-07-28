import { useCallback, useEffect, useRef, useState } from 'react';

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

const UNSUPPORTED_MESSAGE = 'Lokasi tidak tersedia. Gunakan browser yang mendukung dan pastikan aplikasi dibuka melalui HTTPS atau localhost.';
const TIMEOUT_MESSAGE = 'Pengambilan lokasi terlalu lama. Silakan coba lagi.';
const UNEXPECTED_ERROR_MESSAGE = 'Terjadi kesalahan saat mengambil lokasi. Silakan coba lagi.';
const FALLBACK_TIMEOUT_MS = 17000;

function isLocalhost() {
  if (typeof window === 'undefined') return false;

  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

function isGeolocationSupported() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  return Boolean(navigator.geolocation) && (window.isSecureContext || isLocalhost());
}

function mapGeolocationError(error) {
  if (!error) {
    return {
      status: 'error',
      message: UNEXPECTED_ERROR_MESSAGE,
    };
  }

  if (error.code === error.PERMISSION_DENIED) {
    return {
      status: 'denied',
      message: 'Izin lokasi diperlukan untuk memulai checking.',
    };
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return {
      status: 'unavailable',
      message: 'Lokasi tidak dapat ditemukan. Pastikan GPS perangkat aktif.',
    };
  }

  if (error.code === error.TIMEOUT) {
    return {
      status: 'timeout',
      message: TIMEOUT_MESSAGE,
    };
  }

  return {
    status: 'error',
    message: UNEXPECTED_ERROR_MESSAGE,
  };
}

export function useGeolocation({ requestOnMount = false } = {}) {
  const [status, setStatus] = useState('idle');
  const [coordinates, setCoordinates] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const statusRef = useRef('idle');
  const isMountedRef = useRef(true);
  const hasRequestedInitialLocationRef = useRef(false);
  const latestRequestIdRef = useRef(0);
  const fallbackTimerRef = useRef(null);

  const updateStatus = useCallback((nextStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (statusRef.current === 'requesting') {
        hasRequestedInitialLocationRef.current = false;
      }
      clearFallbackTimer();
    };
  }, [clearFallbackTimer]);

  const requestLocation = useCallback(() => {
    clearFallbackTimer();
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;

    if (!isGeolocationSupported()) {
      updateStatus('unsupported');
      setCoordinates(null);
      setErrorMessage(UNSUPPORTED_MESSAGE);
      return;
    }

    updateStatus('requesting');
    setCoordinates(null);
    setErrorMessage(null);

    fallbackTimerRef.current = window.setTimeout(() => {
      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) return;

      fallbackTimerRef.current = null;
      updateStatus('timeout');
      setErrorMessage(TIMEOUT_MESSAGE);
      setCoordinates(null);
    }, FALLBACK_TIMEOUT_MS);

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMountedRef.current || latestRequestIdRef.current !== requestId) return;

          clearFallbackTimer();
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          updateStatus('granted');
          setErrorMessage(null);
        },
        (error) => {
          if (!isMountedRef.current || latestRequestIdRef.current !== requestId) return;

          clearFallbackTimer();
          const mappedError = mapGeolocationError(error);
          setCoordinates(null);
          updateStatus(mappedError.status);
          setErrorMessage(mappedError.message);
        },
        GEOLOCATION_OPTIONS
      );
    } catch {
      if (!isMountedRef.current || latestRequestIdRef.current !== requestId) return;

      clearFallbackTimer();
      updateStatus('error');
      setErrorMessage(UNEXPECTED_ERROR_MESSAGE);
      setCoordinates(null);
    }
  }, [clearFallbackTimer, updateStatus]);

  useEffect(() => {
    if (!requestOnMount || hasRequestedInitialLocationRef.current) return;

    hasRequestedInitialLocationRef.current = true;
    requestLocation();
  }, [requestLocation, requestOnMount]);

  useEffect(() => {
    return () => {
      latestRequestIdRef.current += 1;
      clearFallbackTimer();
    };
  }, [clearFallbackTimer]);

  return {
    status,
    coordinates,
    requestLocation,
    errorMessage,
  };
}
