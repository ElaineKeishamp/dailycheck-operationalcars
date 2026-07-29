const pool = require('../config/db');

async function findByVehicleAndDate(vehicleId, date = 'CURRENT_DATE') {
  const query = date === 'CURRENT_DATE'
    ? 'SELECT * FROM daily_checks WHERE vehicle_id = $1 AND check_date = CURRENT_DATE'
    : 'SELECT * FROM daily_checks WHERE vehicle_id = $1 AND check_date = $2';
  const params = date === 'CURRENT_DATE' ? [vehicleId] : [vehicleId, date];
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

async function findActiveByVehicleAndUser(vehicleId, userId) {
  const result = await pool.query(
    `SELECT dc.*, v.plate_number, v.brand, v.model
     FROM daily_checks dc
     JOIN vehicles v ON dc.vehicle_id = v.vehicle_id
     WHERE dc.vehicle_id = $1
       AND dc.users_id = $2
       AND dc.check_date = CURRENT_DATE
       AND dc.status = 'incomplete'
       AND dc.deleted_at IS NULL
     ORDER BY dc.created_at DESC
     LIMIT 1`,
    [vehicleId, userId]
  );
  return result.rows[0] || null;
}

async function findByIdAndUser(dailyId, userId) {
  const result = await pool.query(
    'SELECT * FROM daily_checks WHERE daily_id = $1 AND users_id = $2',
    [dailyId, userId]
  );
  return result.rows[0] || null;
}

async function findById(dailyId) {
  const result = await pool.query(
    `SELECT dc.*, u.name as driver_name, u.email as driver_email,
            v.plate_number, v.brand, v.model
     FROM daily_checks dc
     JOIN users u ON dc.users_id = u.users_id
     JOIN vehicles v ON dc.vehicle_id = v.vehicle_id
     WHERE dc.daily_id = $1`,
    [dailyId]
  );
  return result.rows[0] || null;
}

async function createDailyCheck({ users_id, vehicle_id, actual_driver_name, gps_lat, gps_long, gps_address }) {
  const result = await pool.query(
    `INSERT INTO daily_checks (users_id, vehicle_id, actual_driver_name, gps_lat, gps_long, gps_address)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [users_id, vehicle_id, actual_driver_name || null, gps_lat || null, gps_long || null, gps_address || null]
  );
  return result.rows[0];
}

async function updateStatus(dailyId, status) {
  const result = await pool.query(
    `UPDATE daily_checks SET status = $1 WHERE daily_id = $2 RETURNING *`,
    [status, dailyId]
  );
  return result.rows[0] || null;
}

async function getCheckedTodayUserIds() {
  const result = await pool.query(
    `SELECT DISTINCT users_id FROM daily_checks 
     WHERE check_date = CURRENT_DATE AND deleted_at IS NULL`
  );
  return result.rows.map(r => r.users_id);
}

async function getCheckedTodayVehicleIds() {
  const result = await pool.query(
    `SELECT DISTINCT vehicle_id FROM daily_checks 
     WHERE check_date = CURRENT_DATE AND deleted_at IS NULL`
  );
  return result.rows.map(r => r.vehicle_id);
}

async function getAllReports({ date, status }) {
  let query = `
    SELECT dc.daily_id, dc.check_date, dc.status, dc.created_at,
           u.name as driver_name, u.email as driver_email,
           v.plate_number, v.brand, v.model,
           (SELECT COUNT(*) FROM check_photos cp WHERE cp.daily_id = dc.daily_id) as photo_count
    FROM daily_checks dc
    JOIN users u ON dc.users_id = u.users_id
    JOIN vehicles v ON dc.vehicle_id = v.vehicle_id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    params.push(date);
    query += ` AND dc.check_date = $${params.length}`;
  }

  if (status) {
    params.push(status);
    query += ` AND dc.status = $${params.length}`;
  }

  query += ` ORDER BY dc.created_at DESC`;

  const result = await pool.query(query, params);
  return result.rows;
}

async function getPhotosByDailyId(dailyId) {
  const result = await pool.query(
    'SELECT * FROM check_photos WHERE daily_id = $1 ORDER BY created_at ASC',
    [dailyId]
  );
  return result.rows;
}

async function findPhotoByLogicalSlot({ daily_id, part_type, part_index }) {
  const params = [daily_id, part_type];
  let query = 'SELECT * FROM check_photos WHERE daily_id = $1 AND part_type = $2';

  if (part_type === 'ban') {
    params.push(part_index);
    query += ' AND part_index = $3';
  } else {
    query += ' AND part_index IS NULL';
  }

  query += ' LIMIT 1';

  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

async function addPhoto({ daily_id, part_type, part_index, r2_key, thumbnail_key, note }) {
  const result = await pool.query(
    `INSERT INTO check_photos (daily_id, part_type, part_index, r2_key, thumbnail_key, note)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [daily_id, part_type, part_index ?? null, r2_key, thumbnail_key, note || null]
  );
  return result.rows[0];
}

module.exports = {
  findByVehicleAndDate,
  findActiveByVehicleAndUser,
  findByIdAndUser,
  findById,
  createDailyCheck,
  updateStatus,
  getCheckedTodayUserIds,
  getCheckedTodayVehicleIds,
  getAllReports,
  getPhotosByDailyId,
  findPhotoByLogicalSlot,
  addPhoto,
};
