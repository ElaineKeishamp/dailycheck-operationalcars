const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { startDailyCheck, getPhotoUploadUrl, uploadPhoto, submitDailyCheck } = require('../controllers/dailyCheck.controller');
const { body, param } = require('express-validator');
const validate = require('../middlewares/validate');

const VALID_PART_TYPES = [
	'odo', 'body_kiri', 'body_kanan', 'kap', 'depan', 'belakang', 'interior', 'ban', 'lainnya',
];

router.post(
	'/',
	verifyToken,
	[
		body('vehicle_id').notEmpty().withMessage('vehicle_id wajib diisi'),
		body('gps_lat').optional().isFloat().withMessage('gps_lat harus angka'),
		body('gps_long').optional().isFloat().withMessage('gps_long harus angka'),
		validate,
	],
	startDailyCheck
);

// Minta Presigned Upload URL ke MinIO
router.post(
	'/:dailyCheckId/photo-url',
	verifyToken,
	[
		param('dailyCheckId').notEmpty().withMessage('dailyCheckId wajib diisi'),
		body('part_type').notEmpty().isIn(VALID_PART_TYPES).withMessage('part_type tidak valid'),
		validate,
	],
	getPhotoUploadUrl
);

// Konfirmasi Simpan Record Foto ke PostgreSQL setelah Upload MinIO selesai
router.post(
	'/:dailyCheckId/photos',
	verifyToken,
	[
		param('dailyCheckId').notEmpty().withMessage('dailyCheckId wajib diisi'),
		body('part_type').notEmpty().isIn(VALID_PART_TYPES).withMessage('part_type tidak valid'),
		body('key').optional().isString(),
		body('note').optional().isString(),
		validate,
	],
	uploadPhoto
);

router.post('/:dailyCheckId/submit', verifyToken, [param('dailyCheckId').notEmpty().withMessage('dailyCheckId wajib diisi'), validate], submitDailyCheck);

module.exports = router;