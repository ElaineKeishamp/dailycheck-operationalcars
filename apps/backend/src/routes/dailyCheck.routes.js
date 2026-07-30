const express = require('express');
const router = express.Router();
const { verifyToken, requireDriver } = require('../middlewares/auth');
const {
	startDailyCheck,
	getActiveDailyCheck,
	getMyTodayCheck,
	getMyHistory,
	getPhotoUploadUrl,
	uploadPhoto,
	cancelPhotoUpload,
	getDailyCheckPhotos,
	deleteDailyCheckPhoto,
	submitDailyCheck,
} = require('../controllers/dailyCheck.controller');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validate');

const VALID_PART_TYPES = [
	'odo', 'body_kiri', 'body_kanan', 'kap', 'depan', 'belakang', 'interior', 'ban', 'lainnya',
];

router.post(
	'/',
	verifyToken,
	requireDriver,
	[
		body('vehicle_id').notEmpty().withMessage('vehicle_id wajib diisi'),
		body('gps_lat').optional().isFloat().withMessage('gps_lat harus angka'),
		body('gps_long').optional().isFloat().withMessage('gps_long harus angka'),
		validate,
	],
	startDailyCheck
);

router.get(
	'/active',
	verifyToken,
	requireDriver,
	[
		query('vehicle_id').notEmpty().withMessage('vehicle_id wajib diisi'),
		validate,
	],
	getActiveDailyCheck
);

router.get('/my-today', verifyToken, requireDriver, getMyTodayCheck);
router.get('/my-history', verifyToken, requireDriver, getMyHistory);

// Minta Presigned Upload URL ke MinIO
router.post(
	'/:dailyCheckId/photo-url',
	verifyToken,
	requireDriver,
	[
		param('dailyCheckId').notEmpty().withMessage('dailyCheckId wajib diisi'),
		body('part_type').notEmpty().isIn(VALID_PART_TYPES).withMessage('part_type tidak valid'),
		body('part_index').optional({ nullable: true }).isInt({ min: 1, max: 4 }).withMessage('part_index harus 1 sampai 4'),
		body('content_type').optional().isIn(['image/jpeg', 'image/png', 'image/webp']).withMessage('content_type tidak valid'),
		validate,
	],
	getPhotoUploadUrl
);

// Konfirmasi Simpan Record Foto ke PostgreSQL setelah Upload MinIO selesai
router.post(
	'/:dailyCheckId/photos',
	verifyToken,
	requireDriver,
	[
		param('dailyCheckId').isUUID().withMessage('dailyCheckId tidak valid'),
		body('upload_ticket').notEmpty().isString().withMessage('upload_ticket wajib diisi'),
		body('note').optional().isString(),
		validate,
	],
	uploadPhoto
);

router.post(
	'/:dailyCheckId/photo-uploads/cancel',
	verifyToken,
	requireDriver,
	[
		param('dailyCheckId').isUUID().withMessage('dailyCheckId tidak valid'),
		body('upload_ticket').notEmpty().isString().withMessage('upload_ticket wajib diisi'),
		validate,
	],
	cancelPhotoUpload
);

router.get(
	'/:dailyCheckId/photos',
	verifyToken,
	requireDriver,
	[param('dailyCheckId').notEmpty().withMessage('dailyCheckId wajib diisi'), validate],
	getDailyCheckPhotos
);

router.delete(
	'/:dailyCheckId/photos/:photoId',
	verifyToken,
	requireDriver,
	[
		param('dailyCheckId').isUUID().withMessage('dailyCheckId tidak valid'),
		param('photoId').isUUID().withMessage('photoId tidak valid'),
		validate,
	],
	deleteDailyCheckPhoto
);

router.post('/:dailyCheckId/submit', verifyToken, requireDriver, [param('dailyCheckId').notEmpty().withMessage('dailyCheckId wajib diisi'), validate], submitDailyCheck);

module.exports = router;
