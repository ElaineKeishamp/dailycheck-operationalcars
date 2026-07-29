const vehicleModel = require('../models/vehicle.model');

async function getActiveVehicles(req, res) {
  try {
    const vehicles = await vehicleModel.findActive();
    res.json({ vehicles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = { getActiveVehicles };
