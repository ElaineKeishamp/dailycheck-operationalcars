import { useCallback, useEffect, useRef, useState } from 'react';
import { createWatermarkedPhoto } from '../utils/photoWatermark';

const UNSUPPORTED_MESSAGE = 'Kamera tidak tersedia. Gunakan browser yang mendukung dan pastikan aplikasi dibuka melalui HTTPS atau localhost.';
const GENERIC_MESSAGE = 'Terjadi kesalahan saat membuka kamera. Silakan coba lagi.';

function isLocalhost() {
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
}

function isCameraSupported() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  return Boolean(navigator.mediaDevices?.getUserMedia) && (window.isSecureContext || isLocalhost());
}

function mapCameraError(error) {
  const name = error?.name;

  if (['NotAllowedError', 'PermissionDeniedError', 'SecurityError'].includes(name)) {
    return {
      status: 'denied',
      message: 'Akses kamera ditolak. Aktifkan izin kamera di pengaturan browser.',
    };
  }

  if (['NotFoundError', 'DevicesNotFoundError'].includes(name)) {
    return {
      status: 'unavailable',
      message: 'Kamera tidak ditemukan pada perangkat ini.',
    };
  }

  if (['NotReadableError', 'TrackStartError', 'AbortError'].includes(name)) {
    return {
      status: 'unavailable',
      message: 'Kamera tidak dapat digunakan. Tutup aplikasi lain yang sedang menggunakan kamera lalu coba lagi.',
    };
  }

  if (['OverconstrainedError', 'ConstraintNotSatisfiedError', 'TypeError'].includes(name)) {
    return {
      status: 'error',
      message: GENERIC_MESSAGE,
    };
  }

  return {
    status: 'error',
    message: GENERIC_MESSAGE,
  };
}

export function useCameraCapture() {
  const [status, setStatus] = useState('idle');
  const [stream, setStream] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const isMountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const statusRef = useRef('idle');
  const streamRef = useRef(null);

  const updateStatus = useCallback((nextStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
      stopStream();
    };
  }, [stopStream]);

  const closeCamera = useCallback(() => {
    requestIdRef.current += 1;
    stopStream();
    setErrorMessage(null);
    updateStatus('idle');
  }, [stopStream, updateStatus]);

  const openCamera = useCallback(async () => {
    if (statusRef.current === 'requesting') return;

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    stopStream();
    setErrorMessage(null);

    if (!isCameraSupported()) {
      updateStatus('unsupported');
      setErrorMessage(UNSUPPORTED_MESSAGE);
      return;
    }

    updateStatus('requesting');

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      if (!isMountedRef.current || requestIdRef.current !== requestId) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = nextStream;
      setStream(nextStream);
      updateStatus('streaming');
    } catch (error) {
      if (!isMountedRef.current || requestIdRef.current !== requestId) return;

      const mappedError = mapCameraError(error);
      stopStream();
      updateStatus(mappedError.status);
      setErrorMessage(mappedError.message);
    }
  }, [stopStream, updateStatus]);

  const captureFrame = useCallback(async ({ videoElement, coordinates }) => {
    if (!videoElement || statusRef.current !== 'streaming') return null;

    updateStatus('capturing');
    const capturedAt = new Date();

    try {
      const blob = await createWatermarkedPhoto({ videoElement, coordinates, capturedAt });
      stopStream();
      updateStatus('idle');
      return { blob, capturedAt };
    } catch {
      stopStream();
      updateStatus('error');
      setErrorMessage('Terjadi kesalahan saat mengambil foto. Silakan coba lagi.');
      return null;
    }
  }, [stopStream, updateStatus]);

  return {
    status,
    stream,
    errorMessage,
    openCamera,
    captureFrame,
    closeCamera,
  };
}
