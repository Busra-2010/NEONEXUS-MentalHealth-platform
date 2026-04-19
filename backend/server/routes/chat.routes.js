const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');

// POST /api/chat/session — Create anonymous session
router.post('/session', chatController.createSession);

// POST /api/chat/message — Send message, get reply with crisis detection + intent
router.post('/message', chatController.handleMessage);

module.exports = router;
