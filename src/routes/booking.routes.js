const express = require('express');
const router = express.Router();
const { createBooking, processPayment } = require('../controllers/booking.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.post('/bookings', verifyJWT, createBooking);
router.post('/bookings/pay', verifyJWT, processPayment);

module.exports = router;