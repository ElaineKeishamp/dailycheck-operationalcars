const userModel = require('../models/user.model');
const vehicleModel = require('../models/vehicle.model');
const dailyCheckModel = require('../models/dailyCheck.model');
const storageService = require('../services/storage.service');

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

/**
 * Generate Presigned Upload URL for Driver to upload photo directly to MinIO
 */
async function getPhotoUploadUrl(req, res) {
  const { dailyCheckId } = req.params;
  const { part_type, content_type } = req.body;

  const validPartTypes = ['odo', 'body_kiri', 'body_kanan', 'kap', 'depan', 'belakang', 'interior', 'ban', 'lainnya'];

  if (!part_type || !validPartTypes.includes(part_type)) {
    return res.status(400).json({ error: 'part_type tidak valid' });
  }

  try {
    const dailyCheck = await dailyCheckModel.findByIdAndUser(dailyCheckId, req.user.id);
    if (!dailyCheck) {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const key = `inspections/${year}/${dailyCheckId}/${part_type}_${timestamp}.webp`;
    const mimeType = content_type || 'image/webp';

    const { uploadUrl, expiresIn } = await storageService.generateUploadPresignedUrl(key, mimeType, 300);

    res.json({
      upload_url: uploadUrl,
      key,
      part_type,
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
  const { part_type, key, r2_key, note } = req.body;

  const validPartTypes = ['odo', 'body_kiri', 'body_kanan', 'kap', 'depan', 'belakang', 'interior', 'ban', 'lainnya'];

  if (!part_type || !validPartTypes.includes(part_type)) {
    return res.status(400).json({ error: 'part_type tidak valid' });
  }

  try {
    const dailyCheck = await dailyCheckModel.findByIdAndUser(dailyCheckId, req.user.id);
    if (!dailyCheck) {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    const fileKey = key || r2_key || `inspections/${new Date().getFullYear()}/${dailyCheckId}/${part_type}_${Date.now()}.webp`;
    const thumbnailKey = `thumb_${fileKey}`;

    const photo = await dailyCheckModel.addPhoto({
      daily_id: dailyCheckId,
      part_type,
      r2_key: fileKey,
      thumbnail_key: thumbnailKey,
      note,
    });

    const viewUrl = await storageService.generateViewPresignedUrl(fileKey);

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

module.exports = { startDailyCheck, getPhotoUploadUrl, uploadPhoto, submitDailyCheck };
