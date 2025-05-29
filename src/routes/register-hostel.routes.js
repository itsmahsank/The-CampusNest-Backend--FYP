const express = require('express');
const router = express.Router();
const { registerHostel } = require('../controllers/register-hostel.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');
const { upload } = require('../middlewares/multer.middleware');

router.post('/register-hostel',verifyJWT, upload.single('virtualTour'), registerHostel);

module.exports = router;

