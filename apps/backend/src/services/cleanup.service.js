const pool = require('../config/db');
const storageService = require('./storage.service');

/**
 * Clean up photos and reports older than retentionDays (default 30 days)
 * 1. Find all check_photos where created_at < NOW() - 30 days
 * 2. Delete each photo from MinIO storage
 * 3. Delete check_photos records from PostgreSQL
 * 4. Delete old daily_checks records older than 30 days
 */
async function run30DayCleanup(retentionDays = 30) {
  console.log(`[CLEANUP] Running ${retentionDays}-day automated photo & report cleanup...`);
  let deletedPhotosCount = 0;
  let deletedMinioCount = 0;
  let deletedReportsCount = 0;

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

    // 2. Delete each photo from MinIO
    for (const photo of oldPhotos) {
      if (photo.r2_key) {
        try {
          await storageService.deleteObject(photo.r2_key);
          deletedMinioCount++;
        } catch (minioErr) {
          console.warn(`[CLEANUP] Could not delete MinIO key ${photo.r2_key}:`, minioErr.message);
        }
      }
      if (photo.thumbnail_key) {
        try {
          await storageService.deleteObject(photo.thumbnail_key);
        } catch (minioErr) {
          // ignore thumbnail errors
        }
      }
    }

    // 3. Delete old check_photos records from PostgreSQL
    if (oldPhotos.length > 0) {
      const photoIds = oldPhotos.map((p) => p.check_photos_id);
      const delPhotosRes = await pool.query(
        `DELETE FROM check_photos WHERE check_photos_id = ANY($1::uuid[])`,
        [photoIds]
      );
      deletedPhotosCount = delPhotosRes.rowCount || oldPhotos.length;
    }

    // 4. Delete old daily_checks records older than 30 days
    const delReportsRes = await pool.query(
      `DELETE FROM daily_checks WHERE check_date < CURRENT_DATE - ($1 || ' days')::INTERVAL`,
      [retentionDays]
    );
    deletedReportsCount = delReportsRes.rowCount || 0;

    console.log(
      `[CLEANUP SUCCESS] Cleaned up ${deletedMinioCount} MinIO objects, ${deletedPhotosCount} DB photo records, and ${deletedReportsCount} old daily checks (> ${retentionDays} days).`
    );

    return {
      deletedMinioCount,
      deletedPhotosCount,
      deletedReportsCount,
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
