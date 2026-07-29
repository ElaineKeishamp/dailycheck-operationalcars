import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STANDARD_PHOTO_ITEMS, TIRE_CHECKLIST_ITEMS } from '../config/driverChecklist';
import { uploadDailyCheckPhoto } from '../services/driverPhotoService';

const REQUIRED_CHECKLIST_IDS = new Set([
  ...STANDARD_PHOTO_ITEMS.map((item) => item.id),
  ...TIRE_CHECKLIST_ITEMS.map((item) => item.id),
]);

function getUploadErrorMessage(error) {
  if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
    return 'Upload foto dibatalkan';
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
  const controllersRef = useRef({});
  const mountedRef = useRef(true);

  useEffect(() => {
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

  const clearUploads = useCallback(() => {
    Object.values(controllersRef.current).forEach((controller) => controller.abort());
    controllersRef.current = {};
    setUploadStates({});
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
    uploadPhoto,
    retryUpload,
    isUploadingAny,
    hasUploadFailures,
    uploadedRequiredCount,
    allRequiredUploaded: uploadedRequiredCount === REQUIRED_CHECKLIST_IDS.size,
    clearUploads,
  };
}
