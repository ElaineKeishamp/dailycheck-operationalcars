const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { resetPassword, getAllReports, getReportDetail, getTodayStatus } = require('../controllers/admin.controller');

router.patch('/users/:id/reset-password', verifyToken, requireAdmin, resetPassword);
router.get('/daily-checks', verifyToken, requireAdmin, getAllReports);
router.get('/daily-checks/:id', verifyToken, requireAdmin, getReportDetail);
router.get('/dashboard/today', verifyToken, requireAdmin, getTodayStatus);

module.exports = router;