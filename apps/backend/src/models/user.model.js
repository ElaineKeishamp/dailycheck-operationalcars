const pool = require('../config/db');

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM users WHERE users_id = $1', [id]);
  return result.rows[0] || null;
}

async function getAllUsers() {
  const result = await pool.query(
    `SELECT users_id, name, email, role, is_shared_account, status, must_change_password, created_at 
     FROM users 
     ORDER BY role ASC, name ASC`
  );
  return result.rows;
}

async function getActiveDrivers() {
  const result = await pool.query(
    `SELECT users_id, name, email FROM users 
     WHERE role = 'driver' AND status = 'active'`
  );
  return result.rows;
}

async function createUser({ name, email, password_hash, role, is_shared_account }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_shared_account, must_change_password)
     VALUES ($1, $2, $3, $4, $5, TRUE) 
     RETURNING users_id, name, email, role, is_shared_account, status`,
    [name, email, password_hash, role, is_shared_account || false]
  );
  return result.rows[0];
}

async function updateUser(id, { role, status }) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (role !== undefined) {
    fields.push(`role = $${paramIndex++}`);
    values.push(role);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (fields.length === 0) return null;

  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE users_id = $${paramIndex} RETURNING users_id, name, email, role, status`,
    values
  );
  return result.rows[0] || null;
}

async function updatePassword(id, passwordHash, mustChangePassword = false) {
  const result = await pool.query(
    `UPDATE users 
     SET password_hash = $1, must_change_password = $2 
     WHERE users_id = $3 
     RETURNING users_id, name, email`,
    [passwordHash, mustChangePassword, id]
  );
  return result.rows[0] || null;
}

module.exports = {
  findByEmail,
  findById,
  getAllUsers,
  getActiveDrivers,
  createUser,
  updateUser,
  updatePassword,
};
