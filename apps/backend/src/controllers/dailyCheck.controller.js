const userModel = require('../models/user.model');
const vehicleModel = require('../models/vehicle.model');
const dailyCheckModel = require('../models/dailyCheck.model');
const storageService = require('../services/storage.service');
const jwt = require('jsonwebtoken');

const VALID_PART_TYPES = ['odo', 'body_kiri', 'body_kanan', 'kap', 'depan', 'belakang', 'interior', 'ban', 'lainnya'];
const VALID_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_TICKET_PURPOSE = 'photo-upload';
const UPLOAD_TICKET_EXPIRES_IN_SECONDS = 10 * 60;
const REQUIRED_PHOTO_SLOTS = [
  { part_type: 'odo', part_index: null, checklist_id: 'odo' },
  { part_type: 'body_kiri', part_index: null, checklist_id: 'body_kiri' },
  { part_type: 'body_kanan', part_index: null, checklist_id: 'body_kanan' },
  { part_type: 'kap', part_index: null, checklist_id: 'kap' },
  { part_type: 'depan', part_index: null, checklist_id: 'depan' },
  { part_type: 'belakang', part_index: null, checklist_id: 'belakang' },
  { part_type: 'interior', part_index: null, checklist_id: 'interior' },
  { part_type: 'ban', part_index: 1, checklist_id: 'ban_1' },
  { part_type: 'ban', part_index: 2, checklist_id: 'ban_2' },
  { part_type: 'ban', part_index: 3, checklist_id: 'ban_3' },
  { part_type: 'ban', part_index: 4, checklist_id: 'ban_4' },
];

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

function slugify(text) {
  if (!text) return '';
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function getPhotoKeyPrefix(dailyCheck, reqUser) {
  const dateObj = dailyCheck?.created_at ? new Date(dailyCheck.created_at) : new Date();
  const YYYY = dateObj.getFullYear();
  const MM = String(dateObj.getMonth() + 1).padStart(2, '0');
  const DD = String(dateObj.getDate()).padStart(2, '0');

  const rawDriverName = dailyCheck?.actual_driver_name || dailyCheck?.driver_name || reqUser?.name || 'driver';
  const driverFolder = slugify(rawDriverName) || 'driver';
  const plateFolder = slugify(dailyCheck?.plate_number) || 'mobil';
  const dailyId = dailyCheck?.daily_id || 'session';

  return `inspections/${YYYY}/${MM}/${DD}/${driverFolder}/${plateFolder}_${dailyId}/`;
}

function isSafePhotoKey({ key, partType, partIndex }) {
  if (!key || typeof key !== 'string') return false;
  const slot = getLogicalSlot(partType, partIndex);
  const keyPattern = new RegExp(`^inspections/.*${slot}_[^/]+\\.(jpe?g|png|webp)$`, 'i');
  return keyPattern.test(key);
}

function getExtensionForContentType(contentType) {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  return 'jpg';
}

function createUploadTicket({ userId, dailyCheckId, partType, partIndex, key, contentType }) {
  return jwt.sign(
    {
      purpose: UPLOAD_TICKET_PURPOSE,
      users_id: userId,
      daily_id: dailyCheckId,
      part_type: partType,
      part_index: partIndex,
      key,
      content_type: contentType,
    },
    process.env.JWT_SECRET,
    { expiresIn: UPLOAD_TICKET_EXPIRES_IN_SECONDS }
  );
}

function verifyUploadTicket(uploadTicket) {
  if (!uploadTicket || typeof uploadTicket !== 'string') {
    const error = new Error('upload_ticket wajib diisi');
    error.code = 'UPLOAD_TICKET_REQUIRED';
    throw error;
  }

  try {
    const payload = jwt.verify(uploadTicket, process.env.JWT_SECRET);
    if (payload?.purpose !== UPLOAD_TICKET_PURPOSE) {
      const error = new Error('upload_ticket tidak valid');
      error.code = 'UPLOAD_TICKET_INVALID';
      throw error;
    }
    return payload;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      error.code = 'UPLOAD_TICKET_EXPIRED';
    } else if (!error.code) {
      error.code = 'UPLOAD_TICKET_INVALID';
    }
    throw error;
  }
}

function getUploadTicketErrorResponse(error) {
  if (error.code === 'UPLOAD_TICKET_REQUIRED') {
    return { status: 400, body: { error: 'upload_ticket wajib diisi' } };
  }
  if (error.code === 'UPLOAD_TICKET_EXPIRED') {
    return { status: 400, body: { error: 'Tiket upload sudah kedaluwarsa. Ambil ulang foto.' } };
  }
  if (error.code === 'UPLOAD_TICKET_INVALID') {
    return { status: 400, body: { error: 'Tiket upload tidak valid.' } };
  }
  return null;
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

function getPhotoSlotKey(partType, partIndex) {
  return partType === 'ban' ? `${partType}:${partIndex}` : `${partType}:`;
}

function getMissingRequiredPhotoSlots(photos) {
  const uploadedSlots = new Set(
    photos
      .filter((photo) => photo.part_type !== 'lainnya')
      .map((photo) => getPhotoSlotKey(photo.part_type, photo.part_index))
  );

  return REQUIRED_PHOTO_SLOTS.filter((slot) => (
    !uploadedSlots.has(getPhotoSlotKey(slot.part_type, slot.part_index))
  ));
}

async function startDailyCheck(req, res) {
  const { vehicle_id, actual_driver_name, gps_lat, gps_long, gps_address } = req.body;
  const userId = req.user.id;

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id wajib diisi' });
  }

  try {
    const user = await userModel.findById(userId);
    const driverName = typeof actual_driver_name === 'string' ? actual_driver_name.trim() : '';

    if (user?.is_shared_account && !driverName) {
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
      actual_driver_name: user?.is_shared_account ? driverName : null,
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
    const key = `${getPhotoKeyPrefix(dailyCheck, req.user)}${getLogicalSlot(part_type, slotValidation.partIndex)}_${uniqueValue}.${extension}`;

    const { uploadUrl, expiresIn } = await storageService.generateUploadPresignedUrl(key, mimeType, 300);
    const uploadTicket = createUploadTicket({
      userId: req.user.id,
      dailyCheckId,
      partType: part_type,
      partIndex: slotValidation.partIndex,
      key,
      contentType: mimeType,
    });
    const ticketPayload = jwt.decode(uploadTicket);

    res.json({
      upload_url: uploadUrl,
      key,
      object_key: key,
      upload_ticket: uploadTicket,
      part_type,
      part_index: slotValidation.partIndex,
      expires_in: expiresIn,
      expires_at: ticketPayload?.exp ? new Date(ticketPayload.exp * 1000).toISOString() : null,
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
  const { upload_ticket, note } = req.body;

  let ticket;
  try {
    ticket = verifyUploadTicket(upload_ticket);
  } catch (error) {
    const response = getUploadTicketErrorResponse(error);
    if (response) return res.status(response.status).json(response.body);
    throw error;
  }

  if (ticket.users_id !== req.user.id || ticket.daily_id !== dailyCheckId) {
    return res.status(400).json({ error: 'Tiket upload tidak sesuai dengan sesi checking.' });
  }

  const part_type = ticket.part_type;
  const part_index = ticket.part_index ?? null;
  const key = ticket.key;
  const contentType = ticket.content_type || 'image/jpeg';

  const slotValidation = validatePhotoSlot(part_type, part_index);
  if (slotValidation.error) {
    return res.status(400).json({ error: slotValidation.error });
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
    const result = await dailyCheckModel.confirmPhotoWithDailyCheckLock({
      daily_id: dailyCheckId,
      users_id: req.user.id,
      part_type,
      part_index: slotValidation.partIndex,
      r2_key: key,
      note,
      verifyStorageObject: async () => {
        const metadata = await storageService.getObjectMetadata(key);
        if (!metadata.exists) {
          const error = new Error('File foto belum ditemukan di storage');
          error.code = 'PHOTO_OBJECT_NOT_FOUND';
          throw error;
        }
        if (metadata.contentType && metadata.contentType !== contentType) {
          const error = new Error('content_type object tidak sesuai');
          error.code = 'PHOTO_OBJECT_METADATA_INVALID';
          throw error;
        }
        if (metadata.contentLength !== null && metadata.contentLength <= 0) {
          const error = new Error('File foto kosong');
          error.code = 'PHOTO_OBJECT_METADATA_INVALID';
          throw error;
        }
      },
    });

    if (result.status === 'daily_check_not_found') {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    if (result.status === 'daily_check_submitted') {
      return res.status(409).json({ error: 'Daily check sudah disubmit' });
    }

    if (result.status === 'slot_conflict') {
      return res.status(409).json({ error: 'Foto bagian ini sudah dikonfirmasi dengan object lain' });
    }

    const viewUrl = await storageService.generateViewPresignedUrl(result.photo.r2_key);

    res.status(result.status === 'already_confirmed' ? 200 : 201).json({
      photo: {
        ...result.photo,
        url: viewUrl,
      },
      already_confirmed: result.status === 'already_confirmed',
    });
  } catch (err) {
    if (err.code === 'PHOTO_OBJECT_NOT_FOUND') {
      return res.status(404).json({ error: 'File foto belum ditemukan di storage' });
    }
    if (err.code === 'PHOTO_OBJECT_METADATA_INVALID') {
      return res.status(400).json({ error: 'Data object foto tidak valid' });
    }
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function cancelPhotoUpload(req, res) {
  const { dailyCheckId } = req.params;
  const { upload_ticket } = req.body;

  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Hanya driver yang dapat membatalkan upload foto' });
  }

  let ticket;
  try {
    ticket = verifyUploadTicket(upload_ticket);
  } catch (error) {
    const response = getUploadTicketErrorResponse(error);
    if (response) return res.status(response.status).json(response.body);
    throw error;
  }

  if (ticket.users_id !== req.user.id || ticket.daily_id !== dailyCheckId) {
    return res.status(400).json({ error: 'Tiket upload tidak sesuai dengan sesi checking.' });
  }

  const slotValidation = validatePhotoSlot(ticket.part_type, ticket.part_index ?? null);
  if (slotValidation.error) {
    return res.status(400).json({ error: slotValidation.error });
  }

  if (!isSafePhotoKey({
    key: ticket.key,
    dailyCheckId,
    partType: ticket.part_type,
    partIndex: slotValidation.partIndex,
  })) {
    return res.status(400).json({ error: 'key foto tidak valid' });
  }

  try {
    const result = await dailyCheckModel.cancelUnconfirmedUploadWithDailyCheckLock({
      daily_id: dailyCheckId,
      users_id: req.user.id,
      r2_key: ticket.key,
      deleteStorageObject: async () => {
        await storageService.deleteObject(ticket.key);
      },
    });

    if (result.status === 'daily_check_not_found') {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    if (result.status === 'already_confirmed') {
      return res.status(409).json({ error: 'Foto sudah tercatat di laporan dan tidak dapat dibatalkan sebagai upload tertunda.' });
    }

    res.json({
      message: 'Upload tertunda berhasil dibatalkan.',
      data: {
        daily_id: dailyCheckId,
        part_type: ticket.part_type,
        part_index: slotValidation.partIndex,
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

async function deleteDailyCheckPhoto(req, res) {
  const { dailyCheckId, photoId } = req.params;

  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Hanya driver yang dapat menghapus foto checking' });
  }

  try {
    const result = await dailyCheckModel.deletePhotoWithDailyCheckLock({
      daily_id: dailyCheckId,
      users_id: req.user.id,
      check_photos_id: photoId,
      deleteStorageObject: async (photo) => {
        const safePhotoKey = isSafePhotoKey({
          key: photo.r2_key,
          dailyCheckId,
          partType: photo.part_type,
          partIndex: photo.part_index,
        });
        if (!safePhotoKey) {
          const error = new Error('Data foto tidak valid');
          error.code = 'UNSAFE_PHOTO_KEY';
          throw error;
        }

        await storageService.deleteObject(photo.r2_key);
      },
    });

    if (result.status === 'daily_check_not_found') {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    if (result.status === 'daily_check_submitted') {
      return res.status(409).json({ error: 'Laporan checking sudah disubmit. Foto tidak dapat dihapus.' });
    }

    if (result.status === 'photo_not_found') {
      return res.status(404).json({ error: 'Foto tidak ditemukan' });
    }

    const deletedPhoto = result.photo;

    res.json({
      message: 'Foto berhasil dihapus. Silakan ambil ulang foto.',
      data: {
        check_photos_id: deletedPhoto.check_photos_id,
        daily_id: deletedPhoto.daily_id,
        part_type: deletedPhoto.part_type,
        part_index: deletedPhoto.part_index,
      },
    });
  } catch (err) {
    console.error(err);
    if (err.code === 'UNSAFE_PHOTO_KEY') {
      return res.status(500).json({ error: 'Data foto tidak valid' });
    }
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function submitDailyCheck(req, res) {
  const { dailyCheckId } = req.params;

  try {
    const result = await dailyCheckModel.submitDailyCheckWithLock({
      daily_id: dailyCheckId,
      users_id: req.user.id,
      getMissingRequiredPhotoSlots,
    });

    if (result.status === 'daily_check_not_found') {
      return res.status(404).json({ error: 'Daily check tidak ditemukan' });
    }

    if (result.status === 'daily_check_submitted') {
      return res.status(409).json({
        error: 'Laporan checking ini sudah pernah dikirim',
        daily_check: result.dailyCheck,
      });
    }

    if (result.status === 'missing_required_photos') {
      return res.status(400).json({
        error: 'Foto wajib belum lengkap',
        missing_parts: result.missing,
      });
    }

    res.json({ message: 'Laporan berhasil disubmit', daily_check: result.dailyCheck });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getMyTodayCheck(req, res) {
  try {
    const todayCheck = await dailyCheckModel.findTodayCheckByDriver(req.user.id);
    res.json({ daily_check: todayCheck });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getMyHistory(req, res) {
  try {
    const history = await dailyCheckModel.getDriverHistoryLast7Days(req.user.id);
    res.json({ reports: history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = {
  startDailyCheck,
  getActiveDailyCheck,
  getMyTodayCheck,
  getMyHistory,
  getPhotoUploadUrl,
  uploadPhoto,
  cancelPhotoUpload,
  getDailyCheckPhotos,
  deleteDailyCheckPhoto,
  submitDailyCheck,
};
