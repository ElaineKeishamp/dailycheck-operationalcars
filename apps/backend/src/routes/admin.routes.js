const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { resetPassword, getAllReports, getReportDetail, getTodayStatus, createUser, getAllUsers, updateUser, createVehicle, getAllVehicles, updateVehicle } = require('../controllers/admin.controller');

router.post('/users', verifyToken, requireAdmin, createUser);
router.get('/users', verifyToken, requireAdmin, getAllUsers);
router.patch('/users/:id', verifyToken, requireAdmin, updateUser);
router.patch('/users/:id/reset-password', verifyToken, requireAdmin, resetPassword);
router.post('/vehicles', verifyToken, requireAdmin, createVehicle);
router.get('/vehicles', verifyToken, requireAdmin, getAllVehicles);
router.patch('/vehicles/:id', verifyToken, requireAdmin, updateVehicle);
router.get('/daily-checks', verifyToken, requireAdmin, getAllReports);
router.get('/daily-checks/:id', verifyToken, requireAdmin, getReportDetail);
router.get('/dashboard/today', verifyToken, requireAdmin, getTodayStatus);

module.exports = router;