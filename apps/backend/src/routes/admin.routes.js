const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { resetPassword, getAllReports, getReportDetail, getTodayStatus, createUser, getAllUsers, updateUser, createVehicle, getAllVehicles, updateVehicle } = require('../controllers/admin.controller');
const { body, param } = require('express-validator');
const validate = require('../middlewares/validate');

router.post(
	'/users',
	verifyToken,
	requireAdmin,
	[
		body('name').notEmpty().withMessage('name wajib diisi'),
		body('email').isEmail().withMessage('email tidak valid'),
		body('role').isIn(['admin', 'driver']).withMessage('role harus admin atau driver'),
		body('is_shared_account').optional().isBoolean().withMessage('is_shared_account harus boolean'),
		validate,
	],
	createUser
);
router.get('/users', verifyToken, requireAdmin, getAllUsers);
router.patch(
	'/users/:id',
	verifyToken,
	requireAdmin,
	[
		param('id').notEmpty().withMessage('id wajib diisi'),
		body('role').optional().isIn(['admin', 'driver']).withMessage('role harus admin atau driver'),
		body('status').optional().isIn(['active', 'inactive']).withMessage('status harus active atau inactive'),
		validate,
	],
	updateUser
);
router.patch('/users/:id/reset-password', verifyToken, requireAdmin, [param('id').notEmpty().withMessage('id wajib diisi'), validate], resetPassword);
router.post(
	'/vehicles',
	verifyToken,
	requireAdmin,
	[
		body('plate_number').notEmpty().withMessage('plate_number wajib diisi'),
		body('brand').notEmpty().withMessage('brand wajib diisi'),
		body('model').notEmpty().withMessage('model wajib diisi'),
		validate,
	],
	createVehicle
);
router.get('/vehicles', verifyToken, requireAdmin, getAllVehicles);
router.patch(
	'/vehicles/:id',
	verifyToken,
	requireAdmin,
	[
		param('id').notEmpty().withMessage('id wajib diisi'),
		body('status').optional().isIn(['active', 'inactive']).withMessage('status harus active atau inactive'),
		validate,
	],
	updateVehicle
);
router.get('/daily-checks', verifyToken, requireAdmin, getAllReports);
router.get('/daily-checks/:id', verifyToken, requireAdmin, [param('id').notEmpty().withMessage('id wajib diisi'), validate], getReportDetail);
router.get('/dashboard/today', verifyToken, requireAdmin, getTodayStatus);

module.exports = router;