const vehicleModel = require('../models/vehicle.model');
const dailyCheckModel = require('../models/dailyCheck.model');

async function getActiveVehicles(req, res) {
  try {
    const vehicles = await vehicleModel.findActive();
    const checkedVehicleIds = await dailyCheckModel.getCheckedTodayVehicleIds();

    const vehiclesWithCheckStatus = vehicles.map(vehicle => ({
      ...vehicle,
      checked_today: checkedVehicleIds.includes(vehicle.vehicle_id),
    }));

    res.json({ vehicles: vehiclesWithCheckStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = { getActiveVehicles };
