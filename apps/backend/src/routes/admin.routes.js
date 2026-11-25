const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { resetPassword, getAllReports, getReportDetail, getTodayStatus, createUser, getAllUsers, updateUser, createVehicle, getAllVehicles, updateVehicle } = require('../controllers/admin.controller');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validate');

router.post(
	'/users',
	verifyToken,
	requireAdmin,
	[
		body('name').isString().bail().trim().notEmpty().withMessage('name wajib diisi').isLength({ max: 100 }),
		body('email').isString().bail().trim().isEmail().withMessage('email tidak valid').isLength({ max: 100 }),
		body('role').isString().bail().isIn(['admin', 'driver']).withMessage('role harus admin atau driver'),
		body('is_shared_account').optional().custom(value => typeof value === 'boolean').withMessage('is_shared_account harus boolean'),
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
		param('id').isUUID().withMessage('id tidak valid'),
		body('name').optional().isString().bail().trim().notEmpty().withMessage('name wajib diisi').isLength({ max: 100 }),
		body('is_shared_account').optional().custom(value => typeof value === 'boolean').withMessage('is_shared_account harus boolean'),
		body('role').optional().isString().bail().isIn(['admin', 'driver']).withMessage('role harus admin atau driver'),
		body('status').optional().isString().bail().isIn(['active', 'inactive']).withMessage('status harus active atau inactive'),
		validate,
	],
	updateUser
);
router.patch('/users/:id/reset-password', verifyToken, requireAdmin, [param('id').isUUID().withMessage('id tidak valid'), validate], resetPassword);
router.post(
	'/vehicles',
	verifyToken,
	requireAdmin,
	[
		body('plate_number').isString().bail().trim().notEmpty().withMessage('plate_number wajib diisi').isLength({ max: 20 }),
		body('brand').isString().bail().trim().notEmpty().withMessage('brand wajib diisi').isLength({ max: 50 }),
		body('model').isString().bail().trim().notEmpty().withMessage('model wajib diisi').isLength({ max: 50 }),
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
		param('id').isUUID().withMessage('id tidak valid'),
		body('status').optional().isString().bail().isIn(['active', 'inactive']).withMessage('status harus active atau inactive'),
		validate,
	],
	updateVehicle
);
router.get('/daily-checks', verifyToken, requireAdmin, [
	query('date').optional().isString().bail().matches(/^\d{4}-\d{2}-\d{2}$/).bail().isISO8601({ strict: true }).withMessage('date harus tanggal YYYY-MM-DD yang valid'),
	query('driver_id').optional().isString().bail().isUUID().withMessage('driver_id tidak valid'),
	query('vehicle_id').optional().isString().bail().isUUID().withMessage('vehicle_id tidak valid'),
	validate,
], getAllReports);
router.get('/daily-checks/:id', verifyToken, requireAdmin, [param('id').isUUID().withMessage('id tidak valid'), validate], getReportDetail);
router.get('/dashboard/today', verifyToken, requireAdmin, getTodayStatus);

module.exports = router;
