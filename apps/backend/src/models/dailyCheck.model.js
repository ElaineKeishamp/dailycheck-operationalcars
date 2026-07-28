const pool = require('../config/db');

async function findByVehicleAndDate(vehicleId) {
  const result = await pool.query(
    'SELECT * FROM daily_checks WHERE vehicle_id = $1 AND check_date = CURRENT_DATE',
    [vehicleId]
  );
  return result.rows[0];
}

async function findByIdAndUser(dailyId, userId) {
  const result = await pool.query(
    'SELECT * FROM daily_checks WHERE daily_id = $1 AND users_id = $2',
    [dailyId, userId]
  );
  return result.rows[0];
}

async function findById(dailyId) {
  const result = await pool.query(
    `SELECT dc.*, u.name AS driver_name, u.email AS driver_email,
            v.plate_number, v.brand, v.model
     FROM daily_checks dc
     JOIN users u ON dc.users_id = u.users_id
     JOIN vehicles v ON dc.vehicle_id = v.vehicle_id
     WHERE dc.daily_id = $1`,
    [dailyId]
  );
  return result.rows[0];
}

async function findAllChecked(date = null) {
  const query = date
    ? `SELECT DISTINCT users_id FROM daily_checks WHERE check_date = $1 AND deleted_at IS NULL`
    : `SELECT DISTINCT users_id FROM daily_checks WHERE check_date = CURRENT_DATE AND deleted_at IS NULL`;
  const params = date ? [date] : [];
  const result = await pool.query(query, params);
  return result.rows;
}

async function findAllWithFilters({ date, driverId, vehicleId }) {
  let query = `
    SELECT dc.*, u.name AS driver_name, u.email AS driver_email,
           v.plate_number, v.brand, v.model
    FROM daily_checks dc
    JOIN users u ON dc.users_id = u.users_id
    JOIN vehicles v ON dc.vehicle_id = v.vehicle_id
    WHERE dc.deleted_at IS NULL
  `;
  const params = [];

  if (date) {
    params.push(date);
    query += ` AND dc.check_date = $${params.length}`;
  }
  if (driverId) {
    params.push(driverId);
    query += ` AND dc.users_id = $${params.length}`;
  }
  if (vehicleId) {
    params.push(vehicleId);
    query += ` AND dc.vehicle_id = $${params.length}`;
  }

  query += ` ORDER BY dc.check_date DESC, u.name ASC`;

  const result = await pool.query(query, params);
  return result.rows;
}

async function create({ userId, vehicleId, actualDriverName, gpsLat, gpsLong, gpsAddress }) {
  const result = await pool.query(
    `INSERT INTO daily_checks (users_id, vehicle_id, actual_driver_name, gps_lat, gps_long, gps_address)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, vehicleId, actualDriverName || null, gpsLat || null, gpsLong || null, gpsAddress || null]
  );
  return result.rows[0];
}

async function markSubmitted(dailyId) {
  const result = await pool.query(
    `UPDATE daily_checks SET status = 'submitted' WHERE daily_id = $1 RETURNING *`,
    [dailyId]
  );
  return result.rows[0];
}

module.exports = {
  findByVehicleAndDate,
  findByIdAndUser,
  findById,
  findAllChecked,
  findAllWithFilters,
  create,
  markSubmitted,
};