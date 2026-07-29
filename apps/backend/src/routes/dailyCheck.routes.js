const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { startDailyCheck, uploadPhoto, submitDailyCheck } = require('../controllers/dailyCheck.controller');
const { body, param } = require('express-validator');
const validate = require('../middlewares/validate');
const { uploadPhotoFile } = require('../middlewares/photoUpload');

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

router.post(
	'/:dailyCheckId/photos',
	verifyToken,
	uploadPhotoFile,
	[
		param('dailyCheckId').notEmpty().withMessage('dailyCheckId wajib diisi'),
		body('part_type').notEmpty().isIn(VALID_PART_TYPES).withMessage('part_type tidak valid'),
		body('note').optional().isString(),
		validate,
	],
	uploadPhoto
);

router.post('/:dailyCheckId/submit', verifyToken, [param('dailyCheckId').notEmpty().withMessage('dailyCheckId wajib diisi'), validate], submitDailyCheck);


module.exports = router;
