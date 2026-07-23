const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { startDailyCheck, uploadPhoto, submitDailyCheck } = require('../controllers/dailyCheck.controller');


router.post('/', verifyToken, startDailyCheck);
router.post('/:dailyCheckId/photos', verifyToken, uploadPhoto);
router.post('/:dailyCheckId/submit', verifyToken, submitDailyCheck);


module.exports = router;