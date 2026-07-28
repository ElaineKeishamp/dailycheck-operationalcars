const userModel = require('../models/user.model');
const vehicleModel = require('../models/vehicle.model');
const dailyCheckModel = require('../models/dailyCheck.model');
const checkPhotoModel = require('../models/checkPhoto.model');

const VALID_PART_TYPES = [
  'odo', 'body_kiri', 'body_kanan', 'kap', 'depan', 'belakang', 'interior', 'ban', 'lainnya',
];
const REQUIRED_SINGLE = ['odo', 'kap', 'depan', 'belakang', 'interior'];
const REQUIRED_MULTI = ['body_kiri', 'body_kanan'];

async function startDailyCheck(req, res) {
  const { vehicle_id, actual_driver_name, gps_lat, gps_long, gps_address } = req.body;
  const userId = req.user.id;

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id wajib diisi' });
  }

  try {
    const user = await userModel.findById(userId);
    if (user.is_shared_account && !actual_driver_name) {
      return res.status(400).json({ error: 'Nama driver wajib diisi untuk akun ini' });
    }

    const vehicle = await vehicleModel.findActiveById(vehicle_id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Mobil tidak ditemukan atau tidak aktif' });
    }

    const existingCheck = await dailyCheckModel.findByVehicleAndDate(vehicle_id);
    if (existingCheck) {
      return res.status(409).json({ error: 'Mobil ini sudah di-checking hari ini' });
    }

    const dailyCheck = await dailyCheckModel.create({
      userId,
      vehicleId: vehicle_id,
      actualDriverName: actual_driver_name,
      gpsLat: gps_lat,
      gpsLong: gps_long,
      gpsAddress: gps_address,
    });

    res.status(201).json({ daily_check: dailyCheck });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function uploadPhoto(req, res) {
  const { dailyCheckId } = req.params;
  const { part_type, note } = req.body;

  if (!part_type || !VALID_PART_TYPES.includes(part_type)) {
    return res.status(400).json({ error: 'part_type tidak valid' });
  }

  try {
    const dailyCheck = await dailyCheckModel.findByIdAndUser(dailyCheckId, req.user.id);
    if (!dailyCheck) {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    const timestamp = Date.now();
    const dummyKey = `dummy/${req.user.id}/${part_type}_${timestamp}.webp`;
    const dummyThumbKey = `dummy/${req.user.id}/thumb_${part_type}_${timestamp}.webp`;

    const photo = await checkPhotoModel.create({
      dailyId: dailyCheckId,
      partType: part_type,
      r2Key: dummyKey,
      thumbnailKey: dummyThumbKey,
      note,
    });

    res.status(201).json({ photo });
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

    const uploadedParts = await checkPhotoModel.findPartTypesByDailyId(dailyCheckId);
    const banCount = uploadedParts.filter((p) => p === 'ban').length;

    const missing = [];
    for (const part of REQUIRED_SINGLE) {
      if (!uploadedParts.includes(part)) missing.push(part);
    }
    for (const part of REQUIRED_MULTI) {
      if (!uploadedParts.includes(part)) missing.push(part);
    }
    if (banCount < 4) {
      missing.push(`ban (baru ${banCount}/4 foto)`);
    }

    if (missing.length > 0) {
      return res.status(400).json({ error: 'Laporan belum lengkap', missing_parts: missing });
    }

    const dailyCheckUpdated = await dailyCheckModel.markSubmitted(dailyCheckId);

    res.json({ message: 'Laporan berhasil disubmit', daily_check: dailyCheckUpdated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = { startDailyCheck, uploadPhoto, submitDailyCheck };