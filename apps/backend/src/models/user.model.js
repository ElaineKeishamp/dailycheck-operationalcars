const pool = require('../config/db');

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM users WHERE users_id = $1', [id]);
  return result.rows[0];
}

async function findAll() {
  const result = await pool.query(
    `SELECT users_id, name, email, role, is_shared_account, status, must_change_password, created_at 
     FROM users 
     ORDER BY role ASC, name ASC`
  );
  return result.rows;
}

async function findActiveDrivers() {
  const result = await pool.query(
    `SELECT users_id, name, email FROM users WHERE role = 'driver' AND status = 'active'`
  );
  return result.rows;
}

async function create({ name, email, passwordHash, role, isSharedAccount }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, is_shared_account, must_change_password)
     VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING users_id, name, email, role, is_shared_account, status`,
    [name, email, passwordHash, role, isSharedAccount || false]
  );
  return result.rows[0];
}

async function updatePasswordHash(id, passwordHash, mustChangePassword) {
  await pool.query(
    `UPDATE users SET password_hash = $1, must_change_password = $2 WHERE users_id = $3`,
    [passwordHash, mustChangePassword, id]
  );
}

async function update(id, { name, role, isSharedAccount, status }) {
  const current = await findById(id);
  if (!current) return null;

  const result = await pool.query(
    `UPDATE users 
     SET name = $1, role = $2, is_shared_account = $3, status = $4
     WHERE users_id = $5 
     RETURNING users_id, name, email, role, is_shared_account, status`,
    [
      name || current.name,
      role || current.role,
      isSharedAccount !== undefined ? isSharedAccount : current.is_shared_account,
      status || current.status,
      id,
    ]
  );
  return result.rows[0];
}

module.exports = {
  findByEmail,
  findById,
  findAll,
  findActiveDrivers,
  create,
  updatePasswordHash,
  update,
};