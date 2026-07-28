const pool = require('../config/db');

async function findById(id) {
  const result = await pool.query('SELECT * FROM vehicles WHERE vehicle_id = $1', [id]);
  return result.rows[0];
}

async function findActiveById(id) {
  const result = await pool.query(
    'SELECT * FROM vehicles WHERE vehicle_id = $1 AND status = $2',
    [id, 'active']
  );
  return result.rows[0];
}

async function findByPlateNumber(plateNumber) {
  const result = await pool.query('SELECT * FROM vehicles WHERE plate_number = $1', [plateNumber]);
  return result.rows[0];
}

async function findAll() {
  const result = await pool.query('SELECT * FROM vehicles ORDER BY status ASC, plate_number ASC');
  return result.rows;
}

async function create({ plateNumber, brand, model }) {
  const result = await pool.query(
    `INSERT INTO vehicles (plate_number, brand, model) VALUES ($1, $2, $3) RETURNING *`,
    [plateNumber, brand, model]
  );
  return result.rows[0];
}

async function update(id, { plateNumber, brand, model, status }) {
  const current = await findById(id);
  if (!current) return null;

  const result = await pool.query(
    `UPDATE vehicles 
     SET plate_number = $1, brand = $2, model = $3, status = $4
     WHERE vehicle_id = $5 
     RETURNING *`,
    [
      plateNumber || current.plate_number,
      brand || current.brand,
      model || current.model,
      status || current.status,
      id,
    ]
  );
  return result.rows[0];
}

module.exports = { findById, findActiveById, findByPlateNumber, findAll, create, update };