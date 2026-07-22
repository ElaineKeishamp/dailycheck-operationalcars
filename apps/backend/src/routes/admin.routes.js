const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { resetPassword } = require('../controllers/admin.controller');

router.patch('/users/:id/reset-password', verifyToken, requireAdmin, resetPassword);

module.exports = router;