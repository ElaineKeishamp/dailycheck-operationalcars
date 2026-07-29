import apiClient from '../api/client';

function createSafeFilename(draft) {
  const baseName = String(draft?.checklistId || draft?.partType || 'foto')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `daily-check-${baseName || 'foto'}.jpg`;
}

function normalizeUploadedPhoto(responsePhoto) {
  if (!responsePhoto?.check_photos_id) {
    throw new Error('Response upload foto tidak valid');
  }

  if (typeof responsePhoto.r2_key === 'string' && responsePhoto.r2_key.startsWith('dummy/')) {
    throw new Error('Upload foto belum tersimpan di storage');
  }

  return {
    checkPhotosId: responsePhoto.check_photos_id,
    partType: responsePhoto.part_type,
    r2Key: responsePhoto.r2_key,
    thumbnailKey: responsePhoto.thumbnail_key,
    raw: responsePhoto,
  };
}

export async function uploadDailyCheckPhoto({ dailyCheckId, draft, signal }) {
  if (!dailyCheckId) {
    throw new Error('Sesi daily check belum tersedia');
  }

  if (!draft?.blob) {
    throw new Error('File foto lokal tidak ditemukan');
  }

  const formData = new FormData();
  const photoFile = new File(
    [draft.blob],
    createSafeFilename(draft),
    { type: draft.blob.type || 'image/jpeg' },
  );

  formData.append('photo', photoFile);
  formData.append('part_type', draft.partType);

  if (draft.note?.trim()) {
    formData.append('note', draft.note.trim());
  }

  const response = await apiClient.post(`/daily-checks/${dailyCheckId}/photos`, formData, { signal });
  return normalizeUploadedPhoto(response.data?.photo);
}
