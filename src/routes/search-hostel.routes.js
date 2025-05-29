const express = require('express');
const router = express.Router();
const { searchHostels } = require('../controllers/search-hostel.controller');

router.post('/search-hostels', searchHostels);

module.exports = router;