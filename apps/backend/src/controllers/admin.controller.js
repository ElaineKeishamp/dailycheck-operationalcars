const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userModel = require('../models/user.model');
const vehicleModel = require('../models/vehicle.model');
const dailyCheckModel = require('../models/dailyCheck.model');
const checkPhotoModel = require('../models/checkPhoto.model');

async function resetPassword(req, res) {
  const { id } = req.params;

  try {
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);
    await userModel.updatePasswordHash(id, hash, true);

    res.json({ message: 'Password berhasil direset', temporary_password: tempPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getAllReports(req, res) {
  const { date, driver_id, vehicle_id } = req.query;

  try {
    const reports = await dailyCheckModel.findAllWithFilters({
      date,
      driverId: driver_id,
      vehicleId: vehicle_id,
    });
    res.json({ reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getReportDetail(req, res) {
  const { id } = req.params;

  try {
    const report = await dailyCheckModel.findById(id);
    if (!report) {
      return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    }

    const photos = await checkPhotoModel.findByDailyId(id);

    res.json({ report, photos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getTodayStatus(req, res) {
  try {
    const allDrivers = await userModel.findActiveDrivers();
    const checkedToday = await dailyCheckModel.findAllChecked();
    const checkedIds = checkedToday.map((r) => r.users_id);

    const notCheckedYet = allDrivers.filter((driver) => !checkedIds.includes(driver.users_id));

    res.json({
      total_driver: allDrivers.length,
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
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);

    const user = await userModel.create({
      name,
      email,
      passwordHash: hash,
      role,
      isSharedAccount: is_shared_account,
    });

    res.status(201).json({ user, temporary_password: tempPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await userModel.findAll();
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { name, role, is_shared_account, status } = req.body;

  if (role && !['admin', 'driver'].includes(role)) {
    return res.status(400).json({ error: 'role harus admin atau driver' });
  }
  if (status && !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'status harus active atau inactive' });
  }

  try {
    const user = await userModel.update(id, { name, role, isSharedAccount: is_shared_account, status });
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json({ user });
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
    const existing = await vehicleModel.findByPlateNumber(plate_number);
    if (existing) {
      return res.status(409).json({ error: 'Plat nomor sudah terdaftar' });
    }

    const vehicle = await vehicleModel.create({ plateNumber: plate_number, brand, model });
    res.status(201).json({ vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getAllVehicles(req, res) {
  try {
    const vehicles = await vehicleModel.findAll();
    res.json({ vehicles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function updateVehicle(req, res) {
  const { id } = req.params;
  const { plate_number, brand, model, status } = req.body;

  if (status && !['active', 'inactive'].includes(status)) {
    return res.status(400).json({ error: 'status harus active atau inactive' });
  }

  try {
    const vehicle = await vehicleModel.update(id, { plateNumber: plate_number, brand, model, status });
    if (!vehicle) {
      return res.status(404).json({ error: 'Mobil tidak ditemukan' });
    }
    res.json({ vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = {
  resetPassword,
  getAllReports,
  getReportDetail,
  getTodayStatus,
  createUser,
  getAllUsers,
  updateUser,
  createVehicle,
  getAllVehicles,
  updateVehicle,
};