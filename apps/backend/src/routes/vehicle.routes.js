const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { getActiveVehicles } = require('../controllers/vehicle.controller');

router.get('/', verifyToken, getActiveVehicles);

module.exports = router;
