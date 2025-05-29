const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboard.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.get('/dashboard', verifyJWT, getDashboardData);

module.exports = router;