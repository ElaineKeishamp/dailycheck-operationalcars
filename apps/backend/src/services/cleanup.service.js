const pool = require('../config/db');
const storageService = require('./storage.service');

// Catatan database dipertahankan jika penghapusan objek gagal agar dapat dicoba ulang.
async function run30DayCleanup(retentionDays = 30) {
  if (!Number.isSafeInteger(retentionDays) || retentionDays < 1) {
    throw new RangeError('retentionDays harus bilangan bulat positif');
  }
  console.log(`[CLEANUP] Running ${retentionDays}-day automated photo & report cleanup...`);
  let deletedPhotosCount = 0;
  let deletedMinioCount = 0;
  let deletedReportsCount = 0;
  const deletedPhotoIds = [];
  let failedPhotosCount = 0;

  try {
    // 1. Get photos older than retentionDays
    const photosResult = await pool.query(
      `SELECT cp.check_photos_id, cp.r2_key, cp.thumbnail_key
       FROM check_photos cp
       JOIN daily_checks dc ON cp.daily_id = dc.daily_id
       WHERE dc.check_date < CURRENT_DATE - ($1 || ' days')::INTERVAL
          OR cp.created_at < NOW() - ($1 || ' days')::INTERVAL`,
      [retentionDays]
    );

    const oldPhotos = photosResult.rows;

    for (const photo of oldPhotos) {
      let deleted = true;
      if (photo.r2_key) {
        try {
          await storageService.deleteObject(photo.r2_key);
          deletedMinioCount++;
        } catch (minioErr) {
          deleted = false;
          console.warn('[CLEANUP] Gagal menghapus foto:', minioErr.message);
        }
      }
      if (photo.thumbnail_key) {
        try {
          await storageService.deleteObject(photo.thumbnail_key);
        } catch (minioErr) {
          deleted = false;
          console.warn('[CLEANUP] Gagal menghapus thumbnail:', minioErr.message);
        }
      }
      if (deleted) deletedPhotoIds.push(photo.check_photos_id);
      else failedPhotosCount++;
    }

    if (deletedPhotoIds.length > 0) {
      const delPhotosRes = await pool.query(
        `DELETE FROM check_photos WHERE check_photos_id = ANY($1::uuid[])`,
        [deletedPhotoIds]
      );
      deletedPhotosCount = delPhotosRes.rowCount || 0;
    }

    const delReportsRes = await pool.query(
      `DELETE FROM daily_checks dc
       WHERE dc.check_date < CURRENT_DATE - ($1 || ' days')::INTERVAL
         AND NOT EXISTS (SELECT 1 FROM check_photos cp WHERE cp.daily_id = dc.daily_id)`,
      [retentionDays]
    );
    deletedReportsCount = delReportsRes.rowCount || 0;

    console.log(
      `[CLEANUP] Selesai: ${deletedMinioCount} objek foto, ${deletedPhotosCount} catatan foto, ${deletedReportsCount} laporan dihapus; ${failedPhotosCount} foto perlu dicoba ulang.`
    );

    return {
      deletedMinioCount,
      deletedPhotosCount,
      deletedReportsCount,
      failedPhotosCount,
    };
  } catch (err) {
    console.error('[CLEANUP ERROR] Failed to execute automated cleanup:', err.message);
    throw err;
  }
}

/**
 * Start periodic cleanup scheduler (runs once on startup after 10s, then every 24h)
 */
function initCleanupScheduler() {
  setTimeout(() => {
    run30DayCleanup().catch(() => {});
  }, 10000);

  setInterval(() => {
    run30DayCleanup().catch(() => {});
  }, 86400000);
}

module.exports = {
  run30DayCleanup,
  initCleanupScheduler,
};
