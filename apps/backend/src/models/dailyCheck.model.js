const pool = require('../config/db');

async function findByVehicleAndDate(vehicleId, date = 'CURRENT_DATE') {
  const query = date === 'CURRENT_DATE'
    ? 'SELECT * FROM daily_checks WHERE vehicle_id = $1 AND check_date = CURRENT_DATE'
    : 'SELECT * FROM daily_checks WHERE vehicle_id = $1 AND check_date = $2';
  const params = date === 'CURRENT_DATE' ? [vehicleId] : [vehicleId, date];
  const result = await pool.query(query, params);
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

async function findTodayCheckByDriver(userId) {
  const result = await pool.query(
    `SELECT dc.*, v.plate_number, v.brand, v.model
     FROM daily_checks dc
     JOIN vehicles v ON dc.vehicle_id = v.vehicle_id
     WHERE dc.users_id = $1 AND dc.check_date = CURRENT_DATE AND dc.deleted_at IS NULL`,
    [userId]
  );
  return result.rows[0] || null;
}

async function getDriverHistoryLast7Days(userId) {
  const result = await pool.query(
    `SELECT dc.daily_id, dc.check_date, dc.status, dc.created_at,
            v.plate_number, v.brand, v.model,
            (SELECT COUNT(*) FROM check_photos cp WHERE cp.daily_id = dc.daily_id) as photo_count
     FROM daily_checks dc
     JOIN vehicles v ON dc.vehicle_id = v.vehicle_id
     WHERE dc.users_id = $1
       AND dc.check_date >= CURRENT_DATE - INTERVAL '7 days'
       AND dc.deleted_at IS NULL
     ORDER BY dc.created_at DESC`,
    [userId]
  );
  return result.rows;
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
    SELECT dc.daily_id, dc.users_id, dc.vehicle_id, dc.check_date, dc.status, dc.created_at,
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
  const query = part_index === null || part_index === undefined
    ? 'SELECT * FROM check_photos WHERE daily_id = $1 AND part_type = $2 AND part_index IS NULL'
    : 'SELECT * FROM check_photos WHERE daily_id = $1 AND part_type = $2 AND part_index = $3';
  const params = part_index === null || part_index === undefined
    ? [daily_id, part_type]
    : [daily_id, part_type, part_index];
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

async function findPhotoByIdAndDailyId({ check_photos_id, daily_id }) {
  const result = await pool.query(
    'SELECT * FROM check_photos WHERE check_photos_id = $1 AND daily_id = $2',
    [check_photos_id, daily_id]
  );
  return result.rows[0] || null;
}

async function findPhotoByObjectKey({ daily_id, r2_key }) {
  const result = await pool.query(
    'SELECT * FROM check_photos WHERE daily_id = $1 AND r2_key = $2',
    [daily_id, r2_key]
  );
  return result.rows[0] || null;
}

async function addPhoto({ daily_id, part_type, part_index, r2_key, thumbnail_key, note }) {
  const result = await pool.query(
    `INSERT INTO check_photos (daily_id, part_type, part_index, r2_key, thumbnail_key, note)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [daily_id, part_type, part_index || null, r2_key, thumbnail_key, note || null]
  );
  return result.rows[0];
}

async function confirmPhotoWithDailyCheckLock({
  daily_id,
  users_id,
  part_type,
  part_index,
  r2_key,
  note,
  verifyStorageObject,
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const dailyResult = await client.query(
      'SELECT * FROM daily_checks WHERE daily_id = $1 AND users_id = $2 FOR UPDATE',
      [daily_id, users_id]
    );
    const dailyCheck = dailyResult.rows[0] || null;

    if (!dailyCheck) {
      await client.query('ROLLBACK');
      return { status: 'daily_check_not_found' };
    }

    if (dailyCheck.status !== 'incomplete') {
      await client.query('ROLLBACK');
      return { status: 'daily_check_submitted', dailyCheck };
    }

    const objectPhotoResult = await client.query(
      'SELECT * FROM check_photos WHERE daily_id = $1 AND r2_key = $2',
      [daily_id, r2_key]
    );
    const objectPhoto = objectPhotoResult.rows[0] || null;
    if (objectPhoto) {
      await client.query('COMMIT');
      return { status: 'already_confirmed', photo: objectPhoto };
    }

    const slotQuery = part_index === null || part_index === undefined
      ? 'SELECT * FROM check_photos WHERE daily_id = $1 AND part_type = $2 AND part_index IS NULL'
      : 'SELECT * FROM check_photos WHERE daily_id = $1 AND part_type = $2 AND part_index = $3';
    const slotParams = part_index === null || part_index === undefined
      ? [daily_id, part_type]
      : [daily_id, part_type, part_index];
    const slotResult = await client.query(slotQuery, slotParams);
    const slotPhoto = slotResult.rows[0] || null;

    if (slotPhoto) {
      await client.query('ROLLBACK');
      return { status: 'slot_conflict', photo: slotPhoto };
    }

    await verifyStorageObject();

    const thumbnailKey = `thumb_${r2_key}`;
    const insertResult = await client.query(
      `INSERT INTO check_photos (daily_id, part_type, part_index, r2_key, thumbnail_key, note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [daily_id, part_type, part_index || null, r2_key, thumbnailKey, note || null]
    );

    await client.query('COMMIT');
    return { status: 'confirmed', photo: insertResult.rows[0] };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function cancelUnconfirmedUploadWithDailyCheckLock({
  daily_id,
  users_id,
  r2_key,
  deleteStorageObject,
}) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const dailyResult = await client.query(
      'SELECT * FROM daily_checks WHERE daily_id = $1 AND users_id = $2 FOR UPDATE',
      [daily_id, users_id]
    );
    const dailyCheck = dailyResult.rows[0] || null;

    if (!dailyCheck) {
      await client.query('ROLLBACK');
      return { status: 'daily_check_not_found' };
    }

    const photoResult = await client.query(
      'SELECT * FROM check_photos WHERE daily_id = $1 AND r2_key = $2',
      [daily_id, r2_key]
    );

    if (photoResult.rows[0]) {
      await client.query('ROLLBACK');
      return { status: 'already_confirmed', photo: photoResult.rows[0] };
    }

    await deleteStorageObject();
    await client.query('COMMIT');
    return { status: 'canceled' };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function getConfirmedPhotoKeys() {
  const result = await pool.query(
    'SELECT r2_key FROM check_photos WHERE r2_key IS NOT NULL'
  );
  return result.rows.map((row) => row.r2_key);
}

async function deletePhotoByIdAndDailyId({ check_photos_id, daily_id }) {
  const result = await pool.query(
    'DELETE FROM check_photos WHERE check_photos_id = $1 AND daily_id = $2 RETURNING *',
    [check_photos_id, daily_id]
  );
  return result.rows[0] || null;
}

async function deletePhotoWithDailyCheckLock({ daily_id, users_id, check_photos_id, deleteStorageObject }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const dailyResult = await client.query(
      'SELECT * FROM daily_checks WHERE daily_id = $1 AND users_id = $2 FOR UPDATE',
      [daily_id, users_id]
    );
    const dailyCheck = dailyResult.rows[0] || null;

    if (!dailyCheck) {
      await client.query('ROLLBACK');
      return { status: 'daily_check_not_found' };
    }

    if (dailyCheck.status !== 'incomplete') {
      await client.query('ROLLBACK');
      return { status: 'daily_check_submitted', dailyCheck };
    }

    const photoResult = await client.query(
      'SELECT * FROM check_photos WHERE check_photos_id = $1 AND daily_id = $2',
      [check_photos_id, daily_id]
    );
    const photo = photoResult.rows[0] || null;

    if (!photo) {
      await client.query('ROLLBACK');
      return { status: 'photo_not_found' };
    }

    await deleteStorageObject(photo);

    const deleteResult = await client.query(
      'DELETE FROM check_photos WHERE check_photos_id = $1 AND daily_id = $2 RETURNING *',
      [check_photos_id, daily_id]
    );
    const deletedPhoto = deleteResult.rows[0] || null;

    if (!deletedPhoto) {
      await client.query('ROLLBACK');
      return { status: 'photo_not_found' };
    }

    await client.query('COMMIT');
    return { status: 'deleted', photo: deletedPhoto };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function submitDailyCheckWithLock({ daily_id, users_id, getMissingRequiredPhotoSlots }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const dailyResult = await client.query(
      'SELECT * FROM daily_checks WHERE daily_id = $1 AND users_id = $2 FOR UPDATE',
      [daily_id, users_id]
    );
    const dailyCheck = dailyResult.rows[0] || null;

    if (!dailyCheck) {
      await client.query('ROLLBACK');
      return { status: 'daily_check_not_found' };
    }

    if (dailyCheck.status !== 'incomplete') {
      await client.query('ROLLBACK');
      return { status: 'daily_check_submitted', dailyCheck };
    }

    const photosResult = await client.query(
      'SELECT * FROM check_photos WHERE daily_id = $1 ORDER BY created_at ASC',
      [daily_id]
    );
    const missing = getMissingRequiredPhotoSlots(photosResult.rows);

    if (missing.length > 0) {
      await client.query('ROLLBACK');
      return { status: 'missing_required_photos', missing };
    }

    const updateResult = await client.query(
      'UPDATE daily_checks SET status = $1 WHERE daily_id = $2 RETURNING *',
      ['submitted', daily_id]
    );
    const updated = updateResult.rows[0] || null;

    await client.query('COMMIT');
    return { status: 'submitted', dailyCheck: updated };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  findByVehicleAndDate,
  findByIdAndUser,
  findById,
  findTodayCheckByDriver,
  getDriverHistoryLast7Days,
  createDailyCheck,
  updateStatus,
  getCheckedTodayUserIds,
  getCheckedTodayVehicleIds,
  getAllReports,
  getPhotosByDailyId,
  findPhotoByLogicalSlot,
  findPhotoByIdAndDailyId,
  findPhotoByObjectKey,
  addPhoto,
  confirmPhotoWithDailyCheckLock,
  cancelUnconfirmedUploadWithDailyCheckLock,
  getConfirmedPhotoKeys,
  deletePhotoByIdAndDailyId,
  deletePhotoWithDailyCheckLock,
  submitDailyCheckWithLock,
};
