const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/chat.controller');
const { verifyJWT } = require('../middlewares/auth.middleware');

router.get('/:roomId', verifyJWT, getMessages);
router.post('/:roomId', verifyJWT, sendMessage); 

module.exports = router;
