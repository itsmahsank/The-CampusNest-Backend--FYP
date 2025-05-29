const express = require('express');
const router = express.Router();
const { compareHostels } = require('../controllers/compare-hostel.controller.js');

router.post('/compare-hostels', compareHostels);

module.exports = router;