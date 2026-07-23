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

async function createUser(req, res) {
  const { name, email, role, is_shared_account } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: 'name, email, dan role wajib diisi' });
  }

  if (!['admin', 'driver'].includes(role)) {
    return res.status(400).json({ error: 'role harus admin atau driver' });
  }

  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, is_shared_account, must_change_password)
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING users_id, name, email, role, is_shared_account, status`,
      [name, email, hash, role, is_shared_account || false]
    );

    res.status(201).json({
      user: result.rows[0],
      temporary_password: tempPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getAllUsers(req, res) {
  try {
    const result = await pool.query(
      `SELECT users_id, name, email, role, is_shared_account, status, must_change_password, created_at 
       FROM users 
       ORDER BY role ASC, name ASC`
    );

    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}


async function updateUser(req, res) {
  const { id } = req.params;
  const { name, role, is_shared_account, status } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE users_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    if (role && !['admin', 'driver'].includes(role)) {
      return res.status(400).json({ error: 'role harus admin atau driver' });
    }
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status harus active atau inactive' });
    }

    const current = existing.rows[0];

    const result = await pool.query(
      `UPDATE users 
       SET name = $1, role = $2, is_shared_account = $3, status = $4
       WHERE users_id = $5 
       RETURNING users_id, name, email, role, is_shared_account, status`,
      [
        name || current.name,
        role || current.role,
        is_shared_account !== undefined ? is_shared_account : current.is_shared_account,
        status || current.status,
        id,
      ]
    );

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}


async function createVehicle(req, res) {
  const { plate_number, brand, model } = req.body;

  if (!plate_number || !brand || !model) {
    return res.status(400).json({ error: 'plate_number, brand, dan model wajib diisi' });
  }

  try {
    const existing = await pool.query('SELECT * FROM vehicles WHERE plate_number = $1', [plate_number]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Plat nomor sudah terdaftar' });
    }

    const result = await pool.query(
      `INSERT INTO vehicles (plate_number, brand, model)
       VALUES ($1, $2, $3) RETURNING *`,
      [plate_number, brand, model]
    );

    res.status(201).json({ vehicle: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}


async function getAllVehicles(req, res) {
  try {
    const result = await pool.query(
      `SELECT * FROM vehicles ORDER BY status ASC, plate_number ASC`
    );

    res.json({ vehicles: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}


async function updateVehicle(req, res) {
  const { id } = req.params;
  const { plate_number, brand, model, status } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM vehicles WHERE vehicle_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Mobil tidak ditemukan' });
    }

    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status harus active atau inactive' });
    }

    const current = existing.rows[0];

    const result = await pool.query(
      `UPDATE vehicles 
       SET plate_number = $1, brand = $2, model = $3, status = $4
       WHERE vehicle_id = $5 
       RETURNING *`,
      [
        plate_number || current.plate_number,
        brand || current.brand,
        model || current.model,
        status || current.status,
        id,
      ]
    );

    res.json({ vehicle: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}
module.exports = { resetPassword, getAllReports, getReportDetail, getTodayStatus, createUser, getAllUsers, updateUser, createVehicle, getAllVehicles, updateVehicle };