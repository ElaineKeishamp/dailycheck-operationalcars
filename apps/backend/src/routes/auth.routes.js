const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { login, changePassword } = require('../controllers/auth.controller');

router.post('/login', login);
router.post('/change-password', verifyToken, changePassword);

module.exports = router;