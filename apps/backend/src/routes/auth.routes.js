const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { login, changePassword } = require('../controllers/auth.controller');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

router.post(
	'/login',
	[
		body('email').isEmail().withMessage('Email tidak valid'),
		body('password').notEmpty().withMessage('Password wajib diisi'),
		validate,
	],
	login
);
router.post(
	'/change-password',
	verifyToken,
	[
		body('old_password').notEmpty().withMessage('Password lama wajib diisi'),
		body('new_password').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter'),
		validate,
	],
	changePassword
);

module.exports = router;