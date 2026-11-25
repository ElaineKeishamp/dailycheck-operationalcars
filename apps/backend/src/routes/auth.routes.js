const express = require('express');
const router = express.Router();
const { verifyPasswordChangeToken } = require('../middlewares/auth');
const { login, changePassword } = require('../controllers/auth.controller');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const { createLoginRateLimiter } = require('../middlewares/loginRateLimit');

router.post(
	'/login',
	createLoginRateLimiter(),
	[
		body('email').isString().bail().trim().isEmail().withMessage('Email tidak valid').isLength({ max: 100 }),
		body('password').isString().bail().notEmpty().withMessage('Password wajib diisi'),
		validate,
	],
	login
);
router.post(
	'/change-password',
	verifyPasswordChangeToken,
	[
		body('old_password').isString().bail().notEmpty().withMessage('Password lama wajib diisi'),
		body('new_password').isString().bail().isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter'),
		validate,
	],
	changePassword
);

module.exports = router;
