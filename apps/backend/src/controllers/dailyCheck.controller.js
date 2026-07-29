const userModel = require('../models/user.model');
const vehicleModel = require('../models/vehicle.model');
const dailyCheckModel = require('../models/dailyCheck.model');
const storageService = require('../services/storage.service');

const VALID_PART_TYPES = ['odo', 'body_kiri', 'body_kanan', 'kap', 'depan', 'belakang', 'interior', 'ban', 'lainnya'];
const VALID_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function parsePartIndex(value) {
  if (value === undefined || value === null || value === '') return null;
  if (Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^[1-4]$/.test(value)) return Number(value);
  return Number.NaN;
}

function validatePhotoSlot(partType, rawPartIndex) {
  const partIndex = parsePartIndex(rawPartIndex);

  if (!VALID_PART_TYPES.includes(partType)) {
    return { error: 'part_type tidak valid' };
  }

  if (partType === 'ban') {
    if (!Number.isInteger(partIndex) || partIndex < 1 || partIndex > 4) {
      return { error: 'part_index wajib 1 sampai 4 untuk foto ban' };
    }
    return { partIndex };
  }

  if (partIndex !== null) {
    return { error: 'part_index hanya boleh dikirim untuk foto ban' };
  }

  return { partIndex: null };
}

function getLogicalSlot(partType, partIndex) {
  return partType === 'ban' ? `${partType}_${partIndex}` : partType;
}

function getPhotoKeyPrefix(dailyCheckId) {
  const year = new Date().getFullYear();
  return `inspections/${year}/${dailyCheckId}/`;
}

function isSafePhotoKey({ key, dailyCheckId, partType, partIndex }) {
  if (!key || typeof key !== 'string') return false;
  const prefix = getPhotoKeyPrefix(dailyCheckId);
  const slot = getLogicalSlot(partType, partIndex);
  return key.startsWith(prefix) && key.includes(`/${slot}_`) && /\.(jpe?g|png|webp)$/i.test(key);
}

function getExtensionForContentType(contentType) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

function serializeDailyCheck(dailyCheck) {
  if (!dailyCheck) return null;
  return {
    daily_id: dailyCheck.daily_id,
    users_id: dailyCheck.users_id,
    vehicle_id: dailyCheck.vehicle_id,
    actual_driver_name: dailyCheck.actual_driver_name,
    gps_lat: dailyCheck.gps_lat,
    gps_long: dailyCheck.gps_long,
    gps_address: dailyCheck.gps_address,
    status: dailyCheck.status,
    check_date: dailyCheck.check_date,
    created_at: dailyCheck.created_at,
    vehicle: {
      plate_number: dailyCheck.plate_number,
      brand: dailyCheck.brand,
      model: dailyCheck.model,
    },
  };
}

async function startDailyCheck(req, res) {
  const { vehicle_id, actual_driver_name, gps_lat, gps_long, gps_address } = req.body;
  const userId = req.user.id;

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id wajib diisi' });
  }

  try {
    const user = await userModel.findById(userId);

    if (user?.is_shared_account && !actual_driver_name) {
      return res.status(400).json({ error: 'Nama driver wajib diisi untuk akun ini' });
    }

    const vehicle = await vehicleModel.findById(vehicle_id);
    if (!vehicle || vehicle.status !== 'active') {
      return res.status(404).json({ error: 'Mobil tidak ditemukan atau tidak aktif' });
    }

    const existingCheck = await dailyCheckModel.findByVehicleAndDate(vehicle_id, 'CURRENT_DATE');
    if (existingCheck) {
      return res.status(409).json({ error: 'Mobil ini sudah di-checking hari ini' });
    }

    const dailyCheck = await dailyCheckModel.createDailyCheck({
      users_id: userId,
      vehicle_id,
      actual_driver_name,
      gps_lat,
      gps_long,
      gps_address,
    });

    res.status(201).json({ daily_check: dailyCheck });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getActiveDailyCheck(req, res) {
  const { vehicle_id } = req.query;

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id wajib diisi' });
  }

  try {
    const dailyCheck = await dailyCheckModel.findActiveByVehicleAndUser(vehicle_id, req.user.id);
    res.json({ daily_check: serializeDailyCheck(dailyCheck) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * Generate Presigned Upload URL for Driver to upload photo directly to MinIO
 */
async function getPhotoUploadUrl(req, res) {
  const { dailyCheckId } = req.params;
  const { part_type, part_index, content_type } = req.body;

  const slotValidation = validatePhotoSlot(part_type, part_index);
  if (slotValidation.error) {
    return res.status(400).json({ error: slotValidation.error });
  }

  const mimeType = content_type || 'image/jpeg';
  if (!VALID_CONTENT_TYPES.includes(mimeType)) {
    return res.status(400).json({ error: 'content_type tidak valid' });
  }

  try {
    const dailyCheck = await dailyCheckModel.findByIdAndUser(dailyCheckId, req.user.id);
    if (!dailyCheck) {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    if (dailyCheck.status !== 'incomplete') {
      return res.status(409).json({ error: 'Daily check sudah disubmit' });
    }

    const existingPhoto = await dailyCheckModel.findPhotoByLogicalSlot({
      daily_id: dailyCheckId,
      part_type,
      part_index: slotValidation.partIndex,
    });
    if (existingPhoto) {
      return res.status(409).json({ error: 'Foto bagian ini sudah diupload' });
    }

    const uniqueValue = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const extension = getExtensionForContentType(mimeType);
    const key = `${getPhotoKeyPrefix(dailyCheckId)}${getLogicalSlot(part_type, slotValidation.partIndex)}_${uniqueValue}.${extension}`;

    const { uploadUrl, expiresIn } = await storageService.generateUploadPresignedUrl(key, mimeType, 300);

    res.json({
      upload_url: uploadUrl,
      key,
      part_type,
      part_index: slotValidation.partIndex,
      expires_in: expiresIn,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

/**
 * Confirm photo record after client finishes uploading to MinIO
 */
async function uploadPhoto(req, res) {
  const { dailyCheckId } = req.params;
  const { part_type, part_index, key, note } = req.body;

  const slotValidation = validatePhotoSlot(part_type, part_index);
  if (slotValidation.error) {
    return res.status(400).json({ error: slotValidation.error });
  }

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'key wajib diisi' });
  }

  if (!isSafePhotoKey({
    key,
    dailyCheckId,
    partType: part_type,
    partIndex: slotValidation.partIndex,
  })) {
    return res.status(400).json({ error: 'key foto tidak valid' });
  }

  try {
    const dailyCheck = await dailyCheckModel.findByIdAndUser(dailyCheckId, req.user.id);
    if (!dailyCheck) {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    if (dailyCheck.status !== 'incomplete') {
      return res.status(409).json({ error: 'Daily check sudah disubmit' });
    }

    const existingPhoto = await dailyCheckModel.findPhotoByLogicalSlot({
      daily_id: dailyCheckId,
      part_type,
      part_index: slotValidation.partIndex,
    });
    if (existingPhoto) {
      return res.status(409).json({ error: 'Foto bagian ini sudah diupload' });
    }

    const exists = await storageService.objectExists(key);
    if (!exists) {
      return res.status(404).json({ error: 'File foto belum ditemukan di storage' });
    }

    const thumbnailKey = `thumb_${key}`;

    const photo = await dailyCheckModel.addPhoto({
      daily_id: dailyCheckId,
      part_type,
      part_index: slotValidation.partIndex,
      r2_key: key,
      thumbnail_key: thumbnailKey,
      note,
    });

    const viewUrl = await storageService.generateViewPresignedUrl(key);

    res.status(201).json({
      photo: {
        ...photo,
        url: viewUrl,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getDailyCheckPhotos(req, res) {
  const { dailyCheckId } = req.params;

  try {
    const dailyCheck = await dailyCheckModel.findByIdAndUser(dailyCheckId, req.user.id);
    if (!dailyCheck) {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    const photos = await dailyCheckModel.getPhotosByDailyId(dailyCheckId);
    res.json({ photos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function submitDailyCheck(req, res) {
  const { dailyCheckId } = req.params;

  try {
    const dailyCheck = await dailyCheckModel.findByIdAndUser(dailyCheckId, req.user.id);
    if (!dailyCheck) {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    const photos = await dailyCheckModel.getPhotosByDailyId(dailyCheckId);
    const uploadedParts = photos.map(p => p.part_type);

    const requiredSingle = ['odo', 'kap', 'depan', 'belakang', 'interior'];
    const requiredMulti = ['body_kiri', 'body_kanan'];
    const banCount = uploadedParts.filter(p => p === 'ban').length;

    const missing = [];

    for (const part of requiredSingle) {
      if (!uploadedParts.includes(part)) missing.push(part);
    }
    for (const part of requiredMulti) {
      if (!uploadedParts.includes(part)) missing.push(part);
    }
    if (banCount < 4) {
      missing.push(`ban (baru ${banCount}/4 foto)`);
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Laporan belum lengkap',
        missing_parts: missing,
      });
    }

    const updated = await dailyCheckModel.updateStatus(dailyCheckId, 'submitted');

    res.json({ message: 'Laporan berhasil disubmit', daily_check: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = {
  startDailyCheck,
  getActiveDailyCheck,
  getPhotoUploadUrl,
  uploadPhoto,
  getDailyCheckPhotos,
  submitDailyCheck,
};
