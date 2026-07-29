import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STANDARD_PHOTO_ITEMS, TIRE_CHECKLIST_ITEMS } from '../config/driverChecklist';
import {
  getDailyCheckPhotos,
  UPLOAD_CONFIRM_FAILED,
  UPLOAD_PREPARE_FAILED,
  UPLOAD_STORAGE_FAILED,
  uploadDailyCheckPhoto,
} from '../services/driverPhotoService';

const REQUIRED_CHECKLIST_IDS = new Set([
  ...STANDARD_PHOTO_ITEMS.map((item) => item.id),
  ...TIRE_CHECKLIST_ITEMS.map((item) => item.id),
]);

function getChecklistIdForUploadedPhoto(photo) {
  if (!photo?.partType) return null;
  if (photo.partType === 'ban') {
    return Number.isInteger(photo.partIndex) && photo.partIndex >= 1 && photo.partIndex <= 4
      ? `ban_${photo.partIndex}`
      : null;
  }
  return photo.partType;
}

function getUploadErrorMessage(error) {
  if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
    return 'Upload foto dibatalkan';
  }

  if (error?.code === UPLOAD_PREPARE_FAILED) {
    return 'Gagal menyiapkan upload foto. Silakan coba lagi.';
  }
  if (error?.code === UPLOAD_STORAGE_FAILED) {
    return 'Foto gagal dikirim ke penyimpanan. Silakan coba lagi.';
  }
  if (error?.code === UPLOAD_CONFIRM_FAILED) {
    return 'Foto terkirim, tetapi gagal dikonfirmasi. Silakan coba lagi.';
  }

  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.error;

  if (status === 413) return serverMessage || 'Ukuran foto terlalu besar.';
  if (status === 503) return serverMessage || 'Penyimpanan foto belum tersedia.';
  if (status === 409) return serverMessage || 'Daily check sudah tidak bisa menerima upload.';
  if (status === 403) return serverMessage || 'Upload foto tidak diizinkan.';
  if (status === 404) return serverMessage || 'Sesi daily check tidak ditemukan.';
  if (status === 400) return serverMessage || 'Data upload foto tidak valid.';

  return error?.message || 'Upload foto gagal. Coba ulangi.';
}

export function usePhotoUploads() {
  const [uploadStates, setUploadStates] = useState({});
  const [restoreStatus, setRestoreStatus] = useState('idle');
  const [restoreError, setRestoreError] = useState(null);
  const controllersRef = useRef({});
  const mountedRef = useRef(true);
  const activeDailyCheckIdRef = useRef(null);
  const restoreRequestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      Object.values(controllersRef.current).forEach((controller) => controller.abort());
      controllersRef.current = {};
    };
  }, []);

  const uploadPhoto = useCallback(async ({ dailyCheckId, draft }) => {
    const checklistId = draft?.checklistId;
    if (!checklistId) return;

    const currentState = uploadStates[checklistId];
    if (currentState?.status === 'uploading' || currentState?.status === 'uploaded') {
      return;
    }

    if (!draft?.blob) {
      setUploadStates((current) => ({
        ...current,
        [checklistId]: {
          status: 'failed',
          uploadedPhoto: null,
          errorMessage: 'File foto lokal tidak ditemukan. Ambil ulang foto.',
        },
      }));
      return;
    }

    const controller = new AbortController();
    controllersRef.current[checklistId] = controller;

    setUploadStates((current) => ({
      ...current,
      [checklistId]: {
        status: 'uploading',
        uploadedPhoto: null,
        errorMessage: '',
      },
    }));

    try {
      const uploadedPhoto = await uploadDailyCheckPhoto({
        dailyCheckId,
        draft,
        signal: controller.signal,
      });

      if (!mountedRef.current) return;

      setUploadStates((current) => ({
        ...current,
        [checklistId]: {
          status: 'uploaded',
          uploadedPhoto,
          errorMessage: '',
        },
      }));
    } catch (error) {
      if (!mountedRef.current || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }

      const isDuplicateUploadedSlot = error?.response?.status === 409
        && error?.response?.data?.error === 'Foto bagian ini sudah diupload';
      if (isDuplicateUploadedSlot) {
        try {
          const photos = await getDailyCheckPhotos({ dailyCheckId, signal: controller.signal });
          if (!mountedRef.current) return;
          const restoredPhoto = photos.find((photo) => getChecklistIdForUploadedPhoto(photo) === checklistId);
          if (restoredPhoto) {
            setUploadStates((current) => ({
              ...current,
              [checklistId]: {
                status: 'uploaded',
                uploadedPhoto: restoredPhoto,
                errorMessage: null,
              },
            }));
            return;
          }
        } catch (restoreErrorAfterConflict) {
          if (
            !mountedRef.current
            || restoreErrorAfterConflict?.name === 'CanceledError'
            || restoreErrorAfterConflict?.name === 'AbortError'
          ) {
            return;
          }
        }
      }

      setUploadStates((current) => ({
        ...current,
        [checklistId]: {
          status: 'failed',
          uploadedPhoto: null,
          errorMessage: getUploadErrorMessage(error),
        },
      }));
    } finally {
      delete controllersRef.current[checklistId];
    }
  }, [uploadStates]);

  const retryUpload = useCallback(({ dailyCheckId, draft }) => {
    uploadPhoto({ dailyCheckId, draft });
  }, [uploadPhoto]);

  const restoreUploadedPhotos = useCallback((photos) => {
    setUploadStates((current) => {
      const next = { ...current };

      photos.forEach((photo) => {
        const checklistId = getChecklistIdForUploadedPhoto(photo);
        if (!checklistId) return;

        next[checklistId] = {
          status: 'uploaded',
          uploadedPhoto: photo,
          errorMessage: null,
        };
      });

      return next;
    });
  }, []);

  const loadUploadedPhotos = useCallback(async ({ dailyCheckId, signal }) => {
    if (!dailyCheckId) return [];

    const requestId = restoreRequestIdRef.current + 1;
    restoreRequestIdRef.current = requestId;

    if (activeDailyCheckIdRef.current !== dailyCheckId) {
      activeDailyCheckIdRef.current = dailyCheckId;
      Object.values(controllersRef.current).forEach((controller) => controller.abort());
      controllersRef.current = {};
      setUploadStates({});
    }

    setRestoreStatus('loading');
    setRestoreError(null);

    try {
      const photos = await getDailyCheckPhotos({ dailyCheckId, signal });
      if (
        !mountedRef.current
        || requestId !== restoreRequestIdRef.current
        || activeDailyCheckIdRef.current !== dailyCheckId
      ) {
        return [];
      }

      restoreUploadedPhotos(photos);
      setRestoreStatus('success');
      setRestoreError(null);
      return photos;
    } catch (error) {
      if (
        error?.name === 'CanceledError'
        || error?.name === 'AbortError'
        || requestId !== restoreRequestIdRef.current
        || activeDailyCheckIdRef.current !== dailyCheckId
      ) {
        return [];
      }

      setRestoreStatus('error');
      setRestoreError('Sesi berhasil dibuka, tetapi status foto gagal dimuat.');
      throw error;
    }
  }, [restoreUploadedPhotos]);

  const clearUploads = useCallback(() => {
    Object.values(controllersRef.current).forEach((controller) => controller.abort());
    controllersRef.current = {};
    activeDailyCheckIdRef.current = null;
    restoreRequestIdRef.current += 1;
    setUploadStates({});
    setRestoreStatus('idle');
    setRestoreError(null);
  }, []);

  const uploadedRequiredCount = useMemo(() => {
    return Object.entries(uploadStates).filter(([checklistId, state]) => (
      REQUIRED_CHECKLIST_IDS.has(checklistId) && state.status === 'uploaded'
    )).length;
  }, [uploadStates]);

  const isUploadingAny = useMemo(() => {
    return Object.values(uploadStates).some((state) => state.status === 'uploading');
  }, [uploadStates]);

  const hasUploadFailures = useMemo(() => {
    return Object.entries(uploadStates).some(([checklistId, state]) => (
      REQUIRED_CHECKLIST_IDS.has(checklistId) && state.status === 'failed'
    ));
  }, [uploadStates]);

  return {
    uploadStates,
    restoreStatus,
    restoreError,
    uploadPhoto,
    retryUpload,
    restoreUploadedPhotos,
    loadUploadedPhotos,
    isUploadingAny,
    hasUploadFailures,
    uploadedRequiredCount,
    allRequiredUploaded: uploadedRequiredCount === REQUIRED_CHECKLIST_IDS.size,
    clearUploads,
  };
}
