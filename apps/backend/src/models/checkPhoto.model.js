const pool = require('../config/db');

async function findByDailyId(dailyId) {
  const result = await pool.query(
    'SELECT * FROM check_photos WHERE daily_id = $1 ORDER BY created_at ASC',
    [dailyId]
  );
  return result.rows;
}

async function findPartTypesByDailyId(dailyId) {
  const result = await pool.query(
    'SELECT part_type FROM check_photos WHERE daily_id = $1',
    [dailyId]
  );
  return result.rows.map((r) => r.part_type);
}

async function create({ dailyId, partType, r2Key, thumbnailKey, note }) {
  const result = await pool.query(
    `INSERT INTO check_photos (daily_id, part_type, r2_key, thumbnail_key, note)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [dailyId, partType, r2Key, thumbnailKey, note || null]
  );
  return result.rows[0];
}

module.exports = { findByDailyId, findPartTypesByDailyId, create };