const pool = require('../config/db');

async function getAllVehicles() {
  const result = await pool.query(
    `SELECT vehicle_id, plate_number, brand, model, status, created_at 
     FROM vehicles 
     ORDER BY plate_number ASC`
  );
  return result.rows;
}

async function findActive() {
  const result = await pool.query(
    `SELECT vehicle_id, plate_number, brand, model, status
     FROM vehicles
     WHERE status = 'active'
     ORDER BY plate_number ASC`
  );
  return result.rows;
}

async function findById(id) {
  const result = await pool.query('SELECT * FROM vehicles WHERE vehicle_id = $1', [id]);
  return result.rows[0] || null;
}

async function findByPlateNumber(plateNumber) {
  const result = await pool.query('SELECT * FROM vehicles WHERE plate_number = $1', [plateNumber]);
  return result.rows[0] || null;
}

async function createVehicle({ plate_number, brand, model }) {
  const result = await pool.query(
    `INSERT INTO vehicles (plate_number, brand, model)
     VALUES ($1, $2, $3) 
     RETURNING vehicle_id, plate_number, brand, model, status, created_at`,
    [plate_number, brand, model]
  );
  return result.rows[0];
}

async function updateVehicle(id, { status }) {
  const result = await pool.query(
    `UPDATE vehicles SET status = $1 WHERE vehicle_id = $2 RETURNING vehicle_id, plate_number, brand, model, status`,
    [status, id]
  );
  return result.rows[0] || null;
}

module.exports = {
  getAllVehicles,
  findActive,
  findById,
  findByPlateNumber,
  createVehicle,
  updateVehicle,
};
