const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userModel = require('../models/user.model');
const vehicleModel = require('../models/vehicle.model');
const dailyCheckModel = require('../models/dailyCheck.model');
const storageService = require('../services/storage.service');

async function resetPassword(req, res) {
  const { id } = req.params;

  try {
    const userCheck = await userModel.findById(id);
    if (!userCheck) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 10);

    await userModel.updatePassword(id, hash, true);

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
    const reports = await dailyCheckModel.getAllReports({ date, status: null });
    
    // Filter if driver_id or vehicle_id requested
    let filtered = reports;
    if (driver_id) {
      filtered = filtered.filter(r => r.users_id === driver_id);
    }
    if (vehicle_id) {
      filtered = filtered.filter(r => r.vehicle_id === vehicle_id);
    }

    res.json({ reports: filtered });
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

    const photos = await dailyCheckModel.getPhotosByDailyId(id);

    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        let viewUrl = null;
        try {
          if (photo.r2_key) {
            viewUrl = await storageService.generateViewPresignedUrl(photo.r2_key);
          }
        } catch {
          viewUrl = null;
        }
        return {
          ...photo,
          url: viewUrl,
        };
      })
    );

    res.json({
      report,
      photos: photosWithUrls,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getTodayStatus(req, res) {
  try {
    const allDrivers = await userModel.getActiveDrivers();
    const checkedUserIds = await dailyCheckModel.getCheckedTodayUserIds();
    const notCheckedDrivers = allDrivers.filter(
      driver => !checkedUserIds.includes(driver.users_id)
    );

    const allVehicles = await vehicleModel.getAllVehicles();
    const activeVehicles = allVehicles.filter(v => v.status === 'active');
    const checkedVehicleIds = await dailyCheckModel.getCheckedTodayVehicleIds();
    const notCheckedVehicles = activeVehicles.filter(
      v => !checkedVehicleIds.includes(v.vehicle_id)
    );

    res.json({
      total_driver: allDrivers.length,
      sudah_checking: checkedUserIds.length,
      belum_checking: notCheckedDrivers,
      driver_stats: {
        total: allDrivers.length,
        sudah_checking: checkedUserIds.length,
        belum_checking: notCheckedDrivers,
      },
      vehicle_stats: {
        total: activeVehicles.length,
        sudah_checking: checkedVehicleIds.length,
        belum_checking: notCheckedVehicles,
      },
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

    const user = await userModel.createUser({
      name,
      email,
      password_hash: hash,
      role,
      is_shared_account,
    });

    res.status(201).json({
      user,
      temporary_password: tempPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await userModel.getAllUsers();
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { name, role, is_shared_account, status } = req.body;

  try {
    const existing = await userModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    if (id === req.user.id && status === 'inactive') {
      return res.status(400).json({ error: 'Anda tidak dapat menonaktifkan akun Anda sendiri' });
    }

    if (existing.email === 'admin@test.com') {
      if (status === 'inactive') {
        return res.status(400).json({ error: 'Akun Super Admin Utama tidak dapat dinonaktifkan' });
      }
      if (role && role !== 'admin') {
        return res.status(400).json({ error: 'Role Super Admin Utama tidak dapat diubah' });
      }
    }

    if (role && !['admin', 'driver'].includes(role)) {
      return res.status(400).json({ error: 'role harus admin atau driver' });
    }
    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status harus active atau inactive' });
    }

    const updatedUser = await userModel.updateUser(id, {
      role: role || existing.role,
      status: status || existing.status,
    });

    res.json({ user: updatedUser });
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

    const vehicle = await vehicleModel.createVehicle({ plate_number, brand, model });

    res.status(201).json({ vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function getAllVehicles(req, res) {
  try {
    const vehicles = await vehicleModel.getAllVehicles();
    res.json({ vehicles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

async function updateVehicle(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const existing = await vehicleModel.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Mobil tidak ditemukan' });
    }

    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status harus active atau inactive' });
    }

    const vehicle = await vehicleModel.updateVehicle(id, {
      status: status || existing.status,
    });

    res.json({ vehicle });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}

module.exports = { resetPassword, getAllReports, getReportDetail, getTodayStatus, createUser, getAllUsers, updateUser, createVehicle, getAllVehicles, updateVehicle };