const express = require('express');
const router = express.Router();
const { submitFeedback } = require('../controllers/feedback.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.post('/hostel/:id/feedback', verifyJWT, submitFeedback);

module.exports = router;