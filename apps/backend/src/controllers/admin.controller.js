const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/db');

async function resetPassword(req, res) {
  const { id } = req.params;

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE users_id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      `UPDATE users 
       SET password_hash = $1, must_change_password = TRUE 
       WHERE users_id = $2`,
      [hash, id]
    );

    res.json({
      message: 'Password berhasil direset',
      temporary_password: tempPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getAllReports(req, res) {
  const { date, driver_id, vehicle_id } = req.query;

  try {
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
    if (driver_id) {
      params.push(driver_id);
      query += ` AND dc.users_id = $${params.length}`;
    }
    if (vehicle_id) {
      params.push(vehicle_id);
      query += ` AND dc.vehicle_id = $${params.length}`;
    }

    query += ` ORDER BY dc.check_date DESC, u.name ASC`;

    const result = await pool.query(query, params);
    res.json({ reports: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getReportDetail(req, res) {
  const { id } = req.params;

  try {
    const dcResult = await pool.query(
      `SELECT dc.*, u.name AS driver_name, u.email AS driver_email,
              v.plate_number, v.brand, v.model
       FROM daily_checks dc
       JOIN users u ON dc.users_id = u.users_id
       JOIN vehicles v ON dc.vehicle_id = v.vehicle_id
       WHERE dc.daily_id = $1`,
      [id]
    );

    if (dcResult.rows.length === 0) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    const photosResult = await pool.query(
      'SELECT * FROM check_photos WHERE daily_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      report: dcResult.rows[0],
      photos: photosResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getTodayStatus(req, res) {
  try {
    const allDrivers = await pool.query(
      `SELECT users_id, name, email FROM users 
       WHERE role = 'driver' AND status = 'active'`
    );

    const checkedToday = await pool.query(
      `SELECT DISTINCT users_id FROM daily_checks 
       WHERE check_date = CURRENT_DATE AND deleted_at IS NULL`
    );

    const checkedIds = checkedToday.rows.map(r => r.users_id);

    const notCheckedYet = allDrivers.rows.filter(
      driver => !checkedIds.includes(driver.users_id)
    );

    res.json({
      total_driver: allDrivers.rows.length,
      sudah_checking: checkedIds.length,
      belum_checking: notCheckedYet,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}
module.exports = { resetPassword, getAllReports, getReportDetail, getTodayStatus };