const pool = require('../config/db');

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM users WHERE users_id = $1', [id]);
  return result.rows[0] || null;
}

async function findSessionById(id) {
  const result = await pool.query(
    `SELECT users_id, name, email, role, status, is_shared_account,
            must_change_password, session_version
     FROM users WHERE users_id = $1`,
    [id]
  );
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

async function updateUser(id, { name, role, status, is_shared_account }) {
  const fields = [];
  const values = [];
  const sessionChanges = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}::varchar`);
    values.push(name);
  }
  if (is_shared_account !== undefined) {
    sessionChanges.push(`is_shared_account IS DISTINCT FROM $${paramIndex}::boolean`);
    fields.push(`is_shared_account = $${paramIndex++}::boolean`);
    values.push(is_shared_account);
  }

  if (role !== undefined) {
    sessionChanges.push(`role IS DISTINCT FROM $${paramIndex}::varchar`);
    fields.push(`role = $${paramIndex++}::varchar`);
    values.push(role);
  }
  if (status !== undefined) {
    sessionChanges.push(`status IS DISTINCT FROM $${paramIndex}::varchar`);
    fields.push(`status = $${paramIndex++}::varchar`);
    values.push(status);
  }

  if (fields.length === 0) return null;

  if (sessionChanges.length > 0) {
    fields.push(`session_version = session_version + CASE WHEN ${sessionChanges.join(' OR ')} THEN 1 ELSE 0 END`);
  }

  values.push(id);
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE users_id = $${paramIndex} RETURNING users_id, name, email, role, status, is_shared_account`,
    values
  );
  return result.rows[0] || null;
}

async function updatePassword(id, passwordHash, mustChangePassword = false, expectedSessionVersion = null) {
  const result = await pool.query(
    `UPDATE users 
     SET password_hash = $1, must_change_password = $2,
         session_version = session_version + 1
     WHERE users_id = $3
       AND ($4::integer IS NULL OR (session_version = $4 AND status = 'active'))
     RETURNING users_id, name, email, role, is_shared_account, must_change_password, session_version`,
    [passwordHash, mustChangePassword, id, expectedSessionVersion]
  );
  return result.rows[0] || null;
}

module.exports = {
  findByEmail,
  findById,
  findSessionById,
  getAllUsers,
  getActiveDrivers,
  createUser,
  updateUser,
  updatePassword,
};
