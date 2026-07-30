import apiClient from '../api/client';

const UPLOAD_PREPARE_FAILED = 'UPLOAD_PREPARE_FAILED';
const UPLOAD_STORAGE_FAILED = 'UPLOAD_STORAGE_FAILED';
const UPLOAD_CONFIRM_FAILED = 'UPLOAD_CONFIRM_FAILED';
const UPLOAD_CANCEL_FAILED = 'UPLOAD_CANCEL_FAILED';

function withCode(error, code) {
  const wrappedError = new Error(error?.message || 'Upload foto gagal');
  wrappedError.code = code;
  wrappedError.name = error?.name || wrappedError.name;
  wrappedError.response = error?.response;
  wrappedError.cause = error;
  return wrappedError;
}

function formatPresignedUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return url.replace(/^http:\/\/(localhost|127\.0\.0\.1):9000/, window.location.origin);
  }
  return url;
}

function normalizeUploadedPhoto(responsePhoto) {
  if (!responsePhoto?.check_photos_id) {
    throw new Error('Response upload foto tidak valid');
  }

  if (typeof responsePhoto.r2_key === 'string' && responsePhoto.r2_key.startsWith('dummy/')) {
    throw new Error('Upload foto belum tersimpan di storage');
  }

  return {
    check_photos_id: responsePhoto.check_photos_id,
    checkPhotosId: responsePhoto.check_photos_id,
    daily_id: responsePhoto.daily_id,
    dailyId: responsePhoto.daily_id,
    part_type: responsePhoto.part_type,
    partType: responsePhoto.part_type,
    part_index: responsePhoto.part_index ?? null,
    partIndex: responsePhoto.part_index ?? null,
    r2_key: responsePhoto.r2_key,
    r2Key: responsePhoto.r2_key,
    thumbnail_key: responsePhoto.thumbnail_key,
    thumbnailKey: responsePhoto.thumbnail_key,
    url: formatPresignedUrl(responsePhoto.url),
    note: responsePhoto.note || '',
    created_at: responsePhoto.created_at,
    createdAt: responsePhoto.created_at,
    raw: responsePhoto,
  };
}

function getContentType(draft) {
  const type = draft?.blob?.type || 'image/jpeg';
  return ['image/jpeg', 'image/png', 'image/webp'].includes(type) ? type : 'image/jpeg';
}

export async function requestPhotoUploadUrl({ dailyCheckId, draft, contentType, signal }) {
  try {
    const response = await apiClient.post(
      `/daily-checks/${dailyCheckId}/photo-url`,
      {
        part_type: draft.partType,
        part_index: draft.partIndex ?? null,
        content_type: contentType,
      },
      { signal },
    );

    if (!response.data?.upload_url || !response.data?.key || !response.data?.upload_ticket) {
      throw new Error('Response upload URL tidak valid');
    }

    return {
      uploadUrl: formatPresignedUrl(response.data.upload_url),
      key: response.data.key,
      objectKey: response.data.object_key || response.data.key,
      uploadTicket: response.data.upload_ticket,
      expiresIn: response.data.expires_in,
      expiresAt: response.data.expires_at,
    };
  } catch (error) {
    throw withCode(error, UPLOAD_PREPARE_FAILED);
  }
}

export async function uploadPhotoToPresignedUrl({ uploadUrl, blob, contentType, signal }) {
  let response;

  try {
    response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: blob,
      signal,
    });
  } catch (error) {
    throw withCode(error, UPLOAD_STORAGE_FAILED);
  }

  if (!response.ok) {
    throw withCode(new Error('MinIO upload gagal'), UPLOAD_STORAGE_FAILED);
  }
}

export async function confirmDailyCheckPhoto({ dailyCheckId, uploadTicket, note, signal }) {
  try {
    const response = await apiClient.post(
      `/daily-checks/${dailyCheckId}/photos`,
      {
        upload_ticket: uploadTicket,
        note: note || undefined,
      },
      { signal },
    );

    return normalizeUploadedPhoto(response.data?.photo);
  } catch (error) {
    throw withCode(error, UPLOAD_CONFIRM_FAILED);
  }
}

export async function cancelPendingPhotoUpload({ dailyCheckId, uploadTicket, signal }) {
  try {
    const response = await apiClient.post(
      `/daily-checks/${dailyCheckId}/photo-uploads/cancel`,
      { upload_ticket: uploadTicket },
      { signal },
    );

    return response.data?.data || null;
  } catch (error) {
    throw withCode(error, UPLOAD_CANCEL_FAILED);
  }
}

export async function uploadDailyCheckPhoto({ dailyCheckId, draft, signal }) {
  if (!dailyCheckId) {
    throw new Error('Sesi daily check belum tersedia');
  }

  if (!draft?.blob) {
    throw new Error('File foto lokal tidak ditemukan');
  }

  const contentType = getContentType(draft);
  const { uploadUrl, uploadTicket } = await requestPhotoUploadUrl({
    dailyCheckId,
    draft,
    contentType,
    signal,
  });

  await uploadPhotoToPresignedUrl({
    uploadUrl,
    blob: draft.blob,
    contentType,
    signal,
  });

  return confirmDailyCheckPhoto({
    dailyCheckId,
    uploadTicket,
    note: draft.note,
    signal,
  });
}

export async function getDailyCheckPhotos({ dailyCheckId, signal }) {
  if (!dailyCheckId) {
    throw new Error('Sesi daily check belum tersedia');
  }

  const response = await apiClient.get(`/daily-checks/${dailyCheckId}/photos`, { signal });
  const photos = Array.isArray(response.data?.photos) ? response.data.photos : [];
  return photos.filter((photo) => photo?.check_photos_id).map(normalizeUploadedPhoto);
}

export {
  UPLOAD_CONFIRM_FAILED,
  UPLOAD_CANCEL_FAILED,
  UPLOAD_PREPARE_FAILED,
  UPLOAD_STORAGE_FAILED,
};
