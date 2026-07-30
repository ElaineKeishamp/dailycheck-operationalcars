import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { STANDARD_PHOTO_ITEMS, TIRE_CHECKLIST_ITEMS } from '../config/driverChecklist';
import {
  cancelPendingPhotoUpload,
  confirmDailyCheckPhoto,
  getDailyCheckPhotos,
  requestPhotoUploadUrl,
  uploadPhotoToPresignedUrl,
  UPLOAD_CANCEL_FAILED,
  UPLOAD_CONFIRM_FAILED,
  UPLOAD_PREPARE_FAILED,
  UPLOAD_STORAGE_FAILED,
} from '../services/driverPhotoService';
import { deleteDailyCheckPhoto } from '../services/driverDailyCheckService';

const REQUIRED_CHECKLIST_IDS = new Set([
  ...STANDARD_PHOTO_ITEMS.map((item) => item.id),
  ...TIRE_CHECKLIST_ITEMS.map((item) => item.id),
]);
const PENDING_CONFIRMATION_STORAGE_KEY = 'dailycheck.pendingPhotoConfirmations.v1';

function getChecklistIdForUploadedPhoto(photo) {
  if (!photo?.partType) return null;
  if (photo.partType === 'ban') {
    return Number.isInteger(photo.partIndex) && photo.partIndex >= 1 && photo.partIndex <= 4
      ? `ban_${photo.partIndex}`
      : null;
  }
  return photo.partType;
}

function readPendingConfirmations() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PENDING_CONFIRMATION_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingConfirmations(records) {
  const validRecords = records.filter((record) => (
    record
    && typeof record.dailyCheckId === 'string'
    && typeof record.checklistId === 'string'
    && typeof record.uploadTicket === 'string'
    && typeof record.key === 'string'
  ));
  if (validRecords.length === 0) {
    sessionStorage.removeItem(PENDING_CONFIRMATION_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(PENDING_CONFIRMATION_STORAGE_KEY, JSON.stringify(validRecords));
}

function savePendingConfirmation(record) {
  const records = readPendingConfirmations().filter((item) => (
    item.dailyCheckId !== record.dailyCheckId || item.checklistId !== record.checklistId
  ));
  records.push(record);
  writePendingConfirmations(records);
}

function removePendingConfirmation({ dailyCheckId, checklistId }) {
  writePendingConfirmations(readPendingConfirmations().filter((item) => (
    item.dailyCheckId !== dailyCheckId || item.checklistId !== checklistId
  )));
}

function getStoredPendingConfirmations(dailyCheckId) {
  const now = Date.now();
  const records = readPendingConfirmations();
  const freshRecords = records.filter((record) => !record.expiresAt || Date.parse(record.expiresAt) > now);
  if (freshRecords.length !== records.length) {
    writePendingConfirmations(freshRecords);
  }
  return freshRecords.filter((record) => record.dailyCheckId === dailyCheckId);
}

function getContentType(draft) {
  const type = draft?.blob?.type || 'image/jpeg';
  return ['image/jpeg', 'image/png', 'image/webp'].includes(type) ? type : 'image/jpeg';
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

function getConfirmationErrorMessage(error) {
  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.error;

  if (status === 400) return serverMessage || 'Tiket upload tidak valid. Ambil ulang foto.';
  if (status === 404) return serverMessage || 'File foto tidak ditemukan di penyimpanan. Ambil ulang foto.';
  if (status === 409) return serverMessage || 'Laporan atau slot foto sudah tidak dapat dikonfirmasi.';
  if (status === 403) return serverMessage || 'Konfirmasi foto tidak diizinkan.';
  if (status === 401) return 'Sesi login berakhir. Silakan login kembali.';

  return serverMessage || error?.message || 'Foto terkirim, tetapi gagal dikonfirmasi. Coba konfirmasi lagi.';
}

function getCancelErrorMessage(error) {
  if (error?.code === UPLOAD_CANCEL_FAILED) {
    return error?.response?.data?.error || 'Gagal membatalkan upload tertunda.';
  }
  return error?.response?.data?.error || error?.message || 'Gagal membatalkan upload tertunda.';
}

function getDeleteErrorMessage(error) {
  if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
    return 'Penghapusan foto dibatalkan';
  }

  const status = error?.response?.status;
  const serverMessage = error?.response?.data?.error;

  if (status === 409) return serverMessage || 'Laporan sudah dikirim. Foto tidak dapat dihapus.';
  if (status === 404) return serverMessage || 'Foto tidak ditemukan atau sudah dihapus.';
  if (status === 403) return serverMessage || 'Anda tidak memiliki akses untuk menghapus foto ini.';
  if (status === 400) return serverMessage || 'Data foto tidak valid.';

  return error?.message || 'Gagal menghapus foto. Silakan coba lagi.';
}

export function usePhotoUploads() {
  const [uploadStates, setUploadStates] = useState({});
  const [restoreStatus, setRestoreStatus] = useState('idle');
  const [restoreError, setRestoreError] = useState(null);
  const controllersRef = useRef({});
  const deleteControllersRef = useRef({});
  const confirmControllersRef = useRef({});
  const cancelControllersRef = useRef({});
  const mountedRef = useRef(true);
  const activeDailyCheckIdRef = useRef(null);
  const restoreRequestIdRef = useRef(0);
  const uploadStatesRef = useRef({});

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      Object.values(controllersRef.current).forEach((controller) => controller.abort());
      Object.values(deleteControllersRef.current).forEach((controller) => controller.abort());
      Object.values(confirmControllersRef.current).forEach((controller) => controller.abort());
      Object.values(cancelControllersRef.current).forEach((controller) => controller.abort());
      controllersRef.current = {};
      deleteControllersRef.current = {};
      confirmControllersRef.current = {};
      cancelControllersRef.current = {};
    };
  }, []);

  const uploadPhoto = useCallback(async ({ dailyCheckId, draft }) => {
    const checklistId = draft?.checklistId;
    if (!checklistId) return;

    const currentState = uploadStatesRef.current[checklistId];
    if (['uploading', 'confirming', 'canceling', 'uploaded'].includes(currentState?.status)) {
      return;
    }

    if (!draft?.blob) {
      setUploadStates((current) => {
        const next = {
          ...current,
          [checklistId]: {
            status: 'failed',
            uploadedPhoto: null,
            errorMessage: 'File foto lokal tidak ditemukan. Ambil ulang foto.',
          },
        };
        uploadStatesRef.current = next;
        return next;
      });
      return;
    }

    const controller = new AbortController();
    controllersRef.current[checklistId] = controller;
    uploadStatesRef.current = {
      ...uploadStatesRef.current,
      [checklistId]: {
        status: 'uploading',
        uploadedPhoto: null,
        errorMessage: '',
      },
    };

    setUploadStates((current) => {
      const next = {
        ...current,
        [checklistId]: {
          status: 'uploading',
          uploadedPhoto: null,
          errorMessage: '',
        },
      };
      uploadStatesRef.current = next;
      return next;
    });

    try {
      const contentType = getContentType(draft);
      const uploadRequest = await requestPhotoUploadUrl({
        dailyCheckId,
        draft,
        contentType,
        signal: controller.signal,
      });

      await uploadPhotoToPresignedUrl({
        uploadUrl: uploadRequest.uploadUrl,
        blob: draft.blob,
        contentType,
        signal: controller.signal,
      });

      if (!mountedRef.current) return;

      const pendingConfirmation = {
        dailyCheckId,
        checklistId,
        partType: draft.partType,
        partIndex: draft.partIndex ?? null,
        key: uploadRequest.objectKey || uploadRequest.key,
        uploadTicket: uploadRequest.uploadTicket,
        expiresAt: uploadRequest.expiresAt,
      };
      savePendingConfirmation(pendingConfirmation);

      setUploadStates((current) => {
        const next = {
          ...current,
          [checklistId]: {
            status: 'confirming',
            uploadedPhoto: null,
            pendingConfirmation,
            errorMessage: '',
          },
        };
        uploadStatesRef.current = next;
        return next;
      });

      const uploadedPhoto = await confirmDailyCheckPhoto({
        dailyCheckId,
        uploadTicket: uploadRequest.uploadTicket,
        note: draft.note,
        signal: controller.signal,
      });

      if (!mountedRef.current) return;

      removePendingConfirmation({ dailyCheckId, checklistId });
      setUploadStates((current) => {
        const next = {
          ...current,
          [checklistId]: {
            status: 'uploaded',
            uploadedPhoto,
            errorMessage: '',
          },
        };
        uploadStatesRef.current = next;
        return next;
      });
    } catch (error) {
      if (!mountedRef.current || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return;
      }

      const currentAfterError = uploadStatesRef.current[checklistId];
      if (currentAfterError?.status === 'confirming' && currentAfterError.pendingConfirmation) {
        const errorMessage = getConfirmationErrorMessage(error);
        setUploadStates((current) => {
          const next = {
            ...current,
            [checklistId]: {
              ...currentAfterError,
              status: error?.response?.status === 404 ? 'failed' : 'confirmation_failed',
              errorMessage,
            },
          };
          uploadStatesRef.current = next;
          return next;
        });
        if (error?.response?.status === 404) {
          removePendingConfirmation({ dailyCheckId, checklistId });
        }
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
            setUploadStates((current) => {
              const next = {
                ...current,
                [checklistId]: {
                  status: 'uploaded',
                  uploadedPhoto: restoredPhoto,
                  errorMessage: null,
                },
              };
              uploadStatesRef.current = next;
              return next;
            });
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

      setUploadStates((current) => {
        const next = {
          ...current,
          [checklistId]: {
            status: 'failed',
            uploadedPhoto: null,
            errorMessage: getUploadErrorMessage(error),
          },
        };
        uploadStatesRef.current = next;
        return next;
      });
    } finally {
      delete controllersRef.current[checklistId];
    }
  }, []);

  const retryUpload = useCallback(({ dailyCheckId, draft }) => {
    uploadPhoto({ dailyCheckId, draft });
  }, [uploadPhoto]);

  const retryPhotoConfirmation = useCallback(async ({
    dailyCheckId,
    checklistId,
    isOnline = true,
    isSubmitting = false,
  }) => {
    if (!dailyCheckId || !checklistId) {
      return { ok: false, errorMessage: 'Data konfirmasi foto tidak valid.' };
    }

    if (!isOnline) {
      return { ok: false, errorMessage: 'Anda sedang offline. Sambungkan internet sebelum konfirmasi ulang.' };
    }

    if (isSubmitting) {
      return { ok: false, errorMessage: 'Tunggu hingga proses submit selesai.' };
    }

    const currentState = uploadStatesRef.current[checklistId];
    const pendingConfirmation = currentState?.pendingConfirmation;
    if (!pendingConfirmation?.uploadTicket) {
      return { ok: false, errorMessage: 'Data konfirmasi tertunda tidak tersedia. Ambil ulang foto.' };
    }

    if (currentState.status === 'uploading' || currentState.isDeleting) {
      return { ok: false, errorMessage: 'Tunggu hingga proses foto selesai.' };
    }

    if (currentState.status === 'confirming' || confirmControllersRef.current[checklistId]) {
      return { ok: false, errorMessage: 'Foto sedang dikonfirmasi.' };
    }

    const controller = new AbortController();
    confirmControllersRef.current[checklistId] = controller;

    setUploadStates((current) => {
      const next = {
        ...current,
        [checklistId]: {
          ...currentState,
          status: 'confirming',
          errorMessage: '',
        },
      };
      uploadStatesRef.current = next;
      return next;
    });

    try {
      const uploadedPhoto = await confirmDailyCheckPhoto({
        dailyCheckId,
        uploadTicket: pendingConfirmation.uploadTicket,
        signal: controller.signal,
      });

      if (!mountedRef.current) return { ok: false, errorMessage: 'Konfirmasi foto dibatalkan' };

      removePendingConfirmation({ dailyCheckId, checklistId });
      setUploadStates((current) => {
        const next = {
          ...current,
          [checklistId]: {
            status: 'uploaded',
            uploadedPhoto,
            errorMessage: '',
          },
        };
        uploadStatesRef.current = next;
        return next;
      });

      return { ok: true, uploadedPhoto };
    } catch (error) {
      if (!mountedRef.current || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return { ok: false, errorMessage: 'Konfirmasi foto dibatalkan' };
      }

      const errorMessage = getConfirmationErrorMessage(error);
      const objectMissing = error?.response?.status === 404;
      if (objectMissing) {
        removePendingConfirmation({ dailyCheckId, checklistId });
      }

      setUploadStates((current) => {
        const slotState = current[checklistId] || currentState;
        const next = {
          ...current,
          [checklistId]: {
            ...slotState,
            status: objectMissing ? 'failed' : 'confirmation_failed',
            pendingConfirmation: objectMissing ? null : pendingConfirmation,
            errorMessage,
          },
        };
        uploadStatesRef.current = next;
        return next;
      });

      return { ok: false, errorMessage };
    } finally {
      delete confirmControllersRef.current[checklistId];
    }
  }, []);

  const cancelPendingUpload = useCallback(async ({
    dailyCheckId,
    checklistId,
    hasLocalDraft = false,
    isOnline = true,
    isSubmitting = false,
  }) => {
    if (!dailyCheckId || !checklistId) {
      return { ok: false, errorMessage: 'Data upload tertunda tidak valid.' };
    }

    if (!isOnline) {
      return { ok: false, errorMessage: 'Anda sedang offline. Sambungkan internet sebelum membatalkan upload.' };
    }

    if (isSubmitting) {
      return { ok: false, errorMessage: 'Tunggu hingga proses submit selesai.' };
    }

    const currentState = uploadStatesRef.current[checklistId];
    const pendingConfirmation = currentState?.pendingConfirmation;
    if (!pendingConfirmation?.uploadTicket) {
      return { ok: false, errorMessage: 'Data upload tertunda tidak tersedia.' };
    }

    if (currentState.status === 'canceling' || cancelControllersRef.current[checklistId]) {
      return { ok: false, errorMessage: 'Upload tertunda sedang dibatalkan.' };
    }

    const controller = new AbortController();
    cancelControllersRef.current[checklistId] = controller;

    setUploadStates((current) => {
      const next = {
        ...current,
        [checklistId]: {
          ...currentState,
          status: 'canceling',
          errorMessage: '',
        },
      };
      uploadStatesRef.current = next;
      return next;
    });

    try {
      await cancelPendingPhotoUpload({
        dailyCheckId,
        uploadTicket: pendingConfirmation.uploadTicket,
        signal: controller.signal,
      });

      if (!mountedRef.current) return { ok: false, errorMessage: 'Pembatalan upload dibatalkan' };

      removePendingConfirmation({ dailyCheckId, checklistId });
      setUploadStates((current) => {
        const next = { ...current };
        delete next[checklistId];
        uploadStatesRef.current = next;
        return next;
      });

      return { ok: true, hasLocalDraft };
    } catch (error) {
      if (!mountedRef.current || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return { ok: false, errorMessage: 'Pembatalan upload dibatalkan' };
      }

      const errorMessage = getCancelErrorMessage(error);
      setUploadStates((current) => {
        const slotState = current[checklistId] || currentState;
        const next = {
          ...current,
          [checklistId]: {
            ...slotState,
            status: 'confirmation_failed',
            errorMessage,
          },
        };
        uploadStatesRef.current = next;
        return next;
      });

      return { ok: false, errorMessage };
    } finally {
      delete cancelControllersRef.current[checklistId];
    }
  }, []);

  const deleteUploadedPhoto = useCallback(async ({
    dailyCheckId,
    checklistId,
    isOnline = true,
    isSubmitting = false,
  }) => {
    if (!dailyCheckId || !checklistId) {
      return { ok: false, errorMessage: 'Data foto tidak valid.' };
    }

    if (!isOnline) {
      return {
        ok: false,
        errorMessage: 'Anda sedang offline. Sambungkan kembali internet sebelum menghapus foto.',
      };
    }

    if (isSubmitting) {
      return { ok: false, errorMessage: 'Tunggu hingga proses submit selesai sebelum menghapus foto.' };
    }

    const currentState = uploadStatesRef.current[checklistId];
    const photoId = currentState?.uploadedPhoto?.checkPhotosId || currentState?.uploadedPhoto?.check_photos_id;

    if (currentState?.status === 'uploading') {
      return { ok: false, errorMessage: 'Tunggu hingga upload foto selesai sebelum menghapus.' };
    }

    if (currentState?.isDeleting || deleteControllersRef.current[checklistId]) {
      return { ok: false, errorMessage: 'Foto sedang dihapus.' };
    }

    if (currentState?.status !== 'uploaded' || !photoId) {
      return { ok: false, errorMessage: 'Foto belum tersimpan di server.' };
    }

    const controller = new AbortController();
    deleteControllersRef.current[checklistId] = controller;

    setUploadStates((current) => {
      const slotState = current[checklistId] || currentState;
      const next = {
        ...current,
        [checklistId]: {
          ...slotState,
          isDeleting: true,
          errorMessage: '',
        },
      };
      uploadStatesRef.current = next;
      return next;
    });

    try {
      const deletedPhoto = await deleteDailyCheckPhoto({
        dailyCheckId,
        photoId,
        signal: controller.signal,
      });

      if (!mountedRef.current) return { ok: false, errorMessage: 'Penghapusan foto dibatalkan' };

      restoreRequestIdRef.current += 1;
      setUploadStates((current) => {
        const next = { ...current };
        delete next[checklistId];
        uploadStatesRef.current = next;
        return next;
      });

      return { ok: true, deletedPhoto };
    } catch (error) {
      if (!mountedRef.current || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return { ok: false, errorMessage: 'Penghapusan foto dibatalkan' };
      }

      const errorMessage = getDeleteErrorMessage(error);
      setUploadStates((current) => {
        const slotState = current[checklistId] || currentState;
        const next = {
          ...current,
          [checklistId]: {
            ...slotState,
            status: 'uploaded',
            isDeleting: false,
            errorMessage,
          },
        };
        uploadStatesRef.current = next;
        return next;
      });

      return { ok: false, errorMessage };
    } finally {
      delete deleteControllersRef.current[checklistId];
    }
  }, []);

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

      uploadStatesRef.current = next;
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
      Object.values(deleteControllersRef.current).forEach((controller) => controller.abort());
      Object.values(confirmControllersRef.current).forEach((controller) => controller.abort());
      Object.values(cancelControllersRef.current).forEach((controller) => controller.abort());
      controllersRef.current = {};
      deleteControllersRef.current = {};
      confirmControllersRef.current = {};
      cancelControllersRef.current = {};
      uploadStatesRef.current = {};
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
      const restoredChecklistIds = new Set(photos.map(getChecklistIdForUploadedPhoto).filter(Boolean));
      const pendingConfirmations = getStoredPendingConfirmations(dailyCheckId)
        .filter((record) => !restoredChecklistIds.has(record.checklistId));
      if (pendingConfirmations.length > 0) {
        setUploadStates((current) => {
          const next = { ...current };
          pendingConfirmations.forEach((pendingConfirmation) => {
            next[pendingConfirmation.checklistId] = {
              status: 'confirmation_failed',
              uploadedPhoto: null,
              pendingConfirmation,
              errorMessage: 'Foto sudah terkirim ke penyimpanan, tetapi belum tercatat di laporan.',
            };
          });
          uploadStatesRef.current = next;
          return next;
        });
      }
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
    Object.values(deleteControllersRef.current).forEach((controller) => controller.abort());
    Object.values(confirmControllersRef.current).forEach((controller) => controller.abort());
    Object.values(cancelControllersRef.current).forEach((controller) => controller.abort());
    controllersRef.current = {};
    deleteControllersRef.current = {};
    confirmControllersRef.current = {};
    cancelControllersRef.current = {};
    activeDailyCheckIdRef.current = null;
    restoreRequestIdRef.current += 1;
    uploadStatesRef.current = {};
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
    return Object.values(uploadStates).some((state) => ['uploading', 'confirming', 'canceling'].includes(state.status));
  }, [uploadStates]);

  const isDeletingAny = useMemo(() => {
    return Object.values(uploadStates).some((state) => state.isDeleting);
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
    retryPhotoConfirmation,
    cancelPendingUpload,
    deleteUploadedPhoto,
    restoreUploadedPhotos,
    loadUploadedPhotos,
    isUploadingAny,
    isDeletingAny,
    hasUploadFailures,
    uploadedRequiredCount,
    allRequiredUploaded: uploadedRequiredCount === REQUIRED_CHECKLIST_IDS.size,
    clearUploads,
  };
}
